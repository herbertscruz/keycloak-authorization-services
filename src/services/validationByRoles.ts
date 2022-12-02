import { AxiosError } from 'axios';
import debugPkg from 'debug';
import IKeycloakAuthorizationByRoles from '../interfaces/IKeycloakAuthorizationByRoles';
import IKeycloakAuthorizationConfig from '../interfaces/IKeycloakAuthorizationConfig';
import JWTTokenService from './JWTTokenService';
const debug = debugPkg('keycloak-authorization-service:validation-by-roles');

export default async function validationByRoles(
  token: string,
  config: IKeycloakAuthorizationConfig,
  options?: IKeycloakAuthorizationByRoles,
): Promise<void> {
  try {
    debug(token);
    debug(config);
    debug(options);

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
      const roles = [];

      const realmAccessRoles = decoded?.realm_access?.roles || [];
      roles.push(...realmAccessRoles);

      const client = options?.permission?.client || decoded.azp;
      const resourceAccessRoles =
        (decoded?.resource_access || {})[client]?.roles || [];
      roles.push(...resourceAccessRoles);

      debug(roles);

      if (!roles.some((r: string) => options?.permission?.roles.includes(r))) {
        throw new AxiosError('Forbidden', '401');
      }
    }
  } catch (error) {
    debug(error);
    throw error;
  }
}
