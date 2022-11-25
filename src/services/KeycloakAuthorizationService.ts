import axios, { AxiosError } from 'axios';
import debugPkg from 'debug';
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
  claim_token?: object;
  claim_token_format?: 'urn:ietf:params:oauth:token-type:jwt';
  rpt?: string;
  permission?: { resource?: string; scopes?: string[] };
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
    const form = {
      grant_type: 'urn:ietf:params:oauth:grant-type:uma-ticket',
      ...params,
    } as any;
    form.claim_token = this.normalizeClaimsToken(params);
    if (params.claim_token) {
      form.claim_token_format = 'urn:ietf:params:oauth:token-type:jwt';
    }
    form.permission = this.normalizePermission(params);
    form.audience = this.normalizeAudience(params, options);
    debug(form);

    const Authorization = this.normalizeAuthorization(options);
    debug(Authorization);
    const { data } = await axios.post(
      `${this.config.baseUrl}/realms/${this.config.realm}/protocol/openid-connect/token`,
      form,
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
      throw new AxiosError(`${requirements.join(' and ')} is required`, '422');
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

  private normalizeClaimsToken(
    params: KeycloakAuthorizationRequestParams,
  ): string | undefined {
    if (!params?.claim_token) return;
    return Buffer.from(JSON.stringify(params?.claim_token)).toString('base64');
  }

  private normalizePermission(
    params: KeycloakAuthorizationRequestParams,
  ): string {
    const checkInvalidCharacters = (str: string) => {
      if (/[,#]/g.test(str.trim())) {
        throw new AxiosError(
          `Characters in square brackets [ ,#] are invalid for resource or scope names`,
          '422',
        );
      }
    };
    const result = [];
    if (params?.permission?.resource) {
      checkInvalidCharacters(params.permission.resource);
      result.push(params.permission.resource.trim());
    }
    if (params?.permission?.scopes) {
      params.permission.scopes.some((s) => checkInvalidCharacters(s));
      result.push(params.permission.scopes.map((s) => s.trim()).join(', '));
    }
    return result.join('#');
  }

  private normalizeAudience(
    params: KeycloakAuthorizationRequestParams,
    options: KeycloakAuthorizationRequestOptions,
  ): string | undefined {
    if (!params.audience && params.permission) {
      if (options.clientId) {
        return options.clientId;
      } else {
        this.checkKeycloakAuthorizationRequestOptions(options, ['audience']);
      }
    }
    return params.audience;
  }

  private normalizeAuthorization(
    options: KeycloakAuthorizationRequestOptions,
  ): string {
    let token = `Bearer ${options.token}`;
    const decoded = this.jwtToken.decode(options.token);
    if (decoded?.clientId) {
      token = `Basic ${this.getClientBasicToken(options)}`;
    }
    return token;
  }
}
