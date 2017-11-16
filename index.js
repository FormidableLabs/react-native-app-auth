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

    this.config = { ...config };
  }

  getConfig() {
    return this.config;
  }

  getScopes(scopes) {
    return this.config.allowOfflineAccess ? [...scopes, 'offline_access'] : scopes;
  }

  authorize(scopes) {
    if (!scopes || scopes.length === 0) {
      throw new Error('Scope error: please add at least one scope');
    }
    return RNAppAuth.authorize(
      this.config.issuer,
      this.config.redirectUrl,
      this.config.clientId,
      this.getScopes(scopes)
    );
  }

  refresh(refreshToken, scopes) {
    if (!refreshToken) {
      throw new Error('Please pass in a refresh token');
    }

    if (!scopes || scopes.length === 0) {
      throw new Error('Scope error: please add at least one scope');
    }
    return RNAppAuth.refresh(
      this.config.issuer,
      this.config.redirectUrl,
      this.config.clientId,
      refreshToken,
      this.getScopes(scopes)
    );
  }

  revokeToken() {
    // TODO make an api request to revokeRokenUrl to revoke the token
  }
}
