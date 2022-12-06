import axios from 'axios';
import path from 'node:path';
import { GenericContainer, StartedTestContainer } from 'testcontainers';

const instance = axios.create({
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
  },
  timeout: parseInt(process.env.AXIOS_TIMEOUT || '5000'),
});

export default class TestHelper {
  private container?: StartedTestContainer;

  async startKeycloakContainer(): Promise<void> {
    const source = path.resolve(process.cwd(), 'keycloak', 'main-realm.json');
    const target = '/opt/keycloak/data/import/main-realm.json';
    this.container = await new GenericContainer(
      'quay.io/keycloak/keycloak:20.0.1',
    )
      .withCopyFilesToContainer([{ source, target }])
      .withExposedPorts(8080)
      .withEntrypoint([
        '/opt/keycloak/bin/kc.sh',
        'start-dev',
        '--import-realm',
      ])
      .start();
  }

  async stopKeycloakContainer(): Promise<void> {
    if (!this.container) throw new Error('startKeycloakContainer is required');
    await this.container?.stop();
  }

  getBaseUrl(): string {
    if (!this.container) throw new Error('startKeycloakContainer is required');
    return `http://${this.container?.getHost()}:${this.container?.getMappedPort(
      8080,
    )}`;
  }

  async getUserAccessToken(): Promise<string> {
    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('client_id', 'customer-client');
    params.append('client_secret', 'JaASlgV76n9a8IKx4oGgKi8h8ilHNAQ6');
    params.append('scope', 'openid');
    params.append('username', 'johnwick');
    params.append('password', '12345678');

    const {
      data: { access_token },
    } = await instance.post(
      `${this.getBaseUrl()}/realms/main/protocol/openid-connect/token`,
      params,
    );
    return access_token;
  }

  async getClientAccessToken(): Promise<string> {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', 'customer-client');
    params.append('client_secret', 'JaASlgV76n9a8IKx4oGgKi8h8ilHNAQ6');

    const {
      data: { access_token },
    } = await instance.post(
      `${this.getBaseUrl()}/realms/main/protocol/openid-connect/token`,
      params,
    );
    return access_token;
  }
}
