export default interface IKeycloakAuthorizationByRoles {
  decodedType?: 'verify' | 'decode';
  permission?: { client?: string; roles: string[] };
}
