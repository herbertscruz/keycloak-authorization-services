import { AxiosError } from 'axios';
import debugPkg from 'debug';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import JWTTokenService from '../services/JWTTokenService';
import KeycloakAuthorizationService from '../services/KeycloakAuthorizationService';
const debug = debugPkg(
  'keycloak-authorization-service:authorization-by-permission',
);

interface KeycloakAuthorizationConfig {
  baseUrl: string;
  realm: string;
  timeout?: number;
  clientId: string;
  clientSecret: string;
}

interface KeycloakAuthorizationByPermission {
  claimToken?: object;
  permission?: { resource?: string; scopes?: string[] };
  audience?: string;
}

export default function authorizationByPermission(
  config: KeycloakAuthorizationConfig,
  params: KeycloakAuthorizationByPermission,
): RequestHandler {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      debug(config);
      debug(params);

      const token = (req?.headers?.authorization || '').replace('Bearer ', '');
      debug(token);

      const jwtToken = new JWTTokenService(config);
      const service = new KeycloakAuthorizationService(config, jwtToken);
      const { result } = await service.authorizationRequest(
        {
          ...params,
          claim_token: params.claimToken,
          response_mode: 'decision',
        },
        {
          token,
          clientId: config?.clientId,
          clientSecret: config?.clientSecret,
        },
      );

      if (!result) throw new AxiosError('Forbidden', '401');
      next();
    } catch (error) {
      debug(error);
      next(error);
    }
  };
}
