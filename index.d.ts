export interface ServiceConfiguration {
  authorizationEndpoint: string;
  tokenEndpoint: string;
  revocationEndpoint?: string;
}

export interface BaseAuthConfiguration {
  clientId: string;
  issuer?: string;
  serviceConfiguration?: ServiceConfiguration;
}

export interface AuthConfiguration extends BaseAuthConfiguration {
  clientSecret?: string;
  scopes: string[];
  redirectUrl: string;
  additionalParameters?: { [name: string]: string };
  dangerouslyAllowInsecureHttpRequests?: boolean;
}

export interface RevokeConfiguration {
  clientId: string;
  issuer: string;
}

export interface AuthorizeResult {
  accessToken: string;
  accessTokenExpirationDate: string;
  additionalParameters?: { [name: string]: string };
  idToken: string;
  refreshToken: string;
  tokenType: string;
}

export interface RevokeConfiguration {
  tokenToRevoke: string;
  sendClientId?: boolean;
}

export interface RefreshConfiguration {
  refreshToken: string;
}

export function authorize(config: AuthConfiguration): Promise<AuthorizeResult>;

export function refresh(
  config: AuthConfiguration,
  refreshConfig: RefreshConfiguration
): Promise<AuthorizeResult>;

export function revoke(
  config: BaseAuthConfiguration,
  revokeConfig: RevokeConfiguration
): Promise<void>;
