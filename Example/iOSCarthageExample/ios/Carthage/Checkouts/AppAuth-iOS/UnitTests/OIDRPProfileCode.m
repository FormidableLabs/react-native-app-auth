/*! @file OIDRPProfileCode.m
    @brief AppAuth iOS SDK
    @copyright
        Copyright 2017 Google Inc. All Rights Reserved.
    @copydetails
        Licensed under the Apache License, Version 2.0 (the "License");
        you may not use this file except in compliance with the License.
        You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

        Unless required by applicable law or agreed to in writing, software
        distributed under the License is distributed on an "AS IS" BASIS,
        WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
        See the License for the specific language governing permissions and
        limitations under the License.
 */

#import "OIDRPProfileCode.h"

#import "OIDAuthorizationRequest.h"
#import "OIDAuthorizationResponse.h"
#import "OIDAuthorizationService.h"
#import "OIDAuthState.h"
#import "OIDExternalUserAgentSession.h"
#import "OIDIDToken.h"
#import "OIDRegistrationRequest.h"
#import "OIDRegistrationResponse.h"
#import "OIDScopes.h"
#import "OIDServiceConfiguration.h"
#import "OIDServiceDiscovery.h"
#import "OIDTokenRequest.h"
#import "OIDTokenResponse.h"

static NSString *const kRedirectURI = @"com.example.app:/oauth2redirect/example-provider";

// Open ID RP Certification test server http://openid.net/certification/rp_testing/
static NSString *const kTestURIBase =
    @"https://rp.certification.openid.net:8080/appauth-ios-macos/";

/*! @brief A UI Coordinator for testing, has no user agent and doesn't support user interaction.
        Simply performs the authorization request as a GET request, and looks for a redirect in
        the response.
 */
@interface OIDAuthorizationUICoordinatorNonInteractive : NSObject <OIDExternalUserAgent, NSURLSessionTaskDelegate>{
  NSURLSession *_urlSession;
  __weak id<OIDExternalUserAgentSession> _session;
}
@end

@implementation OIDAuthorizationUICoordinatorNonInteractive

- (BOOL)presentExternalUserAgentRequest:(id<OIDExternalUserAgentRequest> )request
                                session:(id<OIDExternalUserAgentSession>)session {
  _session = session;
  NSURL *requestURL = [request externalUserAgentRequestURL];
  NSMutableURLRequest *URLRequest = [[NSURLRequest requestWithURL:requestURL] mutableCopy];
  NSURLSessionConfiguration* config = [NSURLSessionConfiguration defaultSessionConfiguration];
  _urlSession = [NSURLSession sessionWithConfiguration:config delegate:self delegateQueue:nil];
  [[_urlSession dataTaskWithRequest:URLRequest
                  completionHandler:^(NSData *_Nullable data,
                                      NSURLResponse *_Nullable response,
                                      NSError *_Nullable error) {
    NSDictionary* headers = [(NSHTTPURLResponse *)response allHeaderFields];
    NSString *location = [headers objectForKey:@"Location"];
    NSURL *url = [NSURL URLWithString:location];
    [session resumeExternalUserAgentFlowWithURL:url];
  }] resume];

  return YES;
}

- (void)dismissExternalUserAgentAnimated:(BOOL)animated completion:(void (^)(void))completion {
  if (completion) completion();
}

- (void)URLSession:(NSURLSession *)session
                          task:(NSURLSessionTask *)task
    willPerformHTTPRedirection:(NSHTTPURLResponse *)response
                    newRequest:(NSURLRequest *)request
             completionHandler:(void (^)(NSURLRequest *))completionHandler {
  // Disables HTTP redirection in the NSURLSession
  completionHandler(NULL);
}
@end

@interface OIDAuthorizationSession : NSObject<OIDExternalUserAgentSession>

- (instancetype)init NS_UNAVAILABLE;

- (instancetype)initWithRequest:(OIDAuthorizationRequest *)request
    NS_DESIGNATED_INITIALIZER;

@end

@interface OIDRPProfileCode : XCTestCase {
  // private variables
  OIDAuthorizationUICoordinatorNonInteractive *_coordinator;
  FILE * _logFile;
}
typedef void (^PostRegistrationCallback)(OIDServiceConfiguration *configuration,
                                         OIDRegistrationResponse *registrationResponse,
                                         NSError *error
                                         );

