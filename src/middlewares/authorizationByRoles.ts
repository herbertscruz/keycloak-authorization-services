import debugPkg from 'debug';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import IKeycloakAuthorizationByRoles from '../interfaces/IKeycloakAuthorizationByRoles';
import IKeycloakAuthorizationConfig from '../interfaces/IKeycloakAuthorizationConfig';
import validationByRoles from '../services/validationByRoles';
const debug = debugPkg('keycloak-authorization-service:authorization-by-roles');

export default function authorizationByRoles(
  config: IKeycloakAuthorizationConfig,
  options?: IKeycloakAuthorizationByRoles,
): RequestHandler {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      debug(config);
      debug(options);

      const token = (req?.headers?.authorization || '').replace('Bearer ', '');
      debug(token);

      await validationByRoles(token, config, options);
      next();
    } catch (error) {
      debug(error);
      next(error);
    }
  };
}
