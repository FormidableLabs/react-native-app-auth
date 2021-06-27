import { authorize, refresh, register } from './';

jest.mock('react-native', () => ({
  NativeModules: {
    RNAppAuth: {
      register: jest.fn(),
      authorize: jest.fn(),
      refresh: jest.fn(),
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

  beforeAll(() => {
    mockRegister = require('react-native').NativeModules.RNAppAuth.register;
    mockRegister.mockReturnValue('REGISTERED');

    mockAuthorize = require('react-native').NativeModules.RNAppAuth.authorize;
    mockAuthorize.mockReturnValue('AUTHORIZED');

    mockRefresh = require('react-native').NativeModules.RNAppAuth.refresh;
    mockRefresh.mockReturnValue('REFRESHED');
  });

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
    skipCodeExchange: false,
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
  };

  describe('register', () => {
    beforeEach(() => {
      mockRegister.mockReset();
      mockAuthorize.mockReset();
      mockRefresh.mockReset();
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
        registerConfig.additionalHeaders
      );
    });

    describe('iOS-specific', () => {
      beforeEach(() => {
        require('react-native').Platform.OS = 'ios';
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
        config.additionalHeaders,
        config.useNonce,
        config.usePKCE
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
        null,
        true,
        true
      );
    });

    describe('iOS-specific', () => {
      beforeEach(() => {
        require('react-native').Platform.OS = 'ios';
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
            additionalHeaders,
            config.useNonce,
            config.usePKCE
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
          authorize(config, { refreshToken: 'such-token' });
          expect(mockAuthorize).toHaveBeenCalledWith(
            config.issuer,
            config.redirectUrl,
            config.clientId,
            config.clientSecret,
            config.scopes,
            config.additionalParameters,
            config.serviceConfiguration,
            false,
            config.additionalHeaders,
            true,
            true
          );
        });

        it('calls the native wrapper with passed value `false`', () => {
          authorize({ ...config, useNonce: false }, { refreshToken: 'such-token' });
          expect(mockAuthorize).toHaveBeenCalledWith(
            config.issuer,
            config.redirectUrl,
            config.clientId,
            config.clientSecret,
            config.scopes,
            config.additionalParameters,
            config.serviceConfiguration,
            false,
            config.additionalHeaders,
            false,
            true
          );
        });
      });

      describe('usePKCE parameter', () => {
        it('calls the native wrapper with default value `true`', () => {
          authorize(config, { refreshToken: 'such-token' });
          expect(mockAuthorize).toHaveBeenCalledWith(
            config.issuer,
            config.redirectUrl,
            config.clientId,
            config.clientSecret,
            config.scopes,
            config.additionalParameters,
            config.serviceConfiguration,
            config.skipCodeExchange,
            config.additionalHeaders,
            config.useNonce,
            true
          );
        });

        it('calls the native wrapper with passed value `false`', () => {
          authorize({ ...config, usePKCE: false }, { refreshToken: 'such-token' });
          expect(mockAuthorize).toHaveBeenCalledWith(
            config.issuer,
            config.redirectUrl,
            config.clientId,
            config.clientSecret,
            config.scopes,
            config.additionalParameters,
            config.serviceConfiguration,
            config.skipCodeExchange,
            config.additionalHeaders,
            config.useNonce,
            false
          );
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
            config.useNonce,
            config.usePKCE,
            config.clientAuthMethod,
            false,
            config.customHeaders
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
            config.useNonce,
            config.usePKCE,
            config.clientAuthMethod,
            false,
            config.customHeaders
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
            config.useNonce,
            config.usePKCE,
            config.clientAuthMethod,
            true,
            config.customHeaders
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
            config.useNonce,
            config.usePKCE,
            config.clientAuthMethod,
            false,
            customHeaders
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

    it('throws an error when no refreshToken is passed in', () => {
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
        config.serviceConfiguration,
        config.additionalHeaders
      );
    });

    describe('iOS-specific', () => {
      beforeEach(() => {
        require('react-native').Platform.OS = 'ios';
      });

      describe('additionalHeaders parameter', () => {
        it('calls the native wrapper with additional headers', () => {
          const additionalHeaders = { header: 'value' };
          const refreshToken = 'a-token';
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
            additionalHeaders
          );
        });

        it('throws an error when values are not Record<string,string>', () => {
          expect(() => {
            refresh(
              { ...config, additionalHeaders: { notString: {} } },
              { refreshToken: 'such-token' }
            );
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

      describe(' dangerouslyAllowInsecureHttpRequests parameter', () => {
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
            config.clientAuthMethod,
            false,
            config.customHeaders
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
            config.clientAuthMethod,
            false,
            config.customHeaders
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
            config.clientAuthMethod,
            true,
            config.customHeaders
          );
        });
      });

      describe('customHeaders parameter', () => {
        it('calls the native wrapper with headers', () => {
          const customTokenHeaders = { Authorization: 'Basic someBase64Value' };
          const customAuthorizeHeaders = { Authorization: 'Basic someOtherBase64Value' };
          const customHeaders = { token: customTokenHeaders, authorize: customAuthorizeHeaders };
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
            config.useNonce,
            config.usePKCE,
            config.clientAuthMethod,
            false,
            customHeaders
          );
        });
      });
    });
  });
});
