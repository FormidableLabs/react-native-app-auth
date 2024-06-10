import {
  authorize,
  refresh,
  register,
  logout,
  DEFAULT_TIMEOUT_IOS,
  DEFAULT_TIMEOUT_ANDROID,
  SECOND_IN_MS,
} from './';

jest.mock('react-native', () => ({
  NativeModules: {
    RNAppAuth: {
      register: jest.fn(),
      authorize: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn(),
    },
  },
  Platform: {
    OS: 'ios',
  },
}));

describe('AppAuth', () => {
  let mockRegister;
  let mockAuthorize;
  let mockRefresh;
  let mockLogout;

  beforeAll(() => {
    mockRegister = require('react-native').NativeModules.RNAppAuth.register;
    mockRegister.mockReturnValue('REGISTERED');

    mockAuthorize = require('react-native').NativeModules.RNAppAuth.authorize;
    mockAuthorize.mockReturnValue('AUTHORIZED');

    mockRefresh = require('react-native').NativeModules.RNAppAuth.refresh;
    mockRefresh.mockReturnValue('REFRESHED');

    mockLogout = require('react-native').NativeModules.RNAppAuth.logout;
    mockLogout.mockReturnValue('LOGOUT');
  });

  const TIMEOUT_SEC = 5;
  const TIMEOUT_MILLIS = TIMEOUT_SEC * SECOND_IN_MS;

  const config = {
    issuer: 'test-issuer',
    redirectUrl: 'test-redirectUrl',
    clientId: 'test-clientId',
    clientSecret: 'test-clientSecret',
    additionalParameters: { hello: 'world' },
    clientAuthMethod: 'post',
    serviceConfiguration: null,
    scopes: ['my-scope'],
    useNonce: true,
    usePKCE: true,
    customHeaders: null,
    additionalHeaders: { header: 'value' },
    connectionTimeoutSeconds: TIMEOUT_SEC,
    skipCodeExchange: false,
    iosCustomBrowser: 'safari',
    iosPrefersEphemeralSession: true,
    androidAllowCustomBrowsers: ['chrome'],
    androidTrustedWebActivity: false,
  };

  const registerConfig = {
    issuer: 'test-issuer',
    redirectUrls: ['test-redirectUrl'],
    responseTypes: ['code'],
    grantTypes: ['authorization_code'],
    subjectType: 'public',
    tokenEndpointAuthMethod: 'client_secret_post',
    additionalParameters: {},
    additionalHeaders: { header: 'value' },
    serviceConfiguration: null,
    connectionTimeoutSeconds: TIMEOUT_SEC,
  };

  describe('register', () => {
    beforeEach(() => {
      mockRegister.mockReset();
      mockAuthorize.mockReset();
      mockRefresh.mockReset();
      mockLogout.mockReset();
    });

    it('throws an error when issuer is not a string and serviceConfiguration is not passed', () => {
      expect(() => {
        register({ ...registerConfig, issuer: () => ({}) });
      }).toThrow('Config error: you must provide either an issuer or a registration endpoint');
    });

    it('throws an error when serviceConfiguration does not have registrationEndpoint and issuer is not passed', () => {
      expect(() => {
        register({
          ...registerConfig,
          issuer: undefined,
          serviceConfiguration: { authorizationEndpoint: '' },
        });
      }).toThrow('Config error: you must provide either an issuer or a registration endpoint');
    });

    it('throws an error when redirectUrls is not an Array', () => {
      expect(() => {
        register({ ...registerConfig, redirectUrls: 'test-url' });
      }).toThrow('Config error: redirectUrls must be an Array of strings');
    });

    it('throws an error when redirectUrls does not contain strings', () => {
      expect(() => {
        register({ ...registerConfig, redirectUrls: [null] });
      }).toThrow('Config error: redirectUrls must be an Array of strings');
    });

    it('throws an error when responseTypes is not an Array', () => {
      expect(() => {
        register({ ...registerConfig, responseTypes: 'test-type' });
      }).toThrow('Config error: if provided, responseTypes must be an Array of strings');
    });

    it('throws an error when responseTypes does not contain strings', () => {
      expect(() => {
        register({ ...registerConfig, responseTypes: [null] });
      }).toThrow('Config error: if provided, responseTypes must be an Array of strings');
    });

    it('throws an error when grantTypes is not an Array', () => {
      expect(() => {
        register({ ...registerConfig, grantTypes: 'test-type' });
      }).toThrow('Config error: if provided, grantTypes must be an Array of strings');
    });

    it('throws an error when grantTypes does not contain strings', () => {
      expect(() => {
        register({ ...registerConfig, grantTypes: [null] });
      }).toThrow('Config error: if provided, grantTypes must be an Array of strings');
    });

    it('throws an error when subjectType is not a string', () => {
      expect(() => {
        register({ ...registerConfig, subjectType: 7 });
      }).toThrow('Config error: if provided, subjectType must be a string');
    });

    it('throws an error when tokenEndpointAuthMethod is not a string', () => {
      expect(() => {
        register({ ...registerConfig, tokenEndpointAuthMethod: () => 'test-method' });
      }).toThrow('Config error: if provided, tokenEndpointAuthMethod must be a string');
    });

    it('throws an error when customHeaders has too few keys', () => {
      expect(() => {
        register({ ...registerConfig, customHeaders: {} });
      }).toThrow();
    });

    it('throws an error when customHeaders has too many keys', () => {
      expect(() => {
        register({
          ...registerConfig,
          customHeaders: {
            register: { toto: 'titi' },
            authorize: { toto: 'titi' },
            unknownKey: { toto: 'titi' },
          },
        });
      }).toThrow();
    });

    it('throws an error when customHeaders has unknown keys', () => {
      expect(() => {
        register({
          ...registerConfig,
          customHeaders: {
            reg: { toto: 'titi' },
            authorize: { toto: 'titi' },
          },
        });
      }).toThrow();
      expect(() => {
        register({
          ...registerConfig,
          customHeaders: {
            reg: { toto: 'titi' },
          },
        });
      }).toThrow();
    });

    it('throws an error when customHeaders values arent Record<string,string>', () => {
      expect(() => {
        register({
          ...registerConfig,
          customHeaders: {
            register: { toto: {} },
          },
        });
      }).toThrow();
    });

    it('throws an error when connectionTimeoutSeconds value isnt a number', () => {
      expect(() => {
        register({
          ...registerConfig,
          connectionTimeoutSeconds: 'blah',
        });
      }).toThrow('Config error: connectionTimeoutSeconds must be a number');
    });

    it('calls the native wrapper with the correct args on iOS', () => {
      register(registerConfig);
      expect(mockRegister).toHaveBeenCalledWith(
        registerConfig.issuer,
        registerConfig.redirectUrls,
        registerConfig.responseTypes,
        registerConfig.grantTypes,
        registerConfig.subjectType,
        registerConfig.tokenEndpointAuthMethod,
        registerConfig.additionalParameters,
        registerConfig.serviceConfiguration,
        registerConfig.connectionTimeoutSeconds,
        registerConfig.additionalHeaders
      );
    });

    describe('iOS-specific', () => {
      beforeEach(() => {
        require('react-native').Platform.OS = 'ios';
      });

      describe('connectionTimeoutSeconds parameter', () => {
        it('calls the native wrapper with the non-converted value', () => {
          register(registerConfig);
          expect(mockRegister).toHaveBeenCalledWith(
            registerConfig.issuer,
            registerConfig.redirectUrls,
            registerConfig.responseTypes,
            registerConfig.grantTypes,
            registerConfig.subjectType,
            registerConfig.tokenEndpointAuthMethod,
            registerConfig.additionalParameters,
            registerConfig.serviceConfiguration,
            registerConfig.connectionTimeoutSeconds,
            registerConfig.additionalHeaders
          );
        });

        it('calls the native wrapper with the default value when connectionTimeoutSeconds is undefined', () => {
          // eslint-disable-next-line no-unused-vars
          const { connectionTimeoutSeconds, ...configValues } = registerConfig;
          register(configValues);
          expect(mockRegister).toHaveBeenCalledWith(
            registerConfig.issuer,
            registerConfig.redirectUrls,
            registerConfig.responseTypes,
            registerConfig.grantTypes,
            registerConfig.subjectType,
            registerConfig.tokenEndpointAuthMethod,
            registerConfig.additionalParameters,
            registerConfig.serviceConfiguration,
            DEFAULT_TIMEOUT_IOS,
            registerConfig.additionalHeaders
          );
        });
      });

      describe('additionalHeaders parameter', () => {
        it('calls the native wrapper with additional headers', () => {
          const additionalHeaders = { header: 'value' };
          register({ ...registerConfig, additionalHeaders });
          expect(mockRegister).toHaveBeenCalledWith(
            registerConfig.issuer,
            registerConfig.redirectUrls,
            registerConfig.responseTypes,
            registerConfig.grantTypes,
            registerConfig.subjectType,
            registerConfig.tokenEndpointAuthMethod,
            registerConfig.additionalParameters,
            registerConfig.serviceConfiguration,
            registerConfig.connectionTimeoutSeconds,
            additionalHeaders
          );
        });

        it('it throws an error when values are not Record<string,string>', () => {
          expect(() => {
            register({
              ...registerConfig,
              additionalHeaders: {
                notString: {},
              },
            });
          }).toThrow();
        });
      });
    });

    describe('Android-specific', () => {
      beforeEach(() => {
        require('react-native').Platform.OS = 'android';
      });

      afterEach(() => {
        require('react-native').Platform.OS = 'ios';
      });

      describe('connectionTimeoutSeconds parameter', () => {
        it('calls the native wrapper with the value converted to milliseconds', () => {
          register(registerConfig);
          expect(mockRegister).toHaveBeenCalledWith(
            registerConfig.issuer,
            registerConfig.redirectUrls,
            registerConfig.responseTypes,
            registerConfig.grantTypes,
            registerConfig.subjectType,
            registerConfig.tokenEndpointAuthMethod,
            registerConfig.additionalParameters,
            registerConfig.serviceConfiguration,
            TIMEOUT_MILLIS,
            false,
            registerConfig.customHeaders
          );
        });

        it('calls the native wrapper with the default value when connectionTimeoutSeconds is undefined', () => {
          // eslint-disable-next-line no-unused-vars
          const { connectionTimeoutSeconds, ...configValues } = registerConfig;
          register(configValues);
          expect(mockRegister).toHaveBeenCalledWith(
            registerConfig.issuer,
            registerConfig.redirectUrls,
            registerConfig.responseTypes,
            registerConfig.grantTypes,
            registerConfig.subjectType,
            registerConfig.tokenEndpointAuthMethod,
            registerConfig.additionalParameters,
            registerConfig.serviceConfiguration,
            DEFAULT_TIMEOUT_ANDROID * SECOND_IN_MS,
            false,
            registerConfig.customHeaders
          );
        });
      });

      describe('dangerouslyAllowInsecureHttpRequests parameter', () => {
        it('calls the native wrapper with default value `false`', () => {
          register(registerConfig);
          expect(mockRegister).toHaveBeenCalledWith(
            registerConfig.issuer,
            registerConfig.redirectUrls,
            registerConfig.responseTypes,
            registerConfig.grantTypes,
            registerConfig.subjectType,
            registerConfig.tokenEndpointAuthMethod,
            registerConfig.additionalParameters,
            registerConfig.serviceConfiguration,
            TIMEOUT_MILLIS,
            false,
            registerConfig.customHeaders
          );
        });

        it('calls the native wrapper with passed value `false`', () => {
          register({ ...registerConfig, dangerouslyAllowInsecureHttpRequests: false });
          expect(mockRegister).toHaveBeenCalledWith(
            registerConfig.issuer,
            registerConfig.redirectUrls,
            registerConfig.responseTypes,
            registerConfig.grantTypes,
            registerConfig.subjectType,
            registerConfig.tokenEndpointAuthMethod,
            registerConfig.additionalParameters,
            registerConfig.serviceConfiguration,
            TIMEOUT_MILLIS,
            false,
            registerConfig.customHeaders
          );
        });

        it('calls the native wrapper with passed value `true`', () => {
          register({ ...registerConfig, dangerouslyAllowInsecureHttpRequests: true });
          expect(mockRegister).toHaveBeenCalledWith(
            registerConfig.issuer,
            registerConfig.redirectUrls,
            registerConfig.responseTypes,
            registerConfig.grantTypes,
            registerConfig.subjectType,
            registerConfig.tokenEndpointAuthMethod,
            registerConfig.additionalParameters,
            registerConfig.serviceConfiguration,
            TIMEOUT_MILLIS,
            true,
            registerConfig.customHeaders
          );
        });
      });

      describe('customHeaders parameter', () => {
        it('calls the native wrapper with headers', () => {
          const customTokenHeaders = { Authorization: 'Basic someBase64Value' };
          const customAuthorizeHeaders = { Authorization: 'Basic someOtherBase64Value' };
          const customRegisterHeaders = { Authorization: 'Basic some3rdBase64Value' };
          const customHeaders = {
            token: customTokenHeaders,
            authorize: customAuthorizeHeaders,
            register: customRegisterHeaders,
          };
          register({ ...registerConfig, customHeaders });
          expect(mockRegister).toHaveBeenCalledWith(
            registerConfig.issuer,
            registerConfig.redirectUrls,
            registerConfig.responseTypes,
            registerConfig.grantTypes,
            registerConfig.subjectType,
            registerConfig.tokenEndpointAuthMethod,
            registerConfig.additionalParameters,
            registerConfig.serviceConfiguration,
            TIMEOUT_MILLIS,
            false,
            customHeaders
          );
        });
      });
    });
  });

  describe('authorize', () => {
    beforeEach(() => {
      mockRegister.mockReset();
      mockAuthorize.mockReset();
      mockRefresh.mockReset();
      mockLogout.mockReset();
    });

    it('throws an error when issuer is not a string and serviceConfiguration is not passed', () => {
      expect(() => {
        authorize({ ...config, issuer: () => ({}) });
      }).toThrow('Config error: you must provide either an issuer or a service endpoints');
    });

    it('throws an error when serviceConfiguration does not have tokenEndpoint and issuer is not passed', () => {
      expect(() => {
        authorize({
          ...config,
          issuer: undefined,
          serviceConfiguration: { authorizationEndpoint: '' },
        });
      }).toThrow('Config error: you must provide either an issuer or a service endpoints');
    });

    it('throws an error when redirectUrl is not a string', () => {
      expect(() => {
        authorize({ ...config, redirectUrl: {} });
      }).toThrow('Config error: redirectUrl must be a string');
    });

    it('throws an error when clientId is not a string', () => {
      expect(() => {
        authorize({ ...config, clientId: 123 });
      }).toThrow('Config error: clientId must be a string');
    });

    it('throws an error when customHeaders has too few keys', () => {
      expect(() => {
        authorize({ ...config, customHeaders: {} });
      }).toThrow();
    });

    it('throws an error when customHeaders has too many keys', () => {
      expect(() => {
        authorize({
          ...config,
          customHeaders: {
            token: { toto: 'titi' },
            authorize: { toto: 'titi' },
            unknownKey: { toto: 'titi' },
          },
        });
      }).toThrow();
    });

    it('throws an error when customHeaders has unknown keys', () => {
      expect(() => {
        authorize({
          ...config,
          customHeaders: {
            tokn: { toto: 'titi' },
            authorize: { toto: 'titi' },
          },
        });
      }).toThrow();
      expect(() => {
        authorize({
          ...config,
          customHeaders: {
            tokn: { toto: 'titi' },
          },
        });
      }).toThrow();
    });
    it('throws an error when customHeaders values arent Record<string,string>', () => {
      expect(() => {
        authorize({
          ...config,
          customHeaders: {
            token: { toto: {} },
          },
        });
      }).toThrow();
    });
    it('throws an error when connectionTimeoutSeconds value isnt a number', () => {
      expect(() => {
        authorize({
          ...config,
          connectionTimeoutSeconds: 'blah',
        });
      }).toThrow('Config error: connectionTimeoutSeconds must be a number');
    });

    it('calls the native wrapper with the correct args on iOS', () => {
      authorize(config);
      expect(mockAuthorize).toHaveBeenCalledWith(
        config.issuer,
        config.redirectUrl,
        config.clientId,
        config.clientSecret,
        config.scopes,
        config.additionalParameters,
        config.serviceConfiguration,
        config.skipCodeExchange,
        config.connectionTimeoutSeconds,
        config.additionalHeaders,
        config.useNonce,
        config.usePKCE,
        config.iosCustomBrowser,
        config.iosPrefersEphemeralSession
      );
    });

    it('calls the native wrapper with the default value `false`, `true`, `true`', () => {
      authorize({
        issuer: 'test-issuer',
        redirectUrl: 'test-redirectUrl',
        clientId: 'test-clientId',
        clientSecret: 'test-clientSecret',
        customHeaders: null,
        additionalParameters: null,
        serviceConfiguration: null,
        additionalHeaders: null,
        scopes: ['openid'],
      });
      expect(mockAuthorize).toHaveBeenCalledWith(
        'test-issuer',
        'test-redirectUrl',
        'test-clientId',
        'test-clientSecret',
        ['openid'],
        null,
        null,
        false,
        DEFAULT_TIMEOUT_IOS,
        null,
        true,
        true,
        null,
        false
      );
    });

    describe('iOS-specific', () => {
      beforeEach(() => {
        require('react-native').Platform.OS = 'ios';
      });

      describe('connectionTimeoutSeconds parameter', () => {
        it('calls the native wrapper with the non-converted value', () => {
          authorize(config);
          expect(mockAuthorize).toHaveBeenCalledWith(
            config.issuer,
            config.redirectUrl,
            config.clientId,
            config.clientSecret,
            config.scopes,
            config.additionalParameters,
            config.serviceConfiguration,
            config.skipCodeExchange,
            config.connectionTimeoutSeconds,
            config.additionalHeaders,
            config.useNonce,
            config.usePKCE,
            config.iosCustomBrowser,
            config.iosPrefersEphemeralSession
          );
        });
      });

      describe('additionalHeaders parameter', () => {
        it('calls the native wrapper with additional headers', () => {
          const additionalHeaders = { header: 'a-value' };
          authorize({ ...config, additionalHeaders });
          expect(mockAuthorize).toHaveBeenCalledWith(
            config.issuer,
            config.redirectUrl,
            config.clientId,
            config.clientSecret,
            config.scopes,
            config.additionalParameters,
            config.serviceConfiguration,
            config.skipCodeExchange,
            config.connectionTimeoutSeconds,
            additionalHeaders,
            config.useNonce,
            config.usePKCE,
            config.iosCustomBrowser,
            config.iosPrefersEphemeralSession
          );
        });

        it('throws an error when values are not Record<string,string>', () => {
          expect(() => {
            authorize({
              ...config,
              additionalHeaders: {
                notString: {},
              },
            });
          }).toThrow();
        });
      });

      describe('useNonce parameter', () => {
        it('calls the native wrapper with default value `true`', () => {
          authorize(config);
          expect(mockAuthorize).toHaveBeenCalledWith(
            config.issuer,
            config.redirectUrl,
            config.clientId,
            config.clientSecret,
            config.scopes,
            config.additionalParameters,
            config.serviceConfiguration,
            false,
            config.connectionTimeoutSeconds,
            config.additionalHeaders,
            true,
            true,
            config.iosCustomBrowser,
            config.iosPrefersEphemeralSession
          );
        });

        it('calls the native wrapper with passed value `false`', () => {
          authorize({ ...config, useNonce: false });
          expect(mockAuthorize).toHaveBeenCalledWith(
            config.issuer,
            config.redirectUrl,
            config.clientId,
            config.clientSecret,
            config.scopes,
            config.additionalParameters,
            config.serviceConfiguration,
            false,
            config.connectionTimeoutSeconds,
            config.additionalHeaders,
            false,
            true,
            config.iosCustomBrowser,
            config.iosPrefersEphemeralSession
          );
        });
      });

      describe('usePKCE parameter', () => {
        it('calls the native wrapper with default value `true`', () => {
          authorize(config);
          expect(mockAuthorize).toHaveBeenCalledWith(
            config.issuer,
            config.redirectUrl,
            config.clientId,
            config.clientSecret,
            config.scopes,
            config.additionalParameters,
            config.serviceConfiguration,
            config.skipCodeExchange,
            config.connectionTimeoutSeconds,
            config.additionalHeaders,
            config.useNonce,
            true,
            config.iosCustomBrowser,
            config.iosPrefersEphemeralSession
          );
        });

        it('calls the native wrapper with passed value `false`', () => {
          authorize({ ...config, usePKCE: false });
          expect(mockAuthorize).toHaveBeenCalledWith(
            config.issuer,
            config.redirectUrl,
            config.clientId,
            config.clientSecret,
            config.scopes,
            config.additionalParameters,
            config.serviceConfiguration,
            config.skipCodeExchange,
            config.connectionTimeoutSeconds,
            config.additionalHeaders,
            config.useNonce,
            false,
            config.iosCustomBrowser,
            config.iosPrefersEphemeralSession
          );
        });
      });
    });

    describe('Android-specific', () => {
      beforeEach(() => {
        require('react-native').Platform.OS = 'android';
      });

      describe('connectionTimeoutSeconds parameter', () => {
        it('calls the native wrapper with the value converted to milliseconds', () => {
          authorize(config);
          expect(mockAuthorize).toHaveBeenCalledWith(
            config.issuer,
            config.redirectUrl,
            config.clientId,
            config.clientSecret,
            config.scopes,
            config.additionalParameters,
            config.serviceConfiguration,
            config.skipCodeExchange,
            TIMEOUT_MILLIS,
            config.useNonce,
            config.usePKCE,
            config.clientAuthMethod,
            false,
            config.customHeaders,
            config.androidAllowCustomBrowsers,
            config.androidTrustedWebActivity
          );
        });
      });

      describe('dangerouslyAllowInsecureHttpRequests parameter', () => {
        it('calls the native wrapper with default value `false`', () => {
          authorize(config);
          expect(mockAuthorize).toHaveBeenCalledWith(
            config.issuer,
            config.redirectUrl,
            config.clientId,
            config.clientSecret,
            config.scopes,
            config.additionalParameters,
            config.serviceConfiguration,
            config.skipCodeExchange,
            TIMEOUT_MILLIS,
            config.useNonce,
            config.usePKCE,
            config.clientAuthMethod,
            false,
            config.customHeaders,
            config.androidAllowCustomBrowsers,
            config.androidTrustedWebActivity
          );
        });

        it('calls the native wrapper with passed value `false`', () => {
          authorize({ ...config, dangerouslyAllowInsecureHttpRequests: false });
          expect(mockAuthorize).toHaveBeenCalledWith(
            config.issuer,
            config.redirectUrl,
            config.clientId,
            config.clientSecret,
            config.scopes,
            config.additionalParameters,
            config.serviceConfiguration,
            false,
            TIMEOUT_MILLIS,
            config.useNonce,
            config.usePKCE,
            config.clientAuthMethod,
            false,
            config.customHeaders,
            config.androidAllowCustomBrowsers,
            config.androidTrustedWebActivity
          );
        });

        it('calls the native wrapper with passed value `true`', () => {
          authorize({ ...config, dangerouslyAllowInsecureHttpRequests: true });
          expect(mockAuthorize).toHaveBeenCalledWith(
            config.issuer,
            config.redirectUrl,
            config.clientId,
            config.clientSecret,
            config.scopes,
            config.additionalParameters,
            config.serviceConfiguration,
            false,
            TIMEOUT_MILLIS,
            config.useNonce,
            config.usePKCE,
            config.clientAuthMethod,
            true,
            config.customHeaders,
            config.androidAllowCustomBrowsers,
            config.androidTrustedWebActivity
          );
        });
      });
      describe('customHeaders parameter', () => {
        it('calls the native wrapper with headers', () => {
          const customTokenHeaders = { Authorization: 'Basic someBase64Value' };
          const customAuthorizeHeaders = { Authorization: 'Basic someOtherBase64Value' };
          const customRegisterHeaders = { Authorization: 'Basic some3rdBase64Value' };
          const customHeaders = {
            token: customTokenHeaders,
            authorize: customAuthorizeHeaders,
            register: customRegisterHeaders,
          };
          authorize({ ...config, customHeaders });
          expect(mockAuthorize).toHaveBeenCalledWith(
            config.issuer,
            config.redirectUrl,
            config.clientId,
            config.clientSecret,
            config.scopes,
            config.additionalParameters,
            config.serviceConfiguration,
            false,
            TIMEOUT_MILLIS,
            config.useNonce,
            config.usePKCE,
            config.clientAuthMethod,
            false,
            customHeaders,
            config.androidAllowCustomBrowsers,
            config.androidTrustedWebActivity
          );
        });
      });
    });
  });

  describe('refresh', () => {
    beforeEach(() => {
      mockRegister.mockReset();
      mockAuthorize.mockReset();
      mockRefresh.mockReset();
      mockLogout.mockReset();
      require('react-native').Platform.OS = 'ios';
    });

    const refreshToken = 'abc-token';

    it('throws an error when issuer is not a string and serviceConfiguration is not passed', () => {
      expect(() => {
        refresh({ ...config, issuer: () => ({}) }, { refreshToken });
      }).toThrow('Config error: you must provide either an issuer or a service endpoints');
    });

    it('throws an error when serviceConfiguration does not have tokenEndpoint and issuer is not passed', () => {
      expect(() => {
        refresh(
          {
            ...config,
            issuer: undefined,
            serviceConfiguration: { authorizationEndpoint: '' },
          },
          { refreshToken }
        );
      }).toThrow('Config error: you must provide either an issuer or a service endpoints');
    });

    it('throws an error when redirectUrl is not a string', () => {
      expect(() => {
        refresh({ ...config, redirectUrl: {} }, { refreshToken });
      }).toThrow('Config error: redirectUrl must be a string');
    });

    it('throws an error when clientId is not a string', () => {
      expect(() => {
        refresh({ ...config, clientId: 123 }, { refreshToken });
      }).toThrow('Config error: clientId must be a string');
    });

    it('throws an error when no refreshToken is passed in', () => {
      expect(() => {
        refresh(config, {});
      }).toThrow('Please pass in a refresh token');
    });
    it('throws an error when connectionTimeoutSeconds value isnt a number', () => {
      expect(() => {
        refresh(
          {
            ...config,
            connectionTimeoutSeconds: 'blah',
          },
          { refreshToken }
        );
      }).toThrow('Config error: connectionTimeoutSeconds must be a number');
    });

    it('calls the native wrapper with the correct args on iOS', () => {
      refresh({ ...config }, { refreshToken });
      expect(mockRefresh).toHaveBeenCalledWith(
        config.issuer,
        config.redirectUrl,
        config.clientId,
        config.clientSecret,
        refreshToken,
        config.scopes,
        config.additionalParameters,
        config.serviceConfiguration,
        config.connectionTimeoutSeconds,
        config.additionalHeaders,
        config.iosCustomBrowser
      );
    });

    describe('iOS-specific', () => {
      beforeEach(() => {
        require('react-native').Platform.OS = 'ios';
      });

      describe('connectionTimeoutSeconds parameter', () => {
        it('calls the native wrapper with the non-converted value', () => {
          refresh(config, { refreshToken });
          expect(mockRefresh).toHaveBeenCalledWith(
            config.issuer,
            config.redirectUrl,
            config.clientId,
            config.clientSecret,
            refreshToken,
            config.scopes,
            config.additionalParameters,
            config.serviceConfiguration,
            config.connectionTimeoutSeconds,
            config.additionalHeaders,
            config.iosCustomBrowser
          );
        });
      });

      describe('additionalHeaders parameter', () => {
        it('calls the native wrapper with additional headers', () => {
          const additionalHeaders = { header: 'value' };
          refresh({ ...config, additionalHeaders }, { refreshToken });
          expect(mockRefresh).toHaveBeenCalledWith(
            config.issuer,
            config.redirectUrl,
            config.clientId,
            config.clientSecret,
            refreshToken,
            config.scopes,
            config.additionalParameters,
            config.serviceConfiguration,
            config.connectionTimeoutSeconds,
            additionalHeaders,
            config.iosCustomBrowser
          );
        });

        it('throws an error when values are not Record<string,string>', () => {
          expect(() => {
            refresh({ ...config, additionalHeaders: { notString: {} } }, { refreshToken });
          }).toThrow();
        });
      });
    });

    describe('Android-specific', () => {
      beforeEach(() => {
        require('react-native').Platform.OS = 'android';
      });

      describe('connectionTimeoutSeconds parameter', () => {
        it('calls the native wrapper with the value converted to milliseconds', () => {
          refresh(config, { refreshToken });
          expect(mockRefresh).toHaveBeenCalledWith(
            config.issuer,
            config.redirectUrl,
            config.clientId,
            config.clientSecret,
            refreshToken,
            config.scopes,
            config.additionalParameters,
            config.serviceConfiguration,
            TIMEOUT_MILLIS,
            config.clientAuthMethod,
            false,
            config.customHeaders,
            config.androidAllowCustomBrowsers
          );
        });
      });

      describe(' dangerouslyAllowInsecureHttpRequests parameter', () => {
        it('calls the native wrapper with default value `false`', () => {
          refresh(config, { refreshToken });
          expect(mockRefresh).toHaveBeenCalledWith(
            config.issuer,
            config.redirectUrl,
            config.clientId,
            config.clientSecret,
            refreshToken,
            config.scopes,
            config.additionalParameters,
            config.serviceConfiguration,
            TIMEOUT_MILLIS,
            config.clientAuthMethod,
            false,
            config.customHeaders,
            config.androidAllowCustomBrowsers
          );
        });

        it('calls the native wrapper with passed value `false`', () => {
          refresh({ ...config, dangerouslyAllowInsecureHttpRequests: false }, { refreshToken });
          expect(mockRefresh).toHaveBeenCalledWith(
            config.issuer,
            config.redirectUrl,
            config.clientId,
            config.clientSecret,
            refreshToken,
            config.scopes,
            config.additionalParameters,
            config.serviceConfiguration,
            TIMEOUT_MILLIS,
            config.clientAuthMethod,
            false,
            config.customHeaders,
            config.androidAllowCustomBrowsers
          );
        });

        it('calls the native wrapper with passed value `true`', () => {
          refresh({ ...config, dangerouslyAllowInsecureHttpRequests: true }, { refreshToken });
          expect(mockRefresh).toHaveBeenCalledWith(
            config.issuer,
            config.redirectUrl,
            config.clientId,
            config.clientSecret,
            refreshToken,
            config.scopes,
            config.additionalParameters,
            config.serviceConfiguration,
            TIMEOUT_MILLIS,
            config.clientAuthMethod,
            true,
            config.customHeaders,
            config.androidAllowCustomBrowsers
          );
        });
      });

      describe('customHeaders parameter', () => {
        it('calls the native wrapper with headers', () => {
          const customTokenHeaders = { Authorization: 'Basic someBase64Value' };
          const customAuthorizeHeaders = { Authorization: 'Basic someOtherBase64Value' };
          const customHeaders = { token: customTokenHeaders, authorize: customAuthorizeHeaders };
          refresh({ ...config, customHeaders }, { refreshToken });
          expect(mockRefresh).toHaveBeenCalledWith(
            config.issuer,
            config.redirectUrl,
            config.clientId,
            config.clientSecret,
            refreshToken,
            config.scopes,
            config.additionalParameters,
            config.serviceConfiguration,
            TIMEOUT_MILLIS,
            config.clientAuthMethod,
            false,
            customHeaders,
            config.androidAllowCustomBrowsers
          );
        });
      });
    });
  });

  describe('end session', () => {
    beforeEach(() => {
      mockRegister.mockReset();
      mockAuthorize.mockReset();
      mockRefresh.mockReset();
      mockLogout.mockReset();
    });

    it('throws an error when issuer is not a string and serviceConfiguration is not passed', () => {
      expect(() => {
        logout(
          { ...config, issuer: () => ({}) },
          { idToken: 'token', postLogoutRedirectUrl: 'redirect' }
        );
      }).toThrow('Config error: you must provide either an issuer or an end session endpoint');
    });

    it('throws an error when serviceConfiguration does not have endSessionEndpoint and issuer is not passed', () => {
      expect(() => {
        logout(
          { ...config, issuer: undefined },
          { idToken: 'token', postLogoutRedirectUrl: 'redirect' }
        );
      }).toThrow('Config error: you must provide either an issuer or an end session endpoint');
    });

    it('throws an error when postLogoutRedirectUrl is not a string', () => {
      expect(() => {
        logout(config, { idToken: 'token', postLogoutRedirectUrl: {} });
      }).toThrow('Config error: redirectUrl must be a string');
    });

    it('throws an error when idToken is not passed in', () => {
      expect(() => {
        logout({ ...config }, { postLogoutRedirectUrl: 'redirect' });
      }).toThrow('Please pass in the ID token');
    });

    describe('iOS-specific', () => {
      beforeEach(() => {
        require('react-native').Platform.OS = 'ios';
      });

      it('calls the native wrapper with the correct args', () => {
        logout({ ...config }, { idToken: '_token_', postLogoutRedirectUrl: '_redirect_' });
        expect(mockLogout).toHaveBeenCalledWith(
          config.issuer,
          '_token_',
          '_redirect_',
          config.serviceConfiguration,
          config.additionalParameters,
          config.iosCustomBrowser,
          config.iosPrefersEphemeralSession
        );
      });
    });

    describe('Android-specific', () => {
      beforeEach(() => {
        require('react-native').Platform.OS = 'android';
      });

      it('calls the native wrapper with the correct args and undefined dangerouslyAllowInsecureHttpRequests', () => {
        logout({ ...config }, { idToken: '_token_', postLogoutRedirectUrl: '_redirect_' });
        expect(mockLogout).toHaveBeenCalledWith(
          config.issuer,
          '_token_',
          '_redirect_',
          config.serviceConfiguration,
          config.additionalParameters,
          false,
          config.androidAllowCustomBrowsers
        );
      });

      it('calls the native wrapper with the correct args and dangerouslyAllowInsecureHttpRequests set to `true`', () => {
        logout(
          { ...config, dangerouslyAllowInsecureHttpRequests: true },
          { idToken: '_token_', postLogoutRedirectUrl: '_redirect_' }
        );
        expect(mockLogout).toHaveBeenCalledWith(
          config.issuer,
          '_token_',
          '_redirect_',
          config.serviceConfiguration,
          config.additionalParameters,
          true,
          config.androidAllowCustomBrowsers
        );
      });

      it('calls the native wrapper with the correct args and dangerouslyAllowInsecureHttpRequests set to `false`', () => {
        logout(
          { ...config, dangerouslyAllowInsecureHttpRequests: false },
          { idToken: '_token_', postLogoutRedirectUrl: '_redirect_' }
        );
        expect(mockLogout).toHaveBeenCalledWith(
          config.issuer,
          '_token_',
          '_redirect_',
          config.serviceConfiguration,
          config.additionalParameters,
          false,
          config.androidAllowCustomBrowsers
        );
      });
    });
  });
});
