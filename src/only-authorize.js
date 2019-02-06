import { Platform, NativeModules } from 'react-native';

import {
  validateClientId,
  validateIssuerOrServiceConfigurationEndpoints,
  validateRedirectUrl,
} from './validators';

const { RNAppAuth } = NativeModules;

export default ({
  issuer,
  redirectUrl,
  clientId,
  clientSecret,
  scopes,
  useNonce = true,
  usePKCE = true,
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

  if (Platform.OS === 'ios') {
    nativeMethodArguments.push(useNonce);
    nativeMethodArguments.push(usePKCE);
  }

  return RNAppAuth.onlyAuthorize(...nativeMethodArguments);
};
