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

const validateHeaders = headers => {
  if (!headers) {
    return;
  }
  const customHeaderTypeErrorMessage =
    'Config error: customHeaders type must be { token?: { [key: string]: string }, authorize?: { [key: string]: string }}';

  const authorizedKeys = ['token', 'authorize'];
  const keys = Object.keys(headers);
  const correctKeys = keys.filter(key => authorizedKeys.includes(key));
  invariant(
    keys.length <= authorizedKeys.length &&
      correctKeys.length > 0 &&
      correctKeys.length === keys.length,
    customHeaderTypeErrorMessage
  );

  Object.values(headers).forEach(value => {
    invariant(typeof value === 'object', customHeaderTypeErrorMessage);
    invariant(
      Object.values(value).filter(key => typeof key !== 'string').length === 0,
      customHeaderTypeErrorMessage
    );
  });
};

export const prefetchConfiguration = async ({
  warmAndPrefetchChrome,
  issuer,
  redirectUrl,
  clientId,
  scopes,
  serviceConfiguration,
  dangerouslyAllowInsecureHttpRequests = false,
  customHeaders,
}) => {
  if (Platform.OS === 'android') {
    validateIssuerOrServiceConfigurationEndpoints(issuer, serviceConfiguration);
    validateClientId(clientId);
    validateRedirectUrl(redirectUrl);
    validateHeaders(customHeaders);

    const nativeMethodArguments = [
      warmAndPrefetchChrome,
      issuer,
      redirectUrl,
      clientId,
      scopes,
      serviceConfiguration,
      dangerouslyAllowInsecureHttpRequests,
      customHeaders,
    ];

    RNAppAuth.prefetchConfiguration(...nativeMethodArguments);
  }
};

export const authorize = ({
  issuer,
  redirectUrl,
  clientId,
  clientSecret,
  scopes,
  useNonce = true,
  usePKCE = true,
  additionalParameters,
  serviceConfiguration,
  clientAuthMethod = 'basic',
  dangerouslyAllowInsecureHttpRequests = false,
  customHeaders,
}) => {
  validateIssuerOrServiceConfigurationEndpoints(issuer, serviceConfiguration);
  validateClientId(clientId);
  validateRedirectUrl(redirectUrl);
  validateHeaders(customHeaders);
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
    nativeMethodArguments.push(usePKCE);
    nativeMethodArguments.push(clientAuthMethod);
    nativeMethodArguments.push(dangerouslyAllowInsecureHttpRequests);
    nativeMethodArguments.push(customHeaders);
  }

  if (Platform.OS === 'ios') {
    nativeMethodArguments.push(useNonce);
    nativeMethodArguments.push(usePKCE);
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
    clientAuthMethod = 'basic',
    dangerouslyAllowInsecureHttpRequests = false,
    customHeaders,
  },
  { refreshToken }
) => {
  validateIssuerOrServiceConfigurationEndpoints(issuer, serviceConfiguration);
  validateClientId(clientId);
  validateRedirectUrl(redirectUrl);
  validateHeaders(customHeaders);
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
    nativeMethodArguments.push(clientAuthMethod);
    nativeMethodArguments.push(dangerouslyAllowInsecureHttpRequests);
    nativeMethodArguments.push(customHeaders);
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
