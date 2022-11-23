/**
 * @group integration/test
 */

import KeycloakAuthorizationService from '../';

import debugPkg from 'debug';
const debug = debugPkg('keycloak-authorization-service:index-it-spec');

const service = new KeycloakAuthorizationService({
  baseUrl: 'http://host.docker.internal:8081/realms/main',
});

describe('GET / - a simple api endpoint', () => {
  it('Hello API Request', async () => {
    const result = await service.uma2Configuration();
    debug(result);
    expect(result).toBeTruthy();
  });
});
