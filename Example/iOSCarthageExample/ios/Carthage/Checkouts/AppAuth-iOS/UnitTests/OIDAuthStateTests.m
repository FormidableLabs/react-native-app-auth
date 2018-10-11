/*! @file OIDAuthStateTests.m
    @brief AppAuth iOS SDK
    @copyright
        Copyright 2015 Google Inc. All Rights Reserved.
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

#import "OIDAuthStateTests.h"

#import "OIDAuthorizationResponseTests.h"
#import "OIDRegistrationResponseTests.h"
#import "OIDTokenResponseTests.h"
#import "Source/OIDAuthState.h"
#import "Source/OIDAuthorizationResponse.h"
#import "Source/OIDErrorUtilities.h"
#import "Source/OIDRegistrationResponse.h"
#import "Source/OIDTokenResponse.h"
#import "OIDTokenRequestTests.h"

// Ignore warnings about "Use of GNU statement expression extension" which is raised by our use of
// the XCTAssert___ macros.
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wgnu"

@interface OIDAuthState (Testing)
  // expose private method for simple testing
- (BOOL)isTokenFresh;
@end

@interface OIDAuthStateTests () <OIDAuthStateChangeDelegate, OIDAuthStateErrorDelegate>
@end

@implementation OIDAuthStateTests {
  /*! @brief An expectation for tests waiting on OIDAuthStateChangeDelegate.didChangeState:.
   */
  XCTestExpectation *_didChangeStateExpectation;

  /*! @brief An expectation for tests waiting on
          OIDAuthStateErrorDelegate.didEncounterAuthorizationError:.
   */
  XCTestExpectation *_didEncounterAuthorizationErrorExpectation;

  /*! @brief An expectation for tests waiting on
          OIDAuthStateErrorDelegate.didEncounterTransientError:.
   */
  XCTestExpectation *_didEncounterTransientErrorExpectation;
}

+ (OIDAuthState *)testInstance {
  OIDAuthorizationResponse *authorizationResponse =
      [OIDAuthorizationResponseTests testInstanceCodeFlow];
  OIDTokenResponse *tokenResponse = [OIDTokenResponseTests testInstanceCodeExchange];
  OIDAuthState *authstate =
      [[OIDAuthState alloc] initWithAuthorizationResponse:authorizationResponse
                                            tokenResponse:tokenResponse];
  return authstate;
}

/*! @brief NSError for an invalid_request on the authorization endpoint.
 */
+ (NSError *)OAuthAuthorizationError {
  NSError *oauthError =
      [OIDErrorUtilities OAuthErrorWithDomain:OIDOAuthAuthorizationErrorDomain
                                OAuthResponse:@{@"error": @"invalid_request"}
                              underlyingError:nil];
  return oauthError;
}

/*! @param underlyingError The underlying error, or nil.
    @brief NSError for an invalid_grant error on the token endpoint.
 */
+ (NSError *)OAuthTokenInvalidGrantErrorWithUnderlyingError:(NSError *)underlyingError {
  NSError *oauthError =
      [OIDErrorUtilities OAuthErrorWithDomain:OIDOAuthTokenErrorDomain
                                OAuthResponse:@{@"error": @"invalid_grant"}
                              underlyingError:underlyingError];
  return oauthError;
}

/*! @brief NSError for an invalid_client error on the token endpoint.
 */
+ (NSError *)OAuthTokenInvalidClientError {
  NSError *oauthError =
      [OIDErrorUtilities OAuthErrorWithDomain:OIDOAuthTokenErrorDomain
                                OAuthResponse:@{@"error": @"invalid_client"}
                              underlyingError:nil];
  return oauthError;
}

#pragma mark OIDAuthStateChangeDelegate methods

- (void)didChangeState:(OIDAuthState *)state {
  // in this test, this method should only be called when we expect it
  XCTAssertNotNil(_didChangeStateExpectation, @"");

  [_didChangeStateExpectation fulfill];
}

#pragma mark OIDAuthStateErrorDelegate methods

