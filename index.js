import invariant from 'invariant';
import { NativeModules } from 'react-native';

const { RNAppAuth } = NativeModules;

const validateScopes = scopes =>
  invariant(scopes && scopes.length, 'Scope error: please add at least one scope');
const validateIssuer = issuer =>
  invariant(typeof issuer === 'string', 'Config error: issuer must be a string');
const validateClientId = clientId =>
  invariant(typeof clientId === 'string', 'Config error: clientId must be a string');
const validateRedirectUrl = redirectUrl =>
  invariant(typeof redirectUrl === 'string', 'Config error: redirectUrl must be a string');

export const authorize = ({ issuer, redirectUrl, clientId, scopes, additionalParameters }) => {
  validateScopes(scopes);
  validateIssuer(issuer);
  validateClientId(clientId);
  validateRedirectUrl(redirectUrl);
  // TODO: validateAdditionalParameters

  return RNAppAuth.authorize(issuer, redirectUrl, clientId, scopes, additionalParameters);
};

export const refresh = ({
  issuer,
  redirectUrl,
  clientId,
  refreshToken,
  scopes,
  additionalParameters,
}) => {
  validateScopes(scopes);
  validateIssuer(issuer);
  validateClientId(clientId);
  validateRedirectUrl(redirectUrl);
  invariant(refreshToken, 'Please pass in a refresh token');
  // TODO: validateAdditionalParameters

  return RNAppAuth.refresh(
    issuer,
    redirectUrl,
    clientId,
    refreshToken,
    scopes,
    additionalParameters
  );
};

export const revoke = async ({ tokenToRevoke, sendClientId = false, clientId, issuer }) => {
  invariant(tokenToRevoke, 'Please include the token to revoke');
  validateClientId(clientId);
  validateIssuer(issuer);

  const response = await fetch(`${issuer}/.well-known/openid-configuration`);
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
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `token=${tokenToRevoke}${sendClientId ? `&client_id=${clientId}` : ''}`,
  }).catch(error => {
    throw new Error('Failed to revoke token', error);
  });
};
