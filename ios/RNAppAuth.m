#import "RNAppAuth.h"
#if __has_include(<AppAuth/AppAuth.h>)
#import <AppAuth/AppAuth.h>
#else
#import "AppAuth.h"
#endif
#import <React/RCTLog.h>
#import <React/RCTConvert.h>
#import "RNAppAuthAuthorizationFlowManager.h"

@interface RNAppAuth()<RNAppAuthAuthorizationFlowManagerDelegate> {
    id<OIDExternalUserAgentSession> _currentSession;
}
@end

@implementation RNAppAuth

-(BOOL)resumeExternalUserAgentFlowWithURL:(NSURL *)url {
    return [_currentSession resumeExternalUserAgentFlowWithURL:url];
}

- (dispatch_queue_t)methodQueue
{
    return dispatch_get_main_queue();
}

UIBackgroundTaskIdentifier taskId;

/*! @brief Number of random bytes generated for the @ state.
 */
static NSUInteger const kStateSizeBytes = 32;

/*! @brief Number of random bytes generated for the @ codeVerifier.
 */
static NSUInteger const kCodeVerifierBytes = 32;

RCT_EXPORT_MODULE()
    
RCT_REMAP_METHOD(register,
                 issuer: (NSString *) issuer
                 redirectUrls: (NSArray *) redirectUrls
                 responseTypes: (NSArray *) responseTypes
                 grantTypes: (NSArray *) grantTypes
                 subjectType: (NSString *) subjectType
                 tokenEndpointAuthMethod: (NSString *) tokenEndpointAuthMethod
                 additionalParameters: (NSDictionary *_Nullable) additionalParameters
                 serviceConfiguration: (NSDictionary *_Nullable) serviceConfiguration
                 resolve: (RCTPromiseResolveBlock) resolve
                 reject: (RCTPromiseRejectBlock)  reject)
{
    // if we have manually provided configuration, we can use it and skip the OIDC well-known discovery endpoint call
    if (serviceConfiguration) {
        OIDServiceConfiguration *configuration = [self createServiceConfiguration:serviceConfiguration];
        [self registerWithConfiguration: configuration
                           redirectUrls: redirectUrls
                          responseTypes: responseTypes
                             grantTypes: grantTypes
                            subjectType: subjectType
                tokenEndpointAuthMethod: tokenEndpointAuthMethod
                   additionalParameters: additionalParameters
                                resolve: resolve
                                 reject: reject];
    } else {
        [OIDAuthorizationService discoverServiceConfigurationForIssuer:[NSURL URLWithString:issuer]
                                                            completion:^(OIDServiceConfiguration *_Nullable configuration, NSError *_Nullable error) {
                                                                if (!configuration) {
                                                                    reject(@"service_configuration_fetch_error", [error localizedDescription], error);
                                                                    return;
                                                                }
                                                                [self registerWithConfiguration: configuration
                                                                                   redirectUrls: redirectUrls
                                                                                  responseTypes: responseTypes
                                                                                     grantTypes: grantTypes
                                                                                    subjectType: subjectType
                                                                        tokenEndpointAuthMethod: tokenEndpointAuthMethod
                                                                           additionalParameters: additionalParameters
                                                                                        resolve: resolve
                                                                                         reject: reject];
                                                            }];
    }
} // end RCT_REMAP_METHOD(register,

