import { AxiosError } from 'axios';
import debugPkg from 'debug';
import IKeycloakAuthorizationByPermission from '../interfaces/IKeycloakAuthorizationByPermission';
import IKeycloakAuthorizationConfig from '../interfaces/IKeycloakAuthorizationConfig';
import JWTTokenService from '../services/JWTTokenService';
import KeycloakAuthorizationService from '../services/KeycloakAuthorizationService';
const debug = debugPkg(
  'keycloak-authorization-service:validation-by-permission',
);

export default async function validationByPermission(
  token: string,
  config: IKeycloakAuthorizationConfig,
  options: IKeycloakAuthorizationByPermission,
): Promise<void> {
  try {
    debug(token);
    debug(config);
    debug(options);

    if (!token) throw new AxiosError('Forbidden', '401');

    const jwtToken = new JWTTokenService(config);
    const service = new KeycloakAuthorizationService(config, jwtToken);
    const { result } = await service.authorizationRequest(
      {
        ...options,
        claim_token: options.claimToken,
        response_mode: 'decision',
      },
      { token },
    );

    if (!result) throw new AxiosError('Forbidden', '401');
  } catch (error) {
    debug(error);
    throw error;
  }
}
