import debugPkg from 'debug';
import jwt, { JwtPayload, VerifyCallback } from 'jsonwebtoken';
import jwksClient = require('jwks-rsa');
const debug = debugPkg('keycloak-authorization-service:jwt-token-service');

interface JWTTokenServiceConfig {
  baseUrl: string;
  realm: string;
  timeout?: number;
}

export default class JWTTokenService {
  /**
   * Shared jwks-rsa clients keyed by JWKS URI.
   *
   * Previously getKey() created a brand-new jwksClient on every call. Because a
   * JWTTokenService is instantiated per request (via validationByRoles /
   * validationByPermission), every token validation started with an empty cache
   * and issued one GET /certs per request. Under load this saturates the
   * Keycloak /certs route and gets rejected upstream with HTTP 429
   * ("Too Many Requests") — see BGS-50195. Caching the client per URI (plus the
   * built-in jwks-rsa signing-key cache) collapses that to one fetch per kid,
   * reused across all requests and instances.
   */
  private static readonly jwksClients = new Map<
    string,
    jwksClient.JwksClient
  >();

  constructor(private readonly config: JWTTokenServiceConfig) {}

  decode(token: string, options?: jwt.DecodeOptions & { complete: true }): any {
    const decoded = jwt.decode(token, options);
    debug(decoded);
    return decoded;
  }

  verifyAndDecode(token: string): Promise<any> {
    return new Promise(
      (resolve: (decoded: any) => void, reject: (error: Error) => void) => {
        const verifyCallback: VerifyCallback<JwtPayload | string> = (
          error: jwt.VerifyErrors | null,
          decoded: any,
        ): void => {
          if (error) {
            debug(error);
            return reject(error);
          }
          debug(decoded);
          return resolve(decoded);
        };

        jwt.verify(
          token,
          (...params) => this.getKey(...params),
          verifyCallback,
        );
      },
    );
  }

  private getKey(
    header: jwt.JwtHeader,
    callback: jwt.SigningKeyCallback,
  ): void {
    debug('---');
    debug(this.config);
    debug('---');
    const jwksUri = `${this.config.baseUrl}/realms/${this.config.realm}/protocol/openid-connect/certs`;
    debug(jwksUri);

    const client = JWTTokenService.getJwksClient(
      jwksUri,
      this.config?.timeout || 30000,
    );

    client
      .getSigningKey(header.kid)
      .then((key) => callback(null, key.getPublicKey()))
      .catch(callback);
  }

  /**
   * Returns a jwks-rsa client for the given URI, reusing a shared instance so
   * the signing-key cache survives across requests/instances. The jwks-rsa
   * cache is enabled so each kid is fetched once and served from memory until
   * it expires, instead of hitting GET /certs on every token validation.
   */
  private static getJwksClient(
    jwksUri: string,
    timeout: number,
  ): jwksClient.JwksClient {
    const existing = JWTTokenService.jwksClients.get(jwksUri);
    if (existing) return existing;

    const client = jwksClient({
      jwksUri,
      timeout,
      cache: true,
      cacheMaxEntries: 5,
      cacheMaxAge: 10 * 60 * 1000, // 10 minutes
    });
    JWTTokenService.jwksClients.set(jwksUri, client);
    return client;
  }
}
