export interface ServiceConfiguration {
  authorizationEndpoint: string;
  tokenEndpoint: string;
  revocationEndpoint?: string;
  registrationEndpoint?: string;
  endSessionEndpoint?: string;
}

export type BaseConfiguration =
  | {
      issuer?: string;
      serviceConfiguration: ServiceConfiguration;
    }
  | {
      issuer: string;
      serviceConfiguration?: ServiceConfiguration;
    };

type CustomHeaders = {
  authorize?: Record<string, string>;
  token?: Record<string, string>;
  register?: Record<string, string>;
};

type AdditionalHeaders = Record<string, string>;

interface BuiltInRegistrationParameters {
  client_name?: string;
  logo_uri?: string;
  client_uri?: string;
  policy_uri?: string;
  tos_uri?: string;
}

export type RegistrationConfiguration = BaseConfiguration & {
  redirectUrls: string[];
  responseTypes?: string[];
  grantTypes?: string[];
  subjectType?: string;
  tokenEndpointAuthMethod?: string;
  additionalParameters?: BuiltInRegistrationParameters & { [name: string]: string };
  dangerouslyAllowInsecureHttpRequests?: boolean;
  customHeaders?: CustomHeaders;
  additionalHeaders?: AdditionalHeaders;
};

export interface RegistrationResponse {
  clientId: string;
  additionalParameters?: { [name: string]: string };
  clientIdIssuedAt?: string;
  clientSecret?: string;
  clientSecretExpiresAt?: string;
  registrationAccessToken?: string;
  registrationClientUri?: string;
  tokenEndpointAuthMethod?: string;
}

interface BuiltInParameters {
  display?: 'page' | 'popup' | 'touch' | 'wap';
  login_prompt?: string;
  prompt?: 'consent' | 'login' | 'none' | 'select_account';
}

export type BaseAuthConfiguration = BaseConfiguration & {
  clientId: string;
};

export type AuthConfiguration = BaseAuthConfiguration & {
  clientSecret?: string;
  scopes: string[];
  redirectUrl: string;
  additionalParameters?: BuiltInParameters & { [name: string]: string };
  clientAuthMethod?: 'basic' | 'post';
  dangerouslyAllowInsecureHttpRequests?: boolean;
  customHeaders?: CustomHeaders;
  additionalHeaders?: AdditionalHeaders;
  connectionTimeoutSeconds?: number;
  useNonce?: boolean;
  usePKCE?: boolean;
  warmAndPrefetchChrome?: boolean;
  skipCodeExchange?: boolean;
};

export type EndSessionConfiguration = BaseAuthConfiguration & {
  additionalParameters?: { [name: string]: string };
  dangerouslyAllowInsecureHttpRequests?: boolean;
};

export interface AuthorizeResult {
  accessToken: string;
  accessTokenExpirationDate: string;
  authorizeAdditionalParameters?: { [name: string]: string };
  tokenAdditionalParameters?: { [name: string]: string };
  idToken: string;
  refreshToken: string;
  tokenType: string;
  scopes: string[];
  authorizationCode: string;
  codeVerifier?: string;
}

export interface RefreshResult {
  accessToken: string;
  accessTokenExpirationDate: string;
  additionalParameters?: { [name: string]: string };
  idToken: string;
  refreshToken: string | null;
  tokenType: string;
}

export interface RevokeConfiguration {
  tokenToRevoke: string;
  sendClientId?: boolean;
  includeBasicAuth?: boolean;
}

export interface RefreshConfiguration {
  refreshToken: string;
}

export interface LogoutConfiguration {
  idToken: string;
  postLogoutRedirectUrl: string;
}

export interface EndSessionResult {
  idTokenHint: string;
  postLogoutRedirectUri: string;
  state: string;
}

export function prefetchConfiguration(config: AuthConfiguration): Promise<void>;

export function register(config: RegistrationConfiguration): Promise<RegistrationResponse>;

export function authorize(config: AuthConfiguration): Promise<AuthorizeResult>;

export function refresh(
  config: AuthConfiguration,
  refreshConfig: RefreshConfiguration
): Promise<RefreshResult>;

export function revoke(
  config: BaseAuthConfiguration,
  revokeConfig: RevokeConfiguration
): Promise<void>;

export function logout(
  config: EndSessionConfiguration,
  logoutConfig: LogoutConfiguration
): Promise<EndSessionResult>;

// https://tools.ietf.org/html/rfc6749#section-4.1.2.1
type OAuthAuthorizationErrorCode =
  | 'unauthorized_client'
  | 'access_denied'
  | 'unsupported_response_type'
  | 'invalid_scope'
  | 'server_error'
  | 'temporarily_unavailable';
// https://tools.ietf.org/html/rfc6749#section-5.2
type OAuthTokenErrorCode =
  | 'invalid_request'
  | 'invalid_client'
  | 'invalid_grant'
  | 'unauthorized_client'
  | 'unsupported_grant_type'
  | 'invalid_scope';
// https://openid.net/specs/openid-connect-registration-1_0.html#RegistrationError
type OICRegistrationErrorCode = 'invalid_redirect_uri' | 'invalid_client_metadata';
type AppAuthErrorCode =
  | 'service_configuration_fetch_error'
  | 'authentication_failed'
  | 'token_refresh_failed'
  | 'registration_failed'
  | 'browser_not_found'
  | 'end_session_failed';

type ErrorCode =
  | OAuthAuthorizationErrorCode
  | OAuthTokenErrorCode
  | OICRegistrationErrorCode
  | AppAuthErrorCode;

export interface AppAuthError extends Error {
  code: ErrorCode;
}
