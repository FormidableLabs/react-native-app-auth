import invariant from 'invariant';
import { NativeModules } from 'react-native';

const { RNAppAuth } = NativeModules;

export default class AppAuth {
  constructor(config) {
    invariant(typeof config.issuer === 'string', 'Config error: issuer must be a string');
    invariant(typeof config.clientId === 'string', 'Config error: clientId must be a string');
    invariant(typeof config.redirectUrl === 'string', 'Config error: redirectUrl must be a string');

    this.config = { ...config };
  }

  getConfig() {
    return this.config;
  }

  authorize(scopes) {
    invariant(scopes && scopes.length, 'Scope error: please add at least one scope');

    return RNAppAuth.authorize(
      this.config.issuer,
      this.config.redirectUrl,
      this.config.clientId,
      scopes
    );
  }

  refresh(refreshToken, scopes) {
    invariant(refreshToken, 'Please pass in a refresh token');
    invariant(scopes && scopes.length, 'Scope error: please add at least one scope');

    return RNAppAuth.refresh(
      this.config.issuer,
      this.config.redirectUrl,
      this.config.clientId,
      refreshToken,
      scopes
    );
  }

  async revokeToken(tokenToRevoke, sendClientId = false) {
    invariant(tokenToRevoke, 'Please include the token to revoke');

    const response = await fetch(`${this.config.issuer}/.well-known/openid-configuration`);
    const openidConfig = await response.json();

    invariant(
      openidConfig.revocation_endpoint,
      'The openid config does not specify a revocation endpoint'
    );

    /**
      Identity Server insists on client_id being passed in the body,
      but Google does not. According to the spec, Google is right
      so defaulting to no client_id
      https://tools.ietf.org/html/rfc7009#section-2.1
    **/

    return await fetch(openidConfig.revocation_endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `token=${tokenToRevoke}${sendClientId ? `&client_id=${this.config.clientId}` : ''}`
    }).catch(error => {
      throw new Error('Failed to revoke token', error);
    });
  }
}
