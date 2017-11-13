import { NativeModules } from 'react-native';

const { RNAppAuth } = NativeModules;

export default class AppAuth {
  constructor(config) {
    if (!config.issuer) {
      throw new Error('Config error: issuer must be defined');
    }

    if (!config.clientId) {
      throw new Error('Config error: client id must be defined');
    }

    if (!config.redirectUrl) {
      throw new Error('Config error: redirect url must be defined');
    }

    this.issuer = config.issuer;
    this.clientId = config.clientId;
    this.redirectUrl = config.redirectUrl;
    this.revokeRokenUrl = config.revokeRokenUrl;
  }

  async authorize() {
    const authState = await RNAppAuth.authorize(this.issuer, this.redirectUrl, this.clientId);
    return authState;
  }

  async refreshToken(refreshToken) {
    const authState = await RNAppAuth.refreshToken(
      this.issuer,
      this.redirectUrl,
      this.clientId,
      refreshToken
    );
    return authState;
  }

  revokeToken() {
    // TODO make an api request to revokeRokenUrl to revoke the token
  }
}
