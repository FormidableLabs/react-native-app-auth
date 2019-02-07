export interface ServiceConfiguration {
  authorizationEndpoint: string;
  tokenEndpoint: string;
  revocationEndpoint?: string;
  registrationEndpoint?: string;
}

export type BaseAuthConfiguration =
  | {
      clientId: string;
      issuer?: string;
      serviceConfiguration: ServiceConfiguration;
    }
  | {
      clientId: string;
      issuer: string;
      serviceConfiguration?: ServiceConfiguration;
    };

interface BuiltInParameters {
  display?: 'page' | 'popup' | 'touch' | 'wap';
  login_prompt?: string;
  prompt?: 'consent' | 'login' | 'none' | 'select_account';
}

export type AuthConfiguration = BaseAuthConfiguration & {
  clientSecret?: string;
  scopes: string[];
  redirectUrl: string;
  additionalParameters?: BuiltInParameters & { [name: string]: string };
  dangerouslyAllowInsecureHttpRequests?: boolean;
  useNonce?: boolean;
  usePKCE?: boolean;
};

export interface AuthorizeResult {
  additionalParameters: { [name: string]: string };
  scopes: [string];
  authorizationCode: string;
  state: string;
}

export interface RefreshResult {
  accessToken: string;
  accessTokenExpirationDate: string;
  additionalParameters: { [name: string]: string };
  idToken: string;
  refreshToken: string;
  tokenType: string;
}

export interface TokenExchangeResult {
  accessToken: string;
  additionalParameters: { [name: string]: string };
  idToken: string;
  refreshToken: string;
  tokenType: string;
  accessTokenExpirationTime?: string;
}

export interface RevokeConfiguration {
  tokenToRevoke: string;
  sendClientId?: boolean;
}

export interface RefreshConfiguration {
  refreshToken: string;
}

export interface AuthorizeAndTokenResult {
  authorizeResult: AuthorizeResult;
  tokenResult: TokenExchangeResult;
}

export function onlyAuthorize(config: AuthConfiguration): Promise<AuthorizeResult>;

export function onlyTokenExchange(): Promise<TokenExchangeResult>;

export function authorize(config: AuthConfiguration): Promise<AuthorizeAndTokenResult>;

export function refresh(
  config: AuthConfiguration,
  refreshConfig: RefreshConfiguration
): Promise<RefreshResult>;

export function revoke(
  config: BaseAuthConfiguration,
  revokeConfig: RevokeConfiguration
): Promise<void>;
