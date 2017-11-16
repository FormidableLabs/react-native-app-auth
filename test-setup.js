jest.mock('react-native', () => ({
  NativeModules: {
    RNAppAuth: {
      authorize: () => ({}),
      refreshToken: () => ({})
    }
  }
}));
