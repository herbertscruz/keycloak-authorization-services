import debugPkg from 'debug';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import IKeycloakAuthorizationByPermission from '../interfaces/IKeycloakAuthorizationByPermission';
import IKeycloakAuthorizationConfig from '../interfaces/IKeycloakAuthorizationConfig';
import validationByPermission from '../services/validationByPermission';
const debug = debugPkg(
  'keycloak-authorization-service:authorization-by-permission',
);

export default function authorizationByPermission(
  config: IKeycloakAuthorizationConfig,
  options: IKeycloakAuthorizationByPermission,
): RequestHandler {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      debug(config);
      debug(options);

      const token = (req?.headers?.authorization || '').replace('Bearer ', '');
      debug(token);

      await validationByPermission(token, config, options);
      next();
    } catch (error) {
      debug(error);
      next(error);
    }
  };
}