- (void)authState:(OIDAuthState *)state didEncounterAuthorizationError:(NSError *)error {
  // in this test, this method should only be called when we expect it
  XCTAssertNotNil(_didEncounterAuthorizationErrorExpectation, @"");

  [_didEncounterAuthorizationErrorExpectation fulfill];
}

- (void)tearDown {
  _didChangeStateExpectation = nil;
  _didEncounterAuthorizationErrorExpectation = nil;
  _didEncounterTransientErrorExpectation = nil;

  [super tearDown];
}

#pragma mark Tests

/*! @brief Tests that the isAuthorized state is correctly reflected when updated with an error.
 */
- (void)testErrorState {
  OIDAuthState *authstate = [[self class] testInstance];

  // starting state should be authorized
  XCTAssert([authstate isAuthorized], @"");
  XCTAssertFalse([authstate authorizationError], @"");

  NSError *oauthError = [[self class] OAuthTokenInvalidGrantErrorWithUnderlyingError:nil];

  [authstate updateWithAuthorizationError:oauthError];

  // after updating with an error, should no longer be authorized
  XCTAssertFalse([authstate isAuthorized], @"");
  XCTAssert([authstate authorizationError], @"");
}

/*! @brief Tests that the didChangeState delegate is called.
 */
- (void)testStateChangeDelegates {
  _didChangeStateExpectation = [self expectationWithDescription:
      @"OIDAuthStateChangeDelegate.didChangeState: should be called."];

  OIDAuthState *authstate = [[self class] testInstance];
  authstate.stateChangeDelegate = self;

  NSError *oauthError = [[self class] OAuthTokenInvalidGrantErrorWithUnderlyingError:nil];
  [authstate updateWithAuthorizationError:oauthError];

  [self waitForExpectationsWithTimeout:2 handler:nil];
}

/*! @brief Tests that the isAuthorized state is correctly reflected when updated with an error.
 */
- (void)testErrorDelegates {
  OIDAuthState *authstate = [[self class] testInstance];
  authstate.errorDelegate = self;

  // test invalid_grant error
  _didEncounterAuthorizationErrorExpectation = [self expectationWithDescription:
      @"OIDAuthStateErrorDelegate.authState:didEncounterAuthorizationErrorExpectation: delegate "
      "should be called for invalid_grant error."];
  NSError *oauthErrorInvalidGrant =
      [[self class] OAuthTokenInvalidGrantErrorWithUnderlyingError:nil];
  [authstate updateWithAuthorizationError:oauthErrorInvalidGrant];
  // waits for OIDAuthStateErrorDelegate.authState:didEncounterInvalidGrantError:
  [self waitForExpectationsWithTimeout:2 handler:nil];

  // test invalid_client error
  _didEncounterAuthorizationErrorExpectation = [self expectationWithDescription:
      @"OIDAuthStateErrorDelegate.authState:didEncounterAuthorizationErrorExpectation: delegate "
      "should be called for invalid_client error."];
  NSError *oauthErrorInvalidClient = [[self class] OAuthTokenInvalidClientError];
  [authstate updateWithAuthorizationError:oauthErrorInvalidClient];

  // waits for OIDAuthStateErrorDelegate.authState:didEncounterAuthorizationErrorExpectation:
  [self waitForExpectationsWithTimeout:2 handler:nil];
  _didEncounterAuthorizationErrorExpectation = nil;
}

/*! @brief Tests archiving OIDAuthState after sending it an NSError object that isn't NSCoding
        compliant.
 */
- (void)testNonCompliantNSCodingNSErrors {
  OIDAuthState *authstate = [[self class] testInstance];
  NSError *nonCompliantError = [NSError errorWithDomain:@"domain"
                                                   code:1
                                               userInfo:@{@"object": [[NSObject alloc] init]}];
  NSError *oauthError =
      [[self class] OAuthTokenInvalidGrantErrorWithUnderlyingError:nonCompliantError];
  [authstate updateWithAuthorizationError:oauthError];
  XCTAssertNoThrow([NSKeyedArchiver archivedDataWithRootObject:authstate], @"");
}

/*! @brief Tests @c OIDAuthState.updateWithAuthorizationResponse:error: with a success response.
 */