RCT_REMAP_METHOD(authorize,
                 issuer: (NSString *) issuer
                 redirectUrl: (NSString *) redirectUrl
                 clientId: (NSString *) clientId
                 clientSecret: (NSString *) clientSecret
                 scopes: (NSArray *) scopes
                 additionalParameters: (NSDictionary *_Nullable) additionalParameters
                 serviceConfiguration: (NSDictionary *_Nullable) serviceConfiguration
                 useNonce: (BOOL *) useNonce
                 usePKCE: (BOOL *) usePKCE
                 resolve: (RCTPromiseResolveBlock) resolve
                 reject: (RCTPromiseRejectBlock)  reject)
{
    // if we have manually provided configuration, we can use it and skip the OIDC well-known discovery endpoint call
    if (serviceConfiguration) {
        OIDServiceConfiguration *configuration = [self createServiceConfiguration:serviceConfiguration];
        [self authorizeWithConfiguration: configuration
                             redirectUrl: redirectUrl
                                clientId: clientId
                            clientSecret: clientSecret
                                  scopes: scopes
                                useNonce: useNonce
                                 usePKCE: usePKCE
                    additionalParameters: additionalParameters
                                 resolve: resolve
                                  reject: reject];
    } else {
        [OIDAuthorizationService discoverServiceConfigurationForIssuer:[NSURL URLWithString:issuer]
                                                            completion:^(OIDServiceConfiguration *_Nullable configuration, NSError *_Nullable error) {
                                                                if (!configuration) {
                                                                    reject(@"service_configuration_fetch_error", [error localizedDescription], error);
                                                                    return;
                                                                }
                                                                [self authorizeWithConfiguration: configuration
                                                                                     redirectUrl: redirectUrl
                                                                                        clientId: clientId
                                                                                    clientSecret: clientSecret
                                                                                          scopes: scopes
                                                                                        useNonce: useNonce
                                                                                         usePKCE: usePKCE
                                                                            additionalParameters: additionalParameters
                                                                                         resolve: resolve
                                                                                          reject: reject];
                                                            }];
    }
} // end RCT_REMAP_METHOD(authorize,

RCT_REMAP_METHOD(refresh,
                 issuer: (NSString *) issuer
                 redirectUrl: (NSString *) redirectUrl
                 clientId: (NSString *) clientId
                 clientSecret: (NSString *) clientSecret
                 refreshToken: (NSString *) refreshToken
                 scopes: (NSArray *) scopes
                 additionalParameters: (NSDictionary *_Nullable) additionalParameters
                 serviceConfiguration: (NSDictionary *_Nullable) serviceConfiguration
                 resolve:(RCTPromiseResolveBlock) resolve
                 reject: (RCTPromiseRejectBlock)  reject)
{
    // if we have manually provided configuration, we can use it and skip the OIDC well-known discovery endpoint call
    if (serviceConfiguration) {
        OIDServiceConfiguration *configuration = [self createServiceConfiguration:serviceConfiguration];
        [self refreshWithConfiguration: configuration
                           redirectUrl: redirectUrl
                              clientId: clientId
                          clientSecret: clientSecret
                          refreshToken: refreshToken
                                scopes: scopes
                  additionalParameters: additionalParameters
                               resolve: resolve
                                reject: reject];
    } else {
        // otherwise hit up the discovery endpoint
        [OIDAuthorizationService discoverServiceConfigurationForIssuer:[NSURL URLWithString:issuer]
                                                            completion:^(OIDServiceConfiguration *_Nullable configuration, NSError *_Nullable error) {
                                                                if (!configuration) {
                                                                    reject(@"service_configuration_fetch_error", [error localizedDescription], error);
                                                                    return;
                                                                }
                                                                [self refreshWithConfiguration: configuration
                                                                                   redirectUrl: redirectUrl
                                                                                      clientId: clientId
                                                                                  clientSecret: clientSecret
                                                                                  refreshToken: refreshToken
                                                                                        scopes: scopes
                                                                          additionalParameters: additionalParameters
                                                                                       resolve: resolve
                                                                                        reject: reject];
                                                            }];
    }
} // end RCT_REMAP_METHOD(refresh,


/*
 * Create a OIDServiceConfiguration from passed serviceConfiguration dictionary
 */
