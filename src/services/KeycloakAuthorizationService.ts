import axios from 'axios';
import JWTTokenService from './JWTTokenService';

interface KeycloakAuthorizationServiceConfig {
  baseUrl: string;
  realm: string;
}

interface KeycloakAuthorizationRequestParams {
  ticket?: string;
  claim_token?: string;
  claim_token_format?: string;
  rpt?: string;
  permission?: string | string[];
  audience?: string;
  response_include_resource_name?: boolean;
  response_permissions_limit?: number;
  submit_request?: boolean;
  response_mode?: 'decision' | 'permissions';
}

interface KeycloakAuthorizationRequestOptions {
  token: string;
  clientId: string;
  clientSecret: string;
}

/**
 * @see https://www.keycloak.org/docs/latest/authorization_services/#_service_overview
 */
export default class KeycloakAuthorizationService {
  constructor(
    private readonly config: KeycloakAuthorizationServiceConfig,
    private readonly jwtToken: JWTTokenService
  ) {}

  async uma2Configuration(): Promise<any> {
    const { data } = await axios.get(
      `${this.config.baseUrl}/realms/${this.config.realm}/.well-known/uma2-configuration`
    );
    return data;
  }

  async authorizationRequest(
    params: KeycloakAuthorizationRequestParams,
    options: KeycloakAuthorizationRequestOptions
  ): Promise<any> {
    let Authorization = `Bearer ${options.token}`;
    const decoded = this.jwtToken.decode(options.token);
    if (decoded?.clientId) {
      Authorization = `Basic ${this.getClientBasicToken(options)}`;
    }
    if (!params.audience && params.permission) {
      if (options.clientId) {
        params.audience = options.clientId;
      } else {
        this.checkKeycloakAuthorizationRequestOptions(options, ['audience']);
      }
    }
    const { data } = await axios.post(
      `${this.config.baseUrl}/realms/${this.config.realm}/protocol/openid-connect/token`,
      {
        grant_type: 'urn:ietf:params:oauth:grant-type:uma-ticket',
        ...params,
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          Authorization,
        },
      }
    );
    return data;
  }

  private checkKeycloakAuthorizationRequestOptions(
    options: KeycloakAuthorizationRequestOptions,
    requirements: string[]
  ) {
    if (!requirements) return;
    if (!Object.keys(options).every((i) => requirements.includes(i))) {
      throw new Error(`${requirements.join(' and ')} is required`);
    }
  }

  private getClientBasicToken(
    options: KeycloakAuthorizationRequestOptions
  ): string {
    this.checkKeycloakAuthorizationRequestOptions(options, [
      'clientId',
      'clientSecret',
    ]);
    return Buffer.from(`${options.clientId}:${options.clientSecret}`).toString(
      'base64'
    );
  }
}
