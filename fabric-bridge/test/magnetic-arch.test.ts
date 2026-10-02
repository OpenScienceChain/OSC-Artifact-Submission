import request from 'supertest';

const token = 'test-ledger-gateway-token-00000001';
const magneticId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const nsgId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const artifactId = '33333333-3333-4333-8333-333333333333';
let app: any;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.FABRIC_REAL_MODE = 'false';
  process.env.MSP_ID = 'MagneticArchMSP';
  process.env.ORGANIZATION_ID = magneticId;
  process.env.MAGNETIC_ARCH_ORGANIZATION_ID = magneticId;
  process.env.NSG_ORGANIZATION_ID = nsgId;
  process.env.LEDGER_GATEWAY_TOKEN = token;
  app = (await import('../src/server')).app;
});

function command(id: string, mspId: string) {
  return {
    contractVersion: 'v3',
    artifactId,
    organization: { id, name: 'Magnetic Arch Plasma Showcase', mspId },
    title: 'Magnetic arch measurement S0',
    visibility: 'public',
    footprint: 'a'.repeat(64),
    description: 'A curated measurement manifest from Zenodo.',
    manifest: [{ filename: 'S0_0deg.csv', hash: 'a'.repeat(64), algorithm: 'sha256' }],
    keywords: ['magnetic-arch-plasma-example'],
    contributor: 'curator@example.test',
    correlationId: 'magnetic-test-1',
    request: {
      authenticatedUserId: 'curator-id',
      organizationId: id,
      correlationId: 'magnetic-test-1',
      operation: 'artifact.create',
      requestedAt: '2026-09-29T00:00:00.000Z'
    }
  };
}

describe('Magnetic Arch bridge identity', () => {
  it('accepts a matching third-organization submission', async () => {
    const response = await request(app).post('/submit')
      .set('Authorization', `Bearer ${token}`)
      .send(command(magneticId, 'MagneticArchMSP'))
      .expect(200);
    expect(response.body).toMatchObject({
      success: true,
      peerMsp: 'MagneticArchMSP',
      result: { organizationId: magneticId, organizationMsp: 'MagneticArchMSP' }
    });
  });

  it('rejects an NSG envelope on the third-organization peer', async () => {
    await request(app).post('/submit')
      .set('Authorization', `Bearer ${token}`)
      .send(command(nsgId, 'NSGMSP'))
      .expect(403);
  });
});
