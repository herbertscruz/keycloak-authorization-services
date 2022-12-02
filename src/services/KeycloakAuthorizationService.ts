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
    const formSet = new Set();
    formSet.add('grant_type=urn:ietf:params:oauth:grant-type:uma-ticket');

    Object.keys(params).forEach((key) => {
      const value = (params as any)[key];
      if (key !== 'permission' && value) {
        formSet.add(`${key}=${value}`);
      }
    });

    const claimToken = this.normalizeClaimsToken(params);
    if (claimToken) {
      formSet.add(`claim_token=${claimToken}`);
    }
    if (params.claim_token) {
      formSet.add('claim_token_format=urn:ietf:params:oauth:token-type:jwt');
    }

    const audience = this.normalizeAudience(params, options);
    if (audience) {
      formSet.add(`audience=${audience}`);
    }

    const form = [...formSet];

    const permissions = this.normalizePermission(params);
    permissions.forEach((permission) => form.push(`permission=${permission}`));

    debug(form);

    const { data } = await axios.post(
      `${this.config.baseUrl}/realms/${this.config.realm}/protocol/openid-connect/token`,
      form.join('&'),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          Authorization: `Bearer ${options.token}`,
        },
      },
    );
    return data;
  }

  private normalizeClaimsToken(
    params: KeycloakAuthorizationRequestParams,
  ): string | undefined {
    if (!params?.claim_token) return;
    return Buffer.from(JSON.stringify(params?.claim_token)).toString('base64');
  }

  private normalizePermission(
    params: KeycloakAuthorizationRequestParams,
  ): string[] {
    const checkInvalidCharacters = (str: string) => {
      if (/[,#]/g.test(str.trim())) {
        throw new AxiosError(
          `Characters in square brackets [ ,#] are invalid for resource or scope names`,
          '422',
        );
      }
      return true;
    };
    const result = [];
    let resource = '';
    if (params?.permission?.resource) {
      checkInvalidCharacters(params.permission.resource);
      resource = params.permission.resource.trim();
    }
    if (params?.permission?.scopes) {
      params.permission.scopes.forEach((s) => {
        checkInvalidCharacters(s);
        result.push(`${resource}#${s.trim()}`);
      });
    } else if (resource) {
      result.push(resource);
    }
    return result;
  }

  private normalizeAudience(
    params: KeycloakAuthorizationRequestParams,
    options: KeycloakAuthorizationRequestOptions,
  ): string | undefined {
    if (!params.audience && params.permission) {
      const { azp } = this.jwtToken.decode(options.token);
      return azp;
    }
    return params.audience;
  }
}
