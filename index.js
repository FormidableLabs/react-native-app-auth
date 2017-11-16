import invariant from 'invariant';
import { NativeModules } from 'react-native';

const { RNAppAuth } = NativeModules;

export default class AppAuth {
  constructor(config) {
    invariant(typeof config.issuer === 'string', 'Config error: issuer must be a string');
    invariant(typeof config.clientId === 'string', 'Config error: clientId must be a string');
    invariant(typeof config.redirectUrl === 'string', 'Config error: redirectUrl must be a string');
    invariant(
      ['boolean', 'undefined'].includes(typeof config.allowOfflineAccess),
      'Config error: allowOfflineAccess must be a boolean or undefined'
    );

    this.config = { ...config };
  }

  getConfig() {
    return this.config;
  }

  getScopes(scopes) {
    return this.config.allowOfflineAccess ? [...scopes, 'offline_access'] : scopes;
  }

  authorize(scopes) {
    invariant(scopes, 'Scope error: please add at least one scope');
    invariant(scopes.length, 'Scope error: please add at least one scope');

    return RNAppAuth.authorize(
      this.config.issuer,
      this.config.redirectUrl,
      this.config.clientId,
      this.getScopes(scopes)
    );
  }

  refresh(refreshToken, scopes) {
    invariant(refreshToken, 'Please pass in a refresh token');
    invariant(scopes, 'Scope error: please add at least one scope');
    invariant(scopes.length, 'Scope error: please add at least one scope');

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