- (OIDServiceConfiguration *) createServiceConfiguration: (NSDictionary *) serviceConfiguration {
    NSURL *authorizationEndpoint = [NSURL URLWithString: [serviceConfiguration objectForKey:@"authorizationEndpoint"]];
    NSURL *tokenEndpoint = [NSURL URLWithString: [serviceConfiguration objectForKey:@"tokenEndpoint"]];
    NSURL *registrationEndpoint = [NSURL URLWithString: [serviceConfiguration objectForKey:@"registrationEndpoint"]];

    OIDServiceConfiguration *configuration =
    [[OIDServiceConfiguration alloc]
     initWithAuthorizationEndpoint:authorizationEndpoint
     tokenEndpoint:tokenEndpoint
     registrationEndpoint:registrationEndpoint];

    return configuration;
}

+ (nullable NSString *)generateCodeVerifier {
  return [OIDTokenUtilities randomURLSafeStringWithSize:kCodeVerifierBytes];
}

+ (nullable NSString *)generateState {
  return [OIDTokenUtilities randomURLSafeStringWithSize:kStateSizeBytes];
}

+ (nullable NSString *)codeChallengeS256ForVerifier:(NSString *)codeVerifier {
  if (!codeVerifier) {
    return nil;
  }
  // generates the code_challenge per spec https://tools.ietf.org/html/rfc7636#section-4.2
  // code_challenge = BASE64URL-ENCODE(SHA256(ASCII(code_verifier)))
  // NB. the ASCII conversion on the code_verifier entropy was done at time of generation.
    NSData *sha256Verifier = [OIDTokenUtilities sha256:codeVerifier];
  return [OIDTokenUtilities encodeBase64urlNoPadding:sha256Verifier];
}

    
/*
 * Perform dynamic client registration with provided OIDServiceConfiguration
 */
- (void)registerWithConfiguration: (OIDServiceConfiguration *) configuration
                     redirectUrls: (NSArray *) redirectUrlStrings
                    responseTypes: (NSArray *) responseTypes
                       grantTypes: (NSArray *) grantTypes
                      subjectType: (NSString *) subjectType
          tokenEndpointAuthMethod: (NSString *) tokenEndpointAuthMethod
             additionalParameters: (NSDictionary *_Nullable) additionalParameters
                          resolve: (RCTPromiseResolveBlock) resolve
                           reject: (RCTPromiseRejectBlock)  reject
{
    NSMutableArray<NSURL *> *redirectUrls = [NSMutableArray arrayWithCapacity:[redirectUrlStrings count]];
    for (NSString *urlString in redirectUrlStrings) {
        [redirectUrls addObject:[NSURL URLWithString:urlString]];
    }
    
    OIDRegistrationRequest *request =
    [[OIDRegistrationRequest alloc] initWithConfiguration:configuration
                                             redirectURIs:redirectUrls
                                            responseTypes:responseTypes
                                               grantTypes:grantTypes
                                              subjectType:subjectType
                                  tokenEndpointAuthMethod:tokenEndpointAuthMethod
                                     additionalParameters:additionalParameters];
    
    [OIDAuthorizationService performRegistrationRequest:request
                                             completion:^(OIDRegistrationResponse *_Nullable response,
                                                          NSError *_Nullable error) {
                                                 if (response) {
                                                     resolve([self formatRegistrationResponse:response]);
                                                 } else {
                                                     reject(@"registration_failed", [error localizedDescription], error);
                                                 }
                                            }];
}
    
/*
 * Authorize a user in exchange for a token with provided OIDServiceConfiguration
 */
