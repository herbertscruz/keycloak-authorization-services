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
    const client = jwksClient({
      jwksUri,
      timeout: this.config?.timeout || 30000,
    });

    client
      .getSigningKey(header.kid)
      .then((key) => callback(null, key.getPublicKey()))
      .catch(callback);
  }
}
