
#import "RNAppAuth.h"
#import "AppAuth.h"
#import <React/RCTLog.h>
#import <React/RCTConvert.h>
#import "AppDelegate.h"

@implementation RNAppAuth

- (dispatch_queue_t)methodQueue
{
    return dispatch_get_main_queue();
}
RCT_EXPORT_MODULE()

RCT_REMAP_METHOD(authorize,
                 issuer: (NSString *) issuer
                 redirectUrl: (NSString *) redirectUrl
                 clientId: (NSString *) clientId
                 scopes: (NSArray *) scopes
                 resolve:(RCTPromiseResolveBlock) resolve
                 reject: (RCTPromiseRejectBlock)  reject)
{
  [OIDAuthorizationService discoverServiceConfigurationForIssuer:[NSURL URLWithString:issuer]
                                                      completion:^(OIDServiceConfiguration *_Nullable configuration, NSError *_Nullable error) {
                                                        if (!configuration) {
                                                         reject(@"RNAppAuth Error", [error localizedDescription], error);
                                                         return;
                                                        }

                                                        // builds authentication request
                                                        OIDAuthorizationRequest *request =
                                                        [[OIDAuthorizationRequest alloc] initWithConfiguration:configuration
                                                                                                      clientId:clientId
                                                                                                        scopes:scopes
                                                                                                   redirectURL:[NSURL URLWithString:redirectUrl]
                                                                                                  responseType:OIDResponseTypeCode
                                                                                          additionalParameters:nil];


                                                        // performs authentication request
                                                        AppDelegate *appDelegate =
                                                        (AppDelegate *)[UIApplication sharedApplication].delegate;

                                                        appDelegate.currentAuthorizationFlow =
                                                        [OIDAuthState authStateByPresentingAuthorizationRequest:request
                                                                                       presentingViewController:appDelegate.window.rootViewController
                                                                                                       callback:^(OIDAuthState *_Nullable authState,
                                                                                                                  NSError *_Nullable error) {
                                                                                                         if (authState) {
                                                                                                           NSDate *expirationDate = authState.lastTokenResponse.accessTokenExpirationDate ? authState.lastTokenResponse.accessTokenExpirationDate : [NSDate alloc];

                                                                                                           NSDateFormatter *dateFormat = [[NSDateFormatter alloc] init];
                                                                                                           [dateFormat setDateFormat:@"yyyy-MM-dd'T'HH:mm:ssZ"];
                                                                                                           NSString *exporationDateString = [dateFormat stringFromDate:expirationDate];

                                                                                                           NSDictionary *authStateDict = @{
                                                                                                                                           @"accessToken": authState.lastTokenResponse.accessToken,
                                                                                                                                           @"tokenType": authState.lastTokenResponse.tokenType,
                                                                                                                                           @"accessTokenExpirationDate": exporationDateString,
                                                                                                                                           @"idToken": authState.lastTokenResponse.idToken,
                                                                                                                                           @"refreshToken": authState.lastTokenResponse.refreshToken ? authState.lastTokenResponse.refreshToken : @"",
                                                                                                                                           @"additionalParameters": authState.lastTokenResponse.additionalParameters,
                                                                                                                                           };
                                                                                                           resolve(authStateDict);
                                                                                                         } else {
                                                                                                           reject(@"RNAppAuth Error", [error localizedDescription], error);
                                                                                                         }

                                                                                                       }]; // end [OIDAuthState authStateByPresentingAuthorizationRequest:request

                                                      }]; // end [OIDAuthorizationService discoverServiceConfigurationForIssuer:[NSURL URLWithString:issuer]

} // end RCT_REMAP_METHOD(authorize,

RCT_REMAP_METHOD(refresh,
                 issuer: (NSString *) issuer
                 redirectUrl: (NSString *) redirectUrl
                 clientId: (NSString *) clientId
                 refreshToken: (NSString *) refreshToken
                 scopes: (NSArray *) scopes
                 resolve:(RCTPromiseResolveBlock) resolve
                 reject: (RCTPromiseRejectBlock)  reject)
{
  [OIDAuthorizationService discoverServiceConfigurationForIssuer:[NSURL URLWithString:issuer]
                                                      completion:^(OIDServiceConfiguration *_Nullable configuration, NSError *_Nullable error) {
                                                        if (!configuration) {
                                                            reject(@"RNAppAuth Error", [error localizedDescription], error);
                                                            return;
                                                        }

                                                        OIDTokenRequest *tokenRefreshRequest =
                                                        [[OIDTokenRequest alloc] initWithConfiguration:configuration
                                                                                             grantType:@"refresh_token"
                                                                                     authorizationCode:nil
                                                                                           redirectURL:[NSURL URLWithString:redirectUrl]
                                                                                              clientID:clientId
                                                                                          clientSecret:nil
                                                                                                scopes:scopes
                                                                                          refreshToken:refreshToken
                                                                                          codeVerifier:nil
                                                                                  additionalParameters:nil];

                                                        [OIDAuthorizationService performTokenRequest:tokenRefreshRequest
                                                                                            callback:^(OIDTokenResponse *_Nullable response,
                                                                                                       NSError *_Nullable error) {

                                                                                              if (response) {

                                                                                                NSDate *expirationDate = response.accessTokenExpirationDate ?
                                                                                                response.accessTokenExpirationDate : [NSDate alloc];

                                                                                                NSDateFormatter *dateFormat = [[NSDateFormatter alloc] init];
                                                                                                [dateFormat setDateFormat:@"yyyy-MM-dd'T'HH:mm:ssZ"];
                                                                                                NSString *exporationDateString = [dateFormat stringFromDate:expirationDate];

                                                                                                resolve(@{
                                                                                                          @"accessToken": response.accessToken ? response.accessToken : @"",
                                                                                                          @"refreshToken": response.refreshToken ? response.refreshToken : @"",
                                                                                                          @"accessTokenExpirationDate": exporationDateString,
                                                                                                          });
                                                                                              } else {
                                                                                                reject(@"RNAppAuth Error", [error localizedDescription], error);
                                                                                              }
                                                                                            }];

                                                        }]; // end [OIDAuthorizationService discoverServiceConfigurationForIssuer:[NSURL URLWithString:issuer]
} // end RCT_REMAP_METHOD(refresh,

@end
