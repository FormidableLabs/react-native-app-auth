export interface AppAuthInput {
    scopes: string[];
    issuer: string;
    clientId: string;
    redirectUrl: string;
    aditionalParameters?: object;
  }

  export interface AuthorizeResult {
    accessToken: string;
    accessTokenExpirationDate: string;
    additionalParameters: object;
    idToken: string;
    refreshToken: string;
    tokenType: string;
  }

  export function authorize(properties: AppAuthInput): Promise<AuthorizeResult>;

  export function refresh(
    properties: AppAuthInput,
    { refreshToken: string }
  ): Promise<AuthorizeResult>;

  export function revoke(
    properties: AppAuthInput,
    { tokenToRevoke: string, sendClientId: boolean }
): Promise<void>;