typedef void (^CodeExchangeCompletion)(OIDAuthorizationResponse *_Nullable authorizationResponse,
                                       OIDTokenResponse *_Nullable tokenResponse,
                                       NSError *tokenError
                                       );

typedef void (^UserInfoCompletion)(OIDAuthState *_Nullable authState,
                                   NSDictionary *_Nullable userInfoDictionary,
                                   NSError *userInfo
                                   );

@end

@implementation OIDRPProfileCode

- (void)setUp {
  [super setUp];
}

- (void)tearDown {
  [super tearDown];
  
  [self endCertificationTest];
}

/*! @brief Performs client registration.
    @param issuer The issuer to register the client with.
    @param callback Completion block.
 */
- (void)doRegistrationWithIssuer:(NSURL *)issuer callback:(PostRegistrationCallback)callback {
  NSURL *redirectURI = [NSURL URLWithString:kRedirectURI];

  // discovers endpoints
  [OIDAuthorizationService discoverServiceConfigurationForIssuer:issuer
      completion:^(OIDServiceConfiguration *_Nullable configuration, NSError *_Nullable error) {

    if (!configuration) {
      callback(nil, nil, error);
      return;
    }

    OIDRegistrationRequest *request =
        [[OIDRegistrationRequest alloc] initWithConfiguration:configuration
                                                 redirectURIs:@[ redirectURI ]
                                                responseTypes:nil
                                                   grantTypes:nil
                                                  subjectType:nil
                                      tokenEndpointAuthMethod:@"client_secret_basic"
                                         additionalParameters:@{@"id_token_signed_response_alg":
                                                                    @"none",
                                                                @"contacts":
                                                                    @"appauth@wdenniss.com"}];

    [self certificationLog:@"Registration request: %@", request];

    // performs registration request
    [OIDAuthorizationService performRegistrationRequest:request
        completion:^(OIDRegistrationResponse *_Nullable regResp, NSError *_Nullable error) {
      if (regResp) {
        callback(configuration, regResp, nil);
      } else {
        callback(nil, nil, error);
      }
    }];
  }];
}

/*! @brief Performs the code flow on the test server.
    @param test The test ID used to configure the test server.
    @param completion Completion block.
 */
- (void)codeFlowWithExchangeForTest:(NSString *)test completion:(CodeExchangeCompletion)completion {
  [self codeFlowWithExchangeForTest:test scope:@[ OIDScopeOpenID ] completion:completion];
}

/*! @brief Performs the code flow on the test server.
    @param test The test ID used to configure the test server.
    @param scope Scope to use in the authorization request.
    @param completion Completion block.
 */
- (void)codeFlowWithExchangeForTest:(NSString *)test
                              scope:(NSArray<NSString *> *)scope
                         completion:(CodeExchangeCompletion)completion {

  NSString *issuerString = [kTestURIBase stringByAppendingString:test];

  XCTestExpectation *expectation =
  [self expectationWithDescription:@"Discovery and registration should complete."];
  XCTestExpectation *auth_complete =
  [self expectationWithDescription:@"Authorization should complete."];
  XCTestExpectation *token_exchange =
  [self expectationWithDescription:@"Token Exchange should complete."];

  NSURL *issuer = [NSURL URLWithString:issuerString];
  
  [self doRegistrationWithIssuer:issuer callback:^(OIDServiceConfiguration *configuration,
                                                   OIDRegistrationResponse *registrationResponse,
                                                   NSError *error) {
    [expectation fulfill];
    XCTAssertNotNil(configuration);
    XCTAssertNotNil(registrationResponse);
    XCTAssertNil(error);

    if (error) {
      return;
    }

    NSURL *redirectURI = [NSURL URLWithString:kRedirectURI];
    // builds authentication request
    OIDAuthorizationRequest *request =
    [[OIDAuthorizationRequest alloc] initWithConfiguration:configuration
                                                  clientId:registrationResponse.clientID
                                              clientSecret:registrationResponse.clientSecret
                                                    scopes:scope
                                               redirectURL:redirectURI
                                              responseType:OIDResponseTypeCode
                                      additionalParameters:nil];

    self->_coordinator = [[OIDAuthorizationUICoordinatorNonInteractive alloc] init];

    [self certificationLog:@"Initiating authorization request: %@",
     [request authorizationRequestURL]];

    [OIDAuthorizationService presentAuthorizationRequest:request
                                       externalUserAgent:self->_coordinator
        callback:^(OIDAuthorizationResponse *_Nullable authorizationResponse,
                   NSError *error) {
      [auth_complete fulfill];
      XCTAssertNotNil(authorizationResponse);
      XCTAssertNil(error);

      OIDTokenRequest *tokenExchangeRequest = [authorizationResponse tokenExchangeRequest];
      [OIDAuthorizationService performTokenRequest:tokenExchangeRequest
                     originalAuthorizationResponse:authorizationResponse
                                          callback:^(OIDTokenResponse *_Nullable tokenResponse,
                                                     NSError *_Nullable tokenError) {
        [token_exchange fulfill];
        completion(authorizationResponse, tokenResponse, tokenError);
      }];
    }];
  }];
  [self waitForExpectationsWithTimeout:30 handler:nil];
}

