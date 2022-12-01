export default interface IKeycloakAuthorizationByPermission {
  claimToken?: object;
  permission?: { resource?: string; scopes?: string[] };
  audience?: string;
}
