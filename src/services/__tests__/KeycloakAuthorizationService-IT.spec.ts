/**
 * @group integration/test
 */
import debugPkg from 'debug';
import * as dotenv from 'dotenv';
import TestHelper from '../../utils/test-helper';
import JWTTokenService from '../JWTTokenService';
import KeycloakAuthorizationService from '../KeycloakAuthorizationService';
const debug = debugPkg(
  'keycloak-authorization-service:keycloak-authorization-service-it',
);
dotenv.config();

jest.setTimeout(parseInt(process.env.JEST_TIMEOUT || ''));

describe('when requesting all authorization services endpoints and metadata', () => {
  const helper = new TestHelper();
  const config = { realm: 'main' } as any;
  let service: KeycloakAuthorizationService;

  beforeAll(async () => {
    config.baseUrl = helper.getBaseUrl();
    const jwtToken = new JWTTokenService(config);
    service = new KeycloakAuthorizationService(config, jwtToken);
  });

  it('should succeed', async () => {
    const result = await service.uma2Configuration();
    debug(result);
    expect(result).toBeTruthy();
  });
});
