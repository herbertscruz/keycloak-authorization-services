import { AxiosError } from 'axios';
import debugPkg from 'debug';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import JWTTokenService from '../services/JWTTokenService';
const debug = debugPkg('keycloak-authorization-service:authorization-by-roles');

interface KeycloakAuthorizationConfig {
  baseUrl: string;
  realm: string;
  timeout?: number;
}

interface KeycloakAuthorizationByRoles {
  decodedType?: 'verify' | 'decode';
  permission?: { application?: string; roles: string[] };
}

export default function authorizationByRoles(
  config: KeycloakAuthorizationConfig,
  options?: KeycloakAuthorizationByRoles,
): RequestHandler {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      debug(config);
      debug(options);

      const token = (req?.headers?.authorization || '').replace('Bearer ', '');
      debug(token);
      if (!token) throw new AxiosError('Forbidden', '401');

      const jwtToken = new JWTTokenService(config);
      let decoded;
      if (options?.decodedType === 'decode') {
        decoded = jwtToken.decode(token);
      } else {
        decoded = await jwtToken.verifyAndDecode(token);
      }
      debug(decoded);

      if (options?.permission) {
        let roles = [];
        if (decoded?.clientId) {
          const application =
            options?.permission?.application || decoded?.clientId;
          roles = (decoded?.resource_access || {})[application]?.roles;
        } else {
          roles = decoded?.realm_access?.roles || [];
        }
        debug(roles);

        if (
          !roles.some((r: string) => options?.permission?.roles.includes(r))
        ) {
          throw new AxiosError('Forbidden', '401');
        }
      }
      next();
    } catch (error) {
      debug(error);
      next(error);
    }
  };
}
