export default interface IKeycloakAuthorizationConfig {
  baseUrl: string;
  realm: string;
  timeout?: number;
  clientId: string;
  clientSecret: string;
}
