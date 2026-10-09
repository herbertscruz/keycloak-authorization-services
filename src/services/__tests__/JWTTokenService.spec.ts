/**
 * @group unit/test
 */
import jwt from 'jsonwebtoken';
import jwksClient = require('jwks-rsa');
import JWTTokenService from '../JWTTokenService';

jest.mock('jwks-rsa');

// Regression test for BGS-50195: under load the previous implementation created
// a new jwks-rsa client on every getKey() call (one per request), so each token
// validation hit GET /certs. That saturated the Keycloak /certs route and was
// rejected upstream (Kong) with HTTP 429 "Too Many Requests". The fix caches the
// client per JWKS URI and enables the jwks-rsa cache, so the signing key is
// fetched once per kid and reused across all requests/instances.

describe('JWTTokenService JWKS client caching (BGS-50195)', () => {
  const getSigningKey = jest.fn().mockResolvedValue({
    getPublicKey: () => 'PUBLIC_KEY',
  });
  const jwksClientFactory = jwksClient as unknown as jest.Mock;

  beforeEach(() => {
    // Reset the module-level shared cache between tests.
    (JWTTokenService as any).jwksClients.clear();
    jwksClientFactory.mockReset();
    getSigningKey.mockClear();
    jwksClientFactory.mockReturnValue({ getSigningKey });

    jest
      .spyOn(jwt, 'verify')
      .mockImplementation((_token: any, getKey: any, cb: any): any => {
        getKey({ kid: 'kid-1' }, (err: any, key: any) =>
          cb(err, key ? { sub: 'user' } : undefined),
        );
      });
  });

  afterEach(() => jest.restoreAllMocks());

  const config = { baseUrl: 'https://kc.example', realm: 'bip-asia' };

  it('creates the jwks client once and enables caching', async () => {
    // Simulate 60 validations across fresh service instances (one per request).
    for (let i = 0; i < 60; i++) {
      await new JWTTokenService(config as any).verifyAndDecode('token');
    }

    // Only ONE jwks-rsa client is created for the URI (was 60 before the fix).
    expect(jwksClientFactory).toHaveBeenCalledTimes(1);
    expect(jwksClientFactory).toHaveBeenCalledWith(
      expect.objectContaining({
        jwksUri:
          'https://kc.example/realms/bip-asia/protocol/openid-connect/certs',
        cache: true,
      }),
    );
  });

  it('reuses the same client instance for the same URI across requests', async () => {
    await new JWTTokenService(config as any).verifyAndDecode('token');
    await new JWTTokenService(config as any).verifyAndDecode('token');

    expect(jwksClientFactory).toHaveBeenCalledTimes(1);
  });

  it('keeps a separate client per realm/URI', async () => {
    await new JWTTokenService(config as any).verifyAndDecode('token');
    await new JWTTokenService({
      ...config,
      realm: 'bip-japan',
    } as any).verifyAndDecode('token');

    expect(jwksClientFactory).toHaveBeenCalledTimes(2);
  });
});
