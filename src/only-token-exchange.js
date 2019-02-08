import { NativeModules } from 'react-native';

const { RNAppAuth } = NativeModules;

export default config => {
  const { clientSecret, additionalParameters, dangerouslyAllowInsecureHttpRequests } = config || {};
  return RNAppAuth.onlyTokenExchange(
    clientSecret,
    additionalParameters,
    dangerouslyAllowInsecureHttpRequests
  );
};