/*! @brief Performs the code flow on the test server and expects a successful result.
    @param test The test ID.
 */
- (void)codeFlowWithExchangeExpectSuccessForTest:(NSString *)test {
  [self codeFlowWithExchangeForTest:test
                         completion:^(OIDAuthorizationResponse * _Nullable authorizationResponse,
                                      OIDTokenResponse * _Nullable tokenResponse,
                                      NSError *tokenError) {
    XCTAssertNotNil(tokenResponse);
    XCTAssertNil(tokenError);
    // testRP_id_token_sig_none
    XCTAssertNotNil(tokenResponse.idToken);
                           
    [self certificationLog:@"PASS: Got token response: %@", tokenResponse];
  }];
}

- (void)testRP_response_type_code {
  NSString *testName = @"rp-response_type-code";
  [self startCertificationTest:testName];
  [self codeFlowWithExchangeExpectSuccessForTest:testName];
}

- (void)testRP_id_token_sig_none {
  NSString *testName = @"rp-id_token-sig-none";
  [self startCertificationTest:testName];
  [self codeFlowWithExchangeExpectSuccessForTest:testName];
}

- (void)testRP_token_endpoint_client_secret_basic {
  NSString *testName = @"rp-token_endpoint-client_secret_basic";
  [self startCertificationTest:testName];

  [self codeFlowWithExchangeExpectSuccessForTest:testName];
}

/*! @brief Performs the code flow on the test server and expects a failure result.
    @param test The test ID.
 */
- (void)codeFlowWithExchangeExpectFailForTest:(NSString *)test {
  [self codeFlowWithExchangeForTest:test
                         completion:^(OIDAuthorizationResponse * _Nullable authorizationResponse,
                                      OIDTokenResponse * _Nullable tokenResponse,
                                      NSError *tokenError) {
    XCTAssertNil(tokenResponse);
    XCTAssertNotNil(tokenError);

    if (tokenError) {
      [self certificationLog:@"PASS: Token exchange failed with %@", tokenError];
    }
  }];
}

- (void)testRP_id_token_aud {
  NSString *testName = @"rp-id_token-aud";
  [self startCertificationTest:testName];
  [self codeFlowWithExchangeExpectFailForTest:testName];
}

- (void)testRP_id_token_iat {
  NSString *testName = @"rp-id_token-iat";
  [self startCertificationTest:testName];
  [self codeFlowWithExchangeExpectFailForTest:testName];
}

- (void)testRP_id_token_sub {
  NSString *testName = @"rp-id_token-sub";
  [self startCertificationTest:testName];
  [self codeFlowWithExchangeExpectFailForTest:testName];
}

- (void)testRP_id_token_issuer_mismatch {
  NSString *testName = @"rp-id_token-issuer-mismatch";
  [self startCertificationTest:testName];
  [self codeFlowWithExchangeExpectFailForTest:testName];
}

- (void)testRP_nonce_invalid {
  NSString *testName = @"rp-nonce-invalid";
  [self startCertificationTest:testName];
  [self codeFlowWithExchangeExpectFailForTest:testName];
}

/*! @brief Makes a UserInfo request then calls completion block.
    @param test The test ID used to configure the test server.
    @param completion Completion block.
 */