- (void)testUpdateWithAuthorizationResponseSuccess {
  OIDAuthState *authState = [[self class] testInstance];
  OIDAuthorizationResponse *authorizationResponse =
      [OIDAuthorizationResponseTests testInstanceCodeFlow];
  [authState updateWithAuthorizationResponse:authorizationResponse error:nil];
  XCTAssertEqual(authState.lastAuthorizationResponse, authorizationResponse, @"");
  XCTAssertNil(authState.authorizationError, @"");
}

/*! @brief Tests @c OIDAuthState.updateWithAuthorizationResponse:error: with an authorization
        error.
 */
- (void)testUpdateWithAuthorizationResponseOAuthError {
  OIDAuthState *authState = [[self class] testInstance];
  NSError *oauthError = [[self class] OAuthAuthorizationError];
  [authState updateWithAuthorizationResponse:nil error:oauthError];
  XCTAssertNotNil(authState.authorizationError, @"");
}

/*! @brief Tests @c OIDAuthState.updateWithAuthorizationResponse:error: with a transient
        (non-OAuth) error.
 */
- (void)testUpdateWithAuthorizationResponseTransientError {
  OIDAuthState *authState = [[self class] testInstance];
  NSError *transientError = [[NSError alloc] init];
  [authState updateWithAuthorizationResponse:nil error:transientError];
  XCTAssertNil(authState.authorizationError, @"");
}

/*! @brief Tests @c OIDAuthState.updateWithAuthorizationResponse:error: with both a success
        response and an authorization error.
 */
- (void)testUpdateWithAuthorizationResponseBothSuccessAndError {
  OIDAuthState *authState = [[self class] testInstance];
  OIDAuthorizationResponse *authorizationResponse =
      [OIDAuthorizationResponseTests testInstanceCodeFlow];
  NSError *oauthError = [[self class] OAuthAuthorizationError];
  [authState updateWithAuthorizationResponse:authorizationResponse error:oauthError];
  XCTAssertNotNil(authState.authorizationError, @"");
}

/*! @brief Tests @c OIDAuthState.updateWithRegistrationResponse: with a success response.
 */
- (void)testupdateWithRegistrationResponse {
  OIDAuthState *authState = [[self class] testInstance];
  OIDRegistrationResponse *registrationResponse = [OIDRegistrationResponseTests testInstance];
  [authState updateWithRegistrationResponse:registrationResponse];
  XCTAssertEqualObjects(authState.lastRegistrationResponse, registrationResponse);
  XCTAssertNil(authState.refreshToken);
  XCTAssertNil(authState.scope);
  XCTAssertNil(authState.lastAuthorizationResponse);
  XCTAssertNil(authState.authorizationError);
  XCTAssertFalse(authState.isAuthorized);
}

/*! @brief Tests @c OIDAuthState.updateWithTokenResponse:error: with a success response.
 */
- (void)testUpdateWithTokenResponseSuccess {
  OIDAuthState *authState = [[self class] testInstance];
  OIDTokenResponse *tokenResponse = [OIDTokenResponseTests testInstanceRefresh];
  [authState updateWithTokenResponse:tokenResponse error:nil];
  XCTAssertEqual(authState.lastTokenResponse, tokenResponse, @"");
  XCTAssertNotNil(authState.refreshToken, @"");
  XCTAssertTrue(authState.isAuthorized, @"");
  XCTAssertNil(authState.authorizationError, @"");
}

/*! @brief Tests @c OIDAuthState.updateWithTokenResponse:error: with an authorization error.
 */
- (void)testUpdateWithTokenResponseOAuthError {
  OIDAuthState *authState = [[self class] testInstance];
  NSError *oauthError = [[self class] OAuthTokenInvalidGrantErrorWithUnderlyingError:nil];
  [authState updateWithTokenResponse:nil error:oauthError];
  XCTAssertFalse(authState.isAuthorized, @"");
  XCTAssertNotNil(authState.authorizationError, @"");
}

/*! @brief Tests @c OIDAuthState.updateWithTokenResponse:error: with a transient (non-OAuth) error.
 */
