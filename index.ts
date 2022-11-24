import authorizationByPermission from './src/middlewares/authorizationByPermission';
import JWTTokenService from './src/services/JWTTokenService';
import KeycloakAuthorizationService from './src/services/KeycloakAuthorizationService';

export default {
  JWTTokenService,
  KeycloakAuthorizationService,
  authorizationByPermission,
};
