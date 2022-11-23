import axios from 'axios';

interface KeycloakAuthorizationOptions {
  baseUrl: string;
}

export default class KeycloakAuthorizationService {
  constructor(private readonly config: KeycloakAuthorizationOptions) {}

  async uma2Configuration(): Promise<any> {
    const { data } = await axios.get(
      `${this.config.baseUrl}/.well-known/uma2-configuration`
    );
    return data;
  }
}
