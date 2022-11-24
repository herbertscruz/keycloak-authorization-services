/**
 * @group integration/test
 */
import debugPkg from 'debug';
import JWTTokenService from '../JWTTokenService';
import KeycloakAuthorizationService from '../KeycloakAuthorizationService';
const debug = debugPkg(
  'keycloak-authorization-service:keycloak-authorization-service-it',
);

const config = {
  baseUrl: 'http://host.docker.internal:8081',
  realm: 'main',
};

const jwtToken = new JWTTokenService(config);
const service = new KeycloakAuthorizationService(config, jwtToken);

describe('when requesting all authorization services endpoints and metadata', () => {
  it('should succeed', async () => {
    const result = await service.uma2Configuration();
    debug(result);
    expect(result).toBeTruthy();
  });
});