- (void)codeFlowThenUserInfoForTest:(NSString *)test completion:(UserInfoCompletion)completion {
  
  // Adds another expectation that codeFlowWithExchangeForTest will wait for.
  XCTestExpectation *userinfoExpectation =
      [self expectationWithDescription:@"Userinfo response."];

  NSArray<NSString *> *scope =
      @[ OIDScopeOpenID, OIDScopeProfile, OIDScopeEmail, OIDScopeAddress, OIDScopePhone ];
  [self codeFlowWithExchangeForTest:test
                              scope:scope
                         completion:^(OIDAuthorizationResponse * _Nullable authorizationResponse,
                                      OIDTokenResponse * _Nullable tokenResponse,
                                      NSError *tokenError) {
    XCTAssertNotNil(tokenResponse);
    XCTAssertNil(tokenError);
               
    [self certificationLog:@"Got access token: %@", tokenResponse.accessToken];
                           
    OIDAuthState *authState =
        [[OIDAuthState alloc] initWithAuthorizationResponse:authorizationResponse
                                              tokenResponse:tokenResponse];
                           
    NSURL *userinfoEndpoint =
       authState.lastAuthorizationResponse.request.configuration.discoveryDocument.userinfoEndpoint;
    XCTAssertNotNil(userinfoEndpoint);

    [authState performActionWithFreshTokens:^(NSString *_Nonnull accessToken,
                                              NSString *_Nonnull idToken,
                                              NSError *_Nullable error) {
      XCTAssertNil(error);

      // creates request to the userinfo endpoint, with access token in the Authorization header
      NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:userinfoEndpoint];
      NSString *authorizationHeaderValue = [NSString stringWithFormat:@"Bearer %@", accessToken];
      [request addValue:authorizationHeaderValue forHTTPHeaderField:@"Authorization"];

      NSURLSessionConfiguration *configuration =
      [NSURLSessionConfiguration defaultSessionConfiguration];
      NSURLSession *session = [NSURLSession sessionWithConfiguration:configuration
                                                            delegate:nil
                                                       delegateQueue:nil];

      [self certificationLog:@"Performing UserInfo request to: %@", userinfoEndpoint];
      [self certificationLog:@"- Headers: %@", request.allHTTPHeaderFields];
      
      // performs HTTP request
      NSURLSessionDataTask *postDataTask =
          [session dataTaskWithRequest:request
                     completionHandler:^(NSData *_Nullable data,
                                         NSURLResponse *_Nullable response,
                                         NSError *_Nullable error) {
        dispatch_async(dispatch_get_main_queue(), ^() {
          [userinfoExpectation fulfill];
          XCTAssertNil(error);
          XCTAssert([response isKindOfClass:[NSHTTPURLResponse class]]);
          NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)response;
          XCTAssert( (int)httpResponse.statusCode == 200);
          id jsonDictionaryOrArray =
              [NSJSONSerialization JSONObjectWithData:data options:0 error:NULL];
          completion(authState, jsonDictionaryOrArray, error);
        });
      }];

      [postDataTask resume];
    }];
  }];
}

- (void)testRP_userinfo_bearer_header {
  NSString *testName = @"rp-userinfo-bearer-header";
  [self startCertificationTest:testName];
  [self codeFlowThenUserInfoForTest:testName
                         completion:^(OIDAuthState * _Nullable authState,
                                      NSDictionary * _Nullable userInfoDictionary,
                                      NSError *userInfoError) {
    XCTAssertNotNil(userInfoDictionary);
    [self certificationLog:@"PASS: User info dictionary: %@", userInfoDictionary];
  }];
}

- (void)testRP_userinfo_bad_sub_claim {
  NSString *testName = @"rp-userinfo-bad-sub-claim";
  [self startCertificationTest:testName];

  [self codeFlowThenUserInfoForTest:testName
                         completion:^(OIDAuthState * _Nullable authState,
                                      NSDictionary * _Nullable userInfoDictionary,
                                      NSError *userInfo) {
    
    NSString *sub = userInfoDictionary[@"sub"];
    XCTAssertNotNil(sub);
    OIDIDToken *idToken =
        [[OIDIDToken alloc] initWithIDTokenString:authState.lastTokenResponse.idToken];
    XCTAssertNotNil(idToken);
    XCTAssertNotEqual(sub, idToken.subject);
    
    if (![sub isEqualToString:idToken.subject]) {
      [self certificationLog:@"PASS: UserInfo subject '%@' does not match id token subject '%@'",
                             sub,
                             idToken.subject];
    }
  }];
}

