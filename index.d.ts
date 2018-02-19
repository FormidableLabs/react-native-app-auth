export interface AuthConfiguration extends BaseAuthConfiguration {
    scopes: string[];
    redirectUrl: string;
    aditionalParameters?: object;
  }

  export interface BaseAuthConfiguration{
    issuer: string;
    clientId: string;
  }

  export interface RevokeConfiguration{
    clientId: string;
    issuer: string;
  }

  export interface AuthorizeResult {
    accessToken: string;
    accessTokenExpirationDate: string;
    additionalParameters: object;
    idToken: string;
    refreshToken: string;
    tokenType: string;
  }

  export interface RevokeOptions {
    tokenToRevoke: string;
    sendClientId?: boolean;
  }

  export function authorize(properties: AuthConfiguration): Promise<AuthorizeResult>;

  export function refresh(
    properties: AuthConfiguration,
    { refreshToken: string }
  ): Promise<AuthorizeResult>;

  export function revoke(
    properties: BaseAuthConfiguration,
    options: RevokeOptions
): Promise<void>;