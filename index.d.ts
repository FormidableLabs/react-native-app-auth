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

export type AuthConfiguration = BaseAuthConfiguration & {
  clientSecret?: string;
  scopes: string[];
  redirectUrl: string;
  additionalParameters?: { [name: string]: string };
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
