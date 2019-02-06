import invariant from 'invariant';
import { Platform, NativeModules } from 'react-native';

import {
  validateClientId,
  validateIssuerOrServiceConfigurationEndpoints,
  validateRedirectUrl,
} from './validators';

const { RNAppAuth } = NativeModules;

export default async (
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
