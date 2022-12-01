export default interface IKeycloakAuthorizationByRoles {
  decodedType?: 'verify' | 'decode';
  permission?: { application?: string; roles: string[] };
}
