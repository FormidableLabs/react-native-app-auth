import { NativeModules } from 'react-native';

const { RNAppAuth } = NativeModules;

export default class AppAuth {
  constructor(config) {
    // TODO: check that config variables have correct format
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

  // TODO: add getters for authState variables

  async authorize() {
    // TODO: check how errors get handled. Is there a need for wrapping error messages?
    const authState = await RNAppAuth.authorize(this.issuer, this.redirectUrl, this.clientId);

    // TODO: add authState return variables to state
    return authState;
  }

  async refresh(refreshToken) {
    const authState = await RNAppAuth.refresh(
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