- (void)authorizeWithConfiguration: (OIDServiceConfiguration *) configuration
                       redirectUrl: (NSString *) redirectUrl
                          clientId: (NSString *) clientId
                      clientSecret: (NSString *) clientSecret
                            scopes: (NSArray *) scopes
                          useNonce: (BOOL *) useNonce
                           usePKCE: (BOOL *) usePKCE
              additionalParameters: (NSDictionary *_Nullable) additionalParameters
                           resolve: (RCTPromiseResolveBlock) resolve
                            reject: (RCTPromiseRejectBlock)  reject
{

    NSString *codeVerifier = usePKCE ? [[self class] generateCodeVerifier] : nil;
    NSString *codeChallenge = usePKCE ? [[self class] codeChallengeS256ForVerifier:codeVerifier] : nil;
    NSString *nonce = useNonce ? [[self class] generateState] : nil;

    // builds authentication request
    OIDAuthorizationRequest *request =
    [[OIDAuthorizationRequest alloc] initWithConfiguration:configuration
                                                  clientId:clientId
                                              clientSecret:clientSecret
                                                     scope:[OIDScopeUtilities scopesWithArray:scopes]
                                               redirectURL:[NSURL URLWithString:redirectUrl]
                                              responseType:OIDResponseTypeCode
                                                     state:[[self class] generateState]
                                                     nonce:nonce
                                              codeVerifier:codeVerifier
                                             codeChallenge:codeChallenge
                                      codeChallengeMethod: usePKCE ? OIDOAuthorizationRequestCodeChallengeMethodS256 : nil
                                      additionalParameters:additionalParameters];

    // performs authentication request
    id<UIApplicationDelegate, RNAppAuthAuthorizationFlowManager> appDelegate = (id<UIApplicationDelegate, RNAppAuthAuthorizationFlowManager>)[UIApplication sharedApplication].delegate;
    if (![[appDelegate class] conformsToProtocol:@protocol(RNAppAuthAuthorizationFlowManager)]) {
        [NSException raise:@"RNAppAuth Missing protocol conformance"
                    format:@"%@ does not conform to RNAppAuthAuthorizationFlowManager", appDelegate];
    }
    appDelegate.authorizationFlowManagerDelegate = self;
    __weak typeof(self) weakSelf = self;

    taskId = [UIApplication.sharedApplication beginBackgroundTaskWithExpirationHandler:^{
        [UIApplication.sharedApplication endBackgroundTask:taskId];
        taskId = UIBackgroundTaskInvalid;
    }];

    _currentSession = [OIDAuthState authStateByPresentingAuthorizationRequest:request
                                   presentingViewController:appDelegate.window.rootViewController
                                                   callback:^(OIDAuthState *_Nullable authState,
                                                              NSError *_Nullable error) {
                                                       typeof(self) strongSelf = weakSelf;
                                                       strongSelf->_currentSession = nil;
                                                       [UIApplication.sharedApplication endBackgroundTask:taskId];
                                                       taskId = UIBackgroundTaskInvalid;
                                                       if (authState) {
                                                           resolve([self formatResponse:authState.lastTokenResponse
                                                               withAuthResponse:authState.lastAuthorizationResponse]);
                                                       } else {
                                                           reject(@"authentication_failed", [error localizedDescription], error);
                                                       }
                                                   }]; // end [OIDAuthState authStateByPresentingAuthorizationRequest:request
}


/*
 * Refresh a token with provided OIDServiceConfiguration
 */
- (void)refreshWithConfiguration: (OIDServiceConfiguration *)configuration
                     redirectUrl: (NSString *) redirectUrl
                        clientId: (NSString *) clientId
                    clientSecret: (NSString *) clientSecret
                    refreshToken: (NSString *) refreshToken
                          scopes: (NSArray *) scopes
            additionalParameters: (NSDictionary *_Nullable) additionalParameters
                         resolve:(RCTPromiseResolveBlock) resolve
                          reject: (RCTPromiseRejectBlock)  reject {

    OIDTokenRequest *tokenRefreshRequest =
    [[OIDTokenRequest alloc] initWithConfiguration:configuration
                                         grantType:@"refresh_token"
                                 authorizationCode:nil
                                       redirectURL:[NSURL URLWithString:redirectUrl]
                                          clientID:clientId
                                      clientSecret:clientSecret
                                            scopes:scopes
                                      refreshToken:refreshToken
                                      codeVerifier:nil
                              additionalParameters:additionalParameters];

    [OIDAuthorizationService performTokenRequest:tokenRefreshRequest
                                        callback:^(OIDTokenResponse *_Nullable response,
                                                   NSError *_Nullable error) {
                                            if (response) {
                                                resolve([self formatResponse:response]);
                                            } else {
                                                reject(@"token_refresh_failed", [error localizedDescription], error);
                                            }
                                        }];
}

