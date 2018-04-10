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
  display?: "page" | "popup" | "touch" | "wap";
  login_prompt?: string;
  prompt?: "consent" |"login" | "none" | "select_account";
  skipTokenExchange: boolean;
}

export type AuthConfiguration = BaseAuthConfiguration & {
  clientSecret?: string;
  scopes: string[];
  redirectUrl: string;
  additionalParameters?: BuiltInParameters & { [name: string]: string };
  dangerouslyAllowInsecureHttpRequests?: boolean;
};

export interface AuthorizeResult {
  accessToken: string;
  accessTokenExpirationDate: string;
  additionalParameters?: { [name: string]: string };
  idToken: string;
  refreshToken: string;
  tokenType: string;
}

export interface AuthorizeWithoutTokenExchangeResult {
  code: string; // i.e. authorizationCode
  state: string;
  redirectUri: string;
}

export interface RevokeConfiguration {
  tokenToRevoke: string;
  sendClientId?: boolean;
}

export interface RefreshConfiguration {
  refreshToken: string;
}

export function authorize(config: AuthConfiguration): Promise<AuthorizeResult|AuthorizeWithoutTokenExchangeResult>;

export function refresh(
  config: AuthConfiguration,
  refreshConfig: RefreshConfiguration
): Promise<AuthorizeResult>;

export function revoke(
  config: BaseAuthConfiguration,
  revokeConfig: RevokeConfiguration
): Promise<void>;
