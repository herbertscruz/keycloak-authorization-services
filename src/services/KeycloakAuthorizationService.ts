import debugPkg from 'debug';
import axios, { AxiosError } from 'axios';
import JWTTokenService from './JWTTokenService';
const debug = debugPkg(
  'keycloak-authorization-service:keycloak-authorization-service',
);

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
    private readonly jwtToken: JWTTokenService,
  ) {}

  async uma2Configuration(): Promise<any> {
    const { data } = await axios.get(
      `${this.config.baseUrl}/realms/${this.config.realm}/.well-known/uma2-configuration`,
    );
    return data;
  }

  async authorizationRequest(
    params: KeycloakAuthorizationRequestParams,
    options: KeycloakAuthorizationRequestOptions,
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
    if (params.permission && Array.isArray(params.permission)) {
      params.permission = params.permission.join(', ');
    }
    debug(params);
    debug(Authorization);
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
      },
    );
    return data;
  }

  private checkKeycloakAuthorizationRequestOptions(
    options: KeycloakAuthorizationRequestOptions,
    requirements: string[],
  ) {
    debug(options);
    debug(requirements);
    debug(Object.keys(options));

    const check = (i: string) => {
      return Object.keys(options).includes(i) && (options as any)[i]?.trim();
    };

    if (!requirements) return;
    if (!requirements.every(check)) {
      throw new AxiosError(`${requirements.join(' and ')} is required`);
    }
  }

  private getClientBasicToken(
    options: KeycloakAuthorizationRequestOptions,
  ): string {
    debug(options);
    this.checkKeycloakAuthorizationRequestOptions(options, [
      'clientId',
      'clientSecret',
    ]);
    return Buffer.from(`${options.clientId}:${options.clientSecret}`).toString(
      'base64',
    );
  }
}
