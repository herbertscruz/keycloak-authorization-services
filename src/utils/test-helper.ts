import axios from 'axios';

const instance = axios.create({
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
  },
  timeout: parseInt(process.env.AXIOS_TIMEOUT || '5000'),
});

export default class TestHelper {
  private baseUrl = 'http://localhost:8080';
  private tokenEndpoint = '/realms/main/protocol/openid-connect/token';


  getBaseUrl(): string {
    return this.baseUrl;
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
      `${this.baseUrl}${this.tokenEndpoint}`,
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
      `${this.baseUrl}${this.tokenEndpoint}`,
      params,
    );
    return access_token;
  }
}
