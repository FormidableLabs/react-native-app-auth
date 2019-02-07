import refresh from './refresh';

jest.mock('react-native', () => ({
  NativeModules: {
    RNAppAuth: {
      refresh: jest.fn(),
    },
  },
  Platform: {
    OS: 'ios',
  },
}));

const config = {
  issuer: 'test-issuer',
  redirectUrl: 'test-redirectUrl',
  clientId: 'test-clientId',
  clientSecret: 'test-clientSecret',
  additionalParameters: { hello: 'world' },
  serviceConfiguration: null,
  scopes: ['my-scope'],
  usePKCE: true,
};

describe('refresh', () => {
  let mockRefresh;

  beforeAll(() => {
    mockRefresh = require('react-native').NativeModules.RNAppAuth.refresh;
    mockRefresh.mockReturnValue('REFRESHED');
  });

  beforeEach(() => {
    mockRefresh.mockReset();
  });

  it.skip('throws an error when no refreshToken is passed in', () => {
    expect(() => {
      refresh(config, {});
    }).toThrow('Please pass in a refresh token');
  });

  it('calls the native wrapper with the correct args on iOS', () => {
    refresh({ ...config }, { refreshToken: 'such-token' });
    expect(mockRefresh).toHaveBeenCalledWith(
      config.issuer,
      config.redirectUrl,
      config.clientId,
      config.clientSecret,
      'such-token',
      config.scopes,
      config.additionalParameters,
      config.serviceConfiguration
    );
  });

  describe('Android-specific dangerouslyAllowInsecureHttpRequests parameter', () => {
    beforeEach(() => {
      require('react-native').Platform.OS = 'android';
    });

    afterEach(() => {
      require('react-native').Platform.OS = 'ios';
    });

    it('calls the native wrapper with default value `false`', () => {
      refresh(config, { refreshToken: 'such-token' });
      expect(mockRefresh).toHaveBeenCalledWith(
        config.issuer,
        config.redirectUrl,
        config.clientId,
        config.clientSecret,
        'such-token',
        config.scopes,
        config.additionalParameters,
        config.serviceConfiguration,
        false
      );
    });

    it('calls the native wrapper with passed value `false`', () => {
      refresh(
        { ...config, dangerouslyAllowInsecureHttpRequests: false },
        { refreshToken: 'such-token' }
      );
      expect(mockRefresh).toHaveBeenCalledWith(
        config.issuer,
        config.redirectUrl,
        config.clientId,
        config.clientSecret,
        'such-token',
        config.scopes,
        config.additionalParameters,
        config.serviceConfiguration,
        false
      );
    });

    it('calls the native wrapper with passed value `true`', () => {
      refresh(
        { ...config, dangerouslyAllowInsecureHttpRequests: true },
        { refreshToken: 'such-token' }
      );
      expect(mockRefresh).toHaveBeenCalledWith(
        config.issuer,
        config.redirectUrl,
        config.clientId,
        config.clientSecret,
        'such-token',
        config.scopes,
        config.additionalParameters,
        config.serviceConfiguration,
        true
      );
    });
  });
});
