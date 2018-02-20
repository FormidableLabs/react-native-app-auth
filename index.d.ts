export interface BaseAuthConfiguration {
  issuer: string;
  clientId: string;
}
export interface AuthConfiguration extends BaseAuthConfiguration {
  scopes: string[];
  redirectUrl: string;
  additionalParameters?: { [name: string]: string };
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