- (void)testRP_scope_userinfo_claims {
  NSString *testName = @"rp-scope-userinfo-claims";
  [self startCertificationTest:testName];
  [self codeFlowThenUserInfoForTest:testName
                         completion:^(OIDAuthState * _Nullable authState,
                                      NSDictionary * _Nullable userInfoDictionary,
                                      NSError *userInfo) {
    
    [self certificationLog:@"User info dictionary: %@", userInfoDictionary];

    XCTAssertNotNil(userInfoDictionary[@"name"]);
    XCTAssertNotNil(userInfoDictionary[@"email"]);
    XCTAssertNotNil(userInfoDictionary[@"email_verified"]);
    XCTAssertNotNil(userInfoDictionary[@"address"]);
    XCTAssertNotNil(userInfoDictionary[@"phone_number"]);
    if (userInfoDictionary[@"name"]
        && userInfoDictionary[@"email"]
        && userInfoDictionary[@"email_verified"]
        && userInfoDictionary[@"address"]
        && userInfoDictionary[@"phone_number"]) {
      [self certificationLog:@"PASS: name, email, email_verified, address, phone_number "
                              "claims present"];
    }
  }];
}

- (void)testRP_id_token_kid_absent_single_jwks {
  NSString *testName = @"rp-id_token-kid-absent-single-jwks";
  [self skippedTest:testName];
}
- (void)testRP_id_token_kid_absent_multiple_jwks {
  NSString *testName = @"rp-id_token-kid-absent-multiple-jwks";
  [self skippedTest:testName];
}
- (void)testRP_rp_id_token_bad_sig_rs256 {
  NSString *testName = @"rp-id_token-bad-sig-rs256";
  [self skippedTest:testName];
}

- (void)testRP_id_token_sig_rs256 {
  NSString *testName = @"rp-id_token-sig-rs256";
  [self skippedTest:testName];
}

- (void)skippedTest:(NSString *)testName {
  [self startCertificationTest:testName];

  NSString *issuerString = [kTestURIBase stringByAppendingString:testName];

  XCTestExpectation *expectation =
    [self expectationWithDescription:@"Discovery and registration should complete."];

  NSURL *issuer = [NSURL URLWithString:issuerString];

  [self doRegistrationWithIssuer:issuer callback:^(OIDServiceConfiguration *configuration,
                                                   OIDRegistrationResponse *registrationResponse,
                                                   NSError *error) {
    [expectation fulfill];

    XCTAssertNil(registrationResponse);
    XCTAssertNotNil(error);

    if (error) {
      [self certificationLog:@"Registration error: %@", error];
      [self certificationLog:@"SKIP. With id_token_signed_response_alg set to `none` in registration, error recieved and test skipped."];
    }

  }];
  [self waitForExpectationsWithTimeout:30 handler:nil];
}


/*! @brief Creates a log file to record the certification logs.
    @param testName The test ID used to configure the test server.
 */
- (void)startCertificationTest:(NSString *)testName {
  if (_logFile) {
    [self endCertificationTest];
  }
  
  NSString* filename = [NSString stringWithFormat:@"%@.txt", testName];
  
  NSString *documentsDirectory =
      NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES)[0];
  NSString *codeDir = [documentsDirectory stringByAppendingPathComponent:@"code"];
  [[NSFileManager defaultManager] createDirectoryAtPath:codeDir
                            withIntermediateDirectories:NO
                                             attributes:nil
                                                  error:nil];
  NSString *pathForLog = [codeDir stringByAppendingPathComponent:filename];
  
  NSLog(@"Writing logs for test %@ to %@", testName, pathForLog);
  _logFile = fopen([pathForLog cStringUsingEncoding:NSASCIIStringEncoding], "w");
  NSAssert(_logFile, @"Unable to create log file");
  
  NSDateFormatter *dateFormatter = [[NSDateFormatter alloc] init];
  dateFormatter.dateFormat = @"yyyy-MM-dd HH:mm:ss";
  NSString *dateString = [dateFormatter stringFromDate:[NSDate date]];
  [self certificationLog:@"# Starting test `%@` at %@ for AppAuth for iOS and macOS",
                         testName,
                         dateString];
}

/*! @brief Logs string to the certification log.
 */
- (void)certificationLog:(NSString *)format, ... NS_FORMAT_FUNCTION(1,2) {
  NSAssert(_logFile, @"No active log");

  // Gets log message as a string.
  va_list argp;
  va_start(argp, format);
  NSString *log = [[NSString alloc] initWithFormat:format arguments:argp];
  va_end(argp);
  
  // Logs to file.
  fprintf(_logFile, "%s\n", [log UTF8String]);
}

/*! @brief Closes the certification log file.
 */
- (void)endCertificationTest {
  // Adds a newline.
  [self certificationLog:@""];
  fclose(_logFile);
  _logFile = NULL;
}

@end

