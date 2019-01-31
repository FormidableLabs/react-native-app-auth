import { authorize, refresh } from './';

jest.mock('react-native', () => ({
  NativeModules: {
    RNAppAuth: {
      authorize: jest.fn(),
      refresh: jest.fn(),
    },
  },
  Platform: {
    OS: 'ios',
  },
}));

describe('AppAuth', () => {
  let mockAuthorize;
  let mockRefresh;

  beforeAll(() => {
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
    serviceConfiguration: null,
    scopes: ['my-scope'],
    useNonce: true,
    usePKCE: true,
  };

  describe('authorize', () => {
    beforeEach(() => {
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
        authorize(config);
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
        authorize({ ...config, dangerouslyAllowInsecureHttpRequests: false });
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
        authorize({ ...config, dangerouslyAllowInsecureHttpRequests: true });
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

  describe('refresh', () => {
    beforeEach(() => {
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

    describe('iOS-specific useNonce parameter', () => {
      beforeEach(() => {
        require('react-native').Platform.OS = 'ios';
      });

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
          true
        );
      });
    });

    describe('iOS-specific usePKCE parameter', () => {
      beforeEach(() => {
        require('react-native').Platform.OS = 'ios';
      });

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
          config.useNonce,
          false
        );
      });
    });
  });
});