- (void)testUpdateWithTokenResponseTransientError {
  OIDAuthState *authState = [[self class] testInstance];
  NSError *transientError = [[NSError alloc] init];
  [authState updateWithTokenResponse:nil error:transientError];
  XCTAssertNotNil(authState.lastTokenResponse, @"");
  XCTAssertNotNil(authState.refreshToken, @"");
  XCTAssertTrue(authState.isAuthorized, @"");
  XCTAssertNil(authState.authorizationError, @"");
}

/*! @brief Tests @c OIDAuthState.updateWithTokenResponse:error: with both a success response
        and an authorization error.
 */
- (void)testUpdateWithTokenResponseBothSuccessAndError {
  OIDAuthState *authState = [[self class] testInstance];
  OIDTokenResponse *tokenResponse = [OIDTokenResponseTests testInstanceRefresh];
  NSError *oauthError = [[self class] OAuthTokenInvalidGrantErrorWithUnderlyingError:nil];
  [authState updateWithTokenResponse:tokenResponse error:oauthError];
  XCTAssertFalse(authState.isAuthorized, @"");
  XCTAssertNotNil(authState.authorizationError, @"");
}

/*! @brief Full lifecycle test of the code flow from code exchange, refresh, error and re-auth.
 */
- (void)testCodeFlowLifecycle {
  OIDAuthorizationResponse *authorizationResponse =
      [OIDAuthorizationResponseTests testInstanceCodeFlow];

  // initializes from code flow authorization response
  OIDAuthState *authState =
      [[OIDAuthState alloc] initWithAuthorizationResponse:authorizationResponse];
  XCTAssertEqual(authState.lastAuthorizationResponse, authorizationResponse, @"");
  XCTAssertFalse(authState.isAuthorized,
                 @"Shouldn't be authorized as the code needs to be exchanged");

  // updates with result from token exchange
  OIDTokenResponse *tokenResponseCodeExchange = [OIDTokenResponseTests testInstanceCodeExchange];
  [authState updateWithTokenResponse:tokenResponseCodeExchange error:nil];
  XCTAssertEqual(authState.lastTokenResponse, tokenResponseCodeExchange, @"");
  XCTAssertTrue(authState.isAuthorized, @"");

  // updates with code refresh
  OIDTokenResponse *tokenResponseRefresh = [OIDTokenResponseTests testInstanceRefresh];
  [authState updateWithTokenResponse:tokenResponseRefresh error:nil];
  XCTAssertEqual(authState.lastTokenResponse, tokenResponseRefresh, @"");
  XCTAssertTrue(authState.isAuthorized, @"");

  // simulates token error (invalid_grant, token revoked)
  NSError *oauthError = [[self class] OAuthTokenInvalidGrantErrorWithUnderlyingError:nil];
  [authState updateWithTokenResponse:nil error:oauthError];
  XCTAssertFalse(authState.isAuthorized, @"");
  XCTAssertNotNil(authState.authorizationError, @"");

  // simulates successful re-auth response
  [authState updateWithAuthorizationResponse:authorizationResponse error:nil];
  XCTAssertEqual(authState.lastAuthorizationResponse, authorizationResponse, @"");
  XCTAssertNil(authState.authorizationError, @"Error should be nil now.");
  XCTAssertFalse(authState.isAuthorized,
                 @"Since this is the code flow, AuthState should still not be isAuthorized.");

  // updates with result from token exchange
  [authState updateWithTokenResponse:tokenResponseCodeExchange error:nil];
  XCTAssertEqual(authState.lastTokenResponse, tokenResponseCodeExchange, @"");
  XCTAssertTrue(authState.isAuthorized, @"Should be in an authorized state now");
}