/*
 * Take raw OIDTokenResponse and turn it to a token response format to pass to JavaScript caller
 */
- (NSDictionary*)formatResponse: (OIDTokenResponse*) response {
    NSDateFormatter *dateFormat = [[NSDateFormatter alloc] init];
    dateFormat.timeZone = [NSTimeZone timeZoneWithAbbreviation: @"UTC"];
    [dateFormat setLocale:[NSLocale localeWithLocaleIdentifier:@"en_US_POSIX"]];
    [dateFormat setDateFormat:@"yyyy-MM-dd'T'HH:mm:ss'Z'"];

    return @{@"accessToken": response.accessToken ? response.accessToken : @"",
             @"accessTokenExpirationDate": response.accessTokenExpirationDate ? [dateFormat stringFromDate:response.accessTokenExpirationDate] : @"",
             @"additionalParameters": response.additionalParameters,
             @"idToken": response.idToken ? response.idToken : @"",
             @"refreshToken": response.refreshToken ? response.refreshToken : @"",
             @"tokenType": response.tokenType ? response.tokenType : @"",
             };
}

/*
 * Take raw OIDTokenResponse and additional paramaeters from an OIDAuthorizationResponse
 *  and turn them into an extended token response format to pass to JavaScript caller
 */
- (NSDictionary*)formatResponse: (OIDTokenResponse*) response
       withAuthResponse:(OIDAuthorizationResponse*) authResponse {
    NSDateFormatter *dateFormat = [[NSDateFormatter alloc] init];
    dateFormat.timeZone = [NSTimeZone timeZoneWithAbbreviation: @"UTC"];
    [dateFormat setLocale:[NSLocale localeWithLocaleIdentifier:@"en_US_POSIX"]];
    [dateFormat setDateFormat:@"yyyy-MM-dd'T'HH:mm:ss'Z'"];

    return @{@"accessToken": response.accessToken ? response.accessToken : @"",
             @"accessTokenExpirationDate": response.accessTokenExpirationDate ? [dateFormat stringFromDate:response.accessTokenExpirationDate] : @"",
             @"authorizeAdditionalParameters": authResponse.additionalParameters,
             @"tokenAdditionalParameters": response.additionalParameters,
             @"idToken": response.idToken ? response.idToken : @"",
             @"refreshToken": response.refreshToken ? response.refreshToken : @"",
             @"tokenType": response.tokenType ? response.tokenType : @"",
             @"scopes": authResponse.scope ? [authResponse.scope componentsSeparatedByString:@" "] : [NSArray new],
             };
}
    
- (NSDictionary*)formatRegistrationResponse: (OIDRegistrationResponse*) response {
    NSDateFormatter *dateFormat = [[NSDateFormatter alloc] init];
    dateFormat.timeZone = [NSTimeZone timeZoneWithAbbreviation: @"UTC"];
    [dateFormat setLocale:[NSLocale localeWithLocaleIdentifier:@"en_US_POSIX"]];
    [dateFormat setDateFormat:@"yyyy-MM-dd'T'HH:mm:ss'Z'"];
    
    return @{@"clientId": response.clientID,
             @"additionalParameters": response.additionalParameters,
             @"clientIdIssuedAt": response.clientIDIssuedAt ? [dateFormat stringFromDate:response.clientIDIssuedAt] : @"",
             @"clientSecret": response.clientSecret ? response.clientSecret : @"",
             @"clientSecretExpiresAt": response.clientSecretExpiresAt ? [dateFormat stringFromDate:response.clientSecretExpiresAt] : @"",
             @"registrationAccessToken": response.registrationAccessToken ? response.registrationAccessToken : @"",
             @"registrationClientUri": response.registrationClientURI ? response.registrationClientURI : @"",
             @"tokenEndpointAuthMethod": response.tokenEndpointAuthenticationMethod ? response.tokenEndpointAuthenticationMethod : @"",
             };
}

@end
