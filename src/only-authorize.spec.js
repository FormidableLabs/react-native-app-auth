import onlyAuthorize from './only-authorize';

jest.mock('react-native', () => ({
  NativeModules: {
    RNAppAuth: {
      onlyAuthorize: jest.fn(),
    },
  },
  Platform: {
    OS: 'ios',
  },
}));

describe('onlyAuthorize', () => {
  let mockAuthorize;

  beforeAll(() => {
    mockAuthorize = require('react-native').NativeModules.RNAppAuth.onlyAuthorize;
    mockAuthorize.mockReturnValue('AUTHORIZED');
  });

  const config = {
    issuer: 'test-issuer',
    redirectUrl: 'test-redirectUrl',
    clientId: 'test-clientId',
    clientSecret: 'test-clientSecret',
    additionalParameters: { hello: 'world' },
    serviceConfiguration: null,
    scopes: ['my-scope'],
    useNonce: true,
    usePKCE: true,
  };

  beforeEach(() => {
    mockAuthorize.mockReset();
  });

  it('throws an error when issuer is not a string and serviceConfiguration is not passed', () => {
    expect(() => {
      onlyAuthorize({ ...config, issuer: undefined });
    }).toThrow('Config error: you must provide either an issuer or a service endpoints');
  });

  it('throws an error when serviceConfiguration does not have tokenEndpoint and issuer is not passed', () => {
    expect(() => {
      onlyAuthorize({
        ...config,
        issuer: undefined,
        serviceConfiguration: { authorizationEndpoint: '' },
      });
    }).toThrow('Config error: you must provide either an issuer or a service endpoints');
  });

  it('throws an error when redirectUrl is not a string', () => {
    expect(() => {
      onlyAuthorize({ ...config, redirectUrl: {} });
    }).toThrow('Config error: redirectUrl must be a string');
  });

  it('throws an error when clientId is not a string', () => {
    expect(() => {
      onlyAuthorize({ ...config, clientId: 123 });
    }).toThrow('Config error: clientId must be a string');
  });

  it('calls the native wrapper with the correct args on iOS', () => {
    onlyAuthorize(config);
    expect(mockAuthorize).toHaveBeenCalledWith(
      config.issuer,
      config.redirectUrl,
      config.clientId,
      config.clientSecret,
      config.scopes,
      config.additionalParameters,
      config.serviceConfiguration,
      config.useNonce,
      config.usePKCE
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
      onlyAuthorize(config);
      expect(mockAuthorize).toHaveBeenCalledWith(
        config.issuer,
        config.redirectUrl,
        config.clientId,
        config.clientSecret,
        config.scopes,
        config.additionalParameters,
        config.serviceConfiguration,
        false
      );
    });

    it('calls the native wrapper with passed value `false`', () => {
      onlyAuthorize({ ...config, dangerouslyAllowInsecureHttpRequests: false });
      expect(mockAuthorize).toHaveBeenCalledWith(
        config.issuer,
        config.redirectUrl,
        config.clientId,
        config.clientSecret,
        config.scopes,
        config.additionalParameters,
        config.serviceConfiguration,
        false
      );
    });

    it('calls the native wrapper with passed value `true`', () => {
      onlyAuthorize({ ...config, dangerouslyAllowInsecureHttpRequests: true });
      expect(mockAuthorize).toHaveBeenCalledWith(
        config.issuer,
        config.redirectUrl,
        config.clientId,
        config.clientSecret,
        config.scopes,
        config.additionalParameters,
        config.serviceConfiguration,
        true
      );
    });
  });
});