- (void)testSecureCoding {
  XCTAssert([OIDAuthState supportsSecureCoding], @"");

  OIDAuthState *authState = [[self class] testInstance];
  NSData *data = [NSKeyedArchiver archivedDataWithRootObject:authState];
  OIDAuthState *authStateCopy = [NSKeyedUnarchiver unarchiveObjectWithData:data];

  XCTAssertEqualObjects(authStateCopy.refreshToken, authState.refreshToken, @"");
  XCTAssertEqualObjects(authStateCopy.scope, authState.scope, @"");
  XCTAssertEqualObjects(authStateCopy.lastAuthorizationResponse.authorizationCode,
                        authState.lastAuthorizationResponse.authorizationCode, @"");
  XCTAssertEqualObjects(authStateCopy.lastTokenResponse.refreshToken,
                        authState.lastTokenResponse.refreshToken, @"");
  XCTAssertEqualObjects(authStateCopy.authorizationError.domain,
                        authState.authorizationError.domain, @"");
  XCTAssertEqual(authStateCopy.authorizationError.code, authState.authorizationError.code, @"");
  XCTAssertEqual(authStateCopy.isAuthorized, authState.isAuthorized, @"");

  // Verify the error object is indeed restored.
  NSError *oauthError = [[self class] OAuthTokenInvalidGrantErrorWithUnderlyingError:nil];
  [authState updateWithTokenResponse:nil error:oauthError];
  data = [NSKeyedArchiver archivedDataWithRootObject:authState];
  XCTAssertNotNil(authState.authorizationError, @"");
  authStateCopy = [NSKeyedUnarchiver unarchiveObjectWithData:data];
  XCTAssertEqualObjects(authStateCopy.authorizationError.domain,
                        authState.authorizationError.domain, @"");
  XCTAssertEqual(authStateCopy.authorizationError.code, authState.authorizationError.code, @"");
}

- (void)testIsTokenFreshWithFreshToken {
  OIDAuthorizationResponse *authorizationResponse =
      [OIDAuthorizationResponseTests testInstanceCodeFlow];
  OIDTokenRequest *tokenRequest = [OIDTokenRequestTests testInstance];
  OIDTokenResponse *tokenResponse =
      [[OIDTokenResponse alloc] initWithRequest:tokenRequest
                                     parameters:@{@"access_token": @"abc123",
                                                  @"expires_in": @(3600)
                                                 }];

  OIDAuthState *authState =
      [[OIDAuthState alloc] initWithAuthorizationResponse:authorizationResponse
                                            tokenResponse:tokenResponse];
  XCTAssertEqual([authState isTokenFresh], YES, @"");
}

- (void)testIsTokenFreshWithExpiredToken {
  OIDAuthorizationResponse *authorizationResponse =
          [OIDAuthorizationResponseTests testInstanceCodeFlow];
  OIDTokenRequest *tokenRequest = [OIDTokenRequestTests testInstance];
  OIDTokenResponse *tokenResponse =
          [[OIDTokenResponse alloc] initWithRequest:tokenRequest
                                         parameters:@{@"access_token": @"abc123",
                                                      @"expires_in": @(0)
                                                     }];

  OIDAuthState *authState =
      [[OIDAuthState alloc] initWithAuthorizationResponse:authorizationResponse
                                            tokenResponse:tokenResponse];
  XCTAssertEqual([authState isTokenFresh], NO, @"");
}

- (void)testIsTokenFreshRespectsTokenRefreshOverride {
  OIDAuthState *authState = [[self class] testInstance];
  [authState setNeedsTokenRefresh];
  XCTAssertEqual([authState isTokenFresh], NO, @"");
}

- (void)testIsTokenFreshHandlesTokenWithoutExpirationTime {
  OIDAuthorizationResponse *authorizationResponse =
      [OIDAuthorizationResponseTests testInstanceCodeFlow];
  OIDTokenRequest *tokenRequest = [OIDTokenRequestTests testInstance];
  OIDTokenResponse *tokenResponse =
      [[OIDTokenResponse alloc] initWithRequest:tokenRequest
                                     parameters:@{ @"access_token": @"abc123" }];

  OIDAuthState *authState =
      [[OIDAuthState alloc] initWithAuthorizationResponse:authorizationResponse
                                            tokenResponse:tokenResponse];
  XCTAssertEqual([authState isTokenFresh], YES, @"");
}

@end

#pragma GCC diagnostic pop
