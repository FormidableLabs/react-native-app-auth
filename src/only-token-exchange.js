import { NativeModules } from 'react-native';

const { RNAppAuth } = NativeModules;

export default () => {
  return RNAppAuth.onlyTokenExchange();
};
