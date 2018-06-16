import invariant from 'invariant';
import { NativeModules, Platform } from 'react-native';

const { RNAppAuth } = NativeModules;

const validateIssuerOrServiceConfigurationEndpoints = (issuer, serviceConfiguration) =>
  invariant(
    typeof issuer === 'string' ||
      (serviceConfiguration &&
        typeof serviceConfiguration.authorizationEndpoint === 'string' &&
        typeof serviceConfiguration.tokenEndpoint === 'string'),
    'Config error: you must provide either an issuer or a service endpoints'
  );
const validateIssuerOrServiceConfigurationRevocationEndpoint = (issuer, serviceConfiguration) =>
  invariant(
    typeof issuer === 'string' ||
      (serviceConfiguration && typeof serviceConfiguration.revocationEndpoint === 'string'),
    'Config error: you must provide either an issuer or a revocation endpoint'
  );
const validateClientId = clientId =>
  invariant(typeof clientId === 'string', 'Config error: clientId must be a string');
const validateRedirectUrl = redirectUrl =>
  invariant(typeof redirectUrl === 'string', 'Config error: redirectUrl must be a string');

export const authorize = ({
  issuer,
  redirectUrl,
  clientId,
  clientSecret,
  scopes,
  additionalParameters,
  serviceConfiguration,
  dangerouslyAllowInsecureHttpRequests = false,
}) => {
  validateIssuerOrServiceConfigurationEndpoints(issuer, serviceConfiguration);
  validateClientId(clientId);
  validateRedirectUrl(redirectUrl);
  // TODO: validateAdditionalParameters

  const nativeMethodArguments = [
    issuer,
    redirectUrl,
    clientId,
    clientSecret,
    scopes,
    additionalParameters,
    serviceConfiguration,
  ];
  if (Platform.OS === 'android') {
    nativeMethodArguments.push(dangerouslyAllowInsecureHttpRequests);
  }

  return RNAppAuth.authorize(...nativeMethodArguments);
};

export const refresh = (
  {
    issuer,
    redirectUrl,
    clientId,
    clientSecret,
    scopes,
    additionalParameters,
    serviceConfiguration,
    dangerouslyAllowInsecureHttpRequests = false,
  },
  { refreshToken }
) => {
  validateIssuerOrServiceConfigurationEndpoints(issuer, serviceConfiguration);
  validateClientId(clientId);
  validateRedirectUrl(redirectUrl);
  invariant(refreshToken, 'Please pass in a refresh token');
  // TODO: validateAdditionalParameters

  const nativeMethodArguments = [
    issuer,
    redirectUrl,
    clientId,
    clientSecret,
    refreshToken,
    scopes,
    additionalParameters,
    serviceConfiguration,
  ];

  if (Platform.OS === 'android') {
    nativeMethodArguments.push(dangerouslyAllowInsecureHttpRequests);
  }

  return RNAppAuth.refresh(...nativeMethodArguments);
};

export const revoke = async (
  { clientId, issuer, serviceConfiguration },
  { tokenToRevoke, sendClientId = false }
) => {
  invariant(tokenToRevoke, 'Please include the token to revoke');
  validateClientId(clientId);
  validateIssuerOrServiceConfigurationRevocationEndpoint(issuer, serviceConfiguration);

  let revocationEndpoint;
  if (serviceConfiguration && serviceConfiguration.revocationEndpoint) {
    revocationEndpoint = serviceConfiguration.revocationEndpoint;
  } else {
    const response = await fetch(`${issuer}/.well-known/openid-configuration`);
    const openidConfig = await response.json();

    invariant(
      openidConfig.revocation_endpoint,
      'The openid config does not specify a revocation endpoint'
    );

    revocationEndpoint = openidConfig.revocation_endpoint;
  }

  /**
    Identity Server insists on client_id being passed in the body,
    but Google does not. According to the spec, Google is right
    so defaulting to no client_id
    https://tools.ietf.org/html/rfc7009#section-2.1
  **/
  return await fetch(revocationEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `token=${tokenToRevoke}${sendClientId ? `&client_id=${clientId}` : ''}`,
  }).catch(error => {
    throw new Error('Failed to revoke token', error);
  });
};
