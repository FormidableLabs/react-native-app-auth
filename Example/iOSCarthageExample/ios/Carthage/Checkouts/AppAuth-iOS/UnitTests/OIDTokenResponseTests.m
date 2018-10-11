/*! @file OIDTokenResponseTests.m
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
#import "OIDTokenResponseTests.h"

#import "OIDAuthorizationResponseTests.h"
#import "OIDTokenRequestTests.h"
#import "Source/OIDTokenRequest.h"
#import "Source/OIDTokenResponse.h"

// Ignore warnings about "Use of GNU statement expression extension" which is raised by our use of
// the XCTAssert___ macros.
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wgnu"

/*! @brief The key for the @c accessToken property in the incoming parameters and for
        @c NSSecureCoding.
 */
static NSString *const kAccessTokenKey = @"access_token";

/*! @brief The test value for the @c accessToken property.
 */
static NSString *const kAccessTokenTestValue = @"2YotnFZFEjr1zCsicMWpAA";

/*! @brief The key for the @c accessTokenExpirationDate property in the incoming parameters and for
        @c NSSecureCoding.
 */
static NSString *const kExpiresInKey = @"expires_in";

/*! @brief The test value for the @c accessTokenExpirationDate property.
 */
static long long const kExpiresInTestValue = 60;

/*! @brief The key for the @c tokenType property in the incoming parameters and for
        @c NSSecureCoding.
 */
static NSString *const kTokenTypeKey = @"token_type";

/*! @brief The test value for the @c tokenType property.
 */
static NSString *const kTokenTypeTestValue = @"example";

/*! @brief The key for the @c idToken property in the incoming parameters and for @c NSSecureCoding.
 */
static NSString *const kIDTokenKey = @"id_token";

/*! @brief The test value for the @c idToken property.
 */
static NSString *const kIDTokenTestValue = @"id_token";

/*! @brief The key for the @c refreshToken property in the incoming parameters and for
        @c NSSecureCoding.
 */
static NSString *const kRefreshTokenKey = @"refresh_token";

/*! @brief The test value for the @c refreshToken property.
 */
static NSString *const kRefreshTokenTestValue = @"tGzv3JOkF0XG5Qx2TlKWIA";

/*! @brief The key for the @c scopes property in the incoming parameters and for
        @c NSSecureCoding.
 */
static NSString *const kScopesKey = @"scope";

/*! @brief The test value for the @c scopes property.
 */
static NSString *const kScopesTestValue = @"openid profile";

/*! @brief Test key for the @c additionalParameters property.
 */
static NSString *const kTestAdditionalParameterKey = @"example_parameter";

/*! @brief Test value for the @c additionalParameters property.
 */
static NSString *const kTestAdditionalParameterValue = @"example_value";

@implementation OIDTokenResponseTests

+ (OIDTokenResponse *)testInstance {
  OIDTokenRequest *request = [OIDTokenRequestTests testInstance];
  OIDTokenResponse *response =
      [[OIDTokenResponse alloc] initWithRequest:request
                                     parameters:@{
        kAccessTokenKey : kAccessTokenTestValue,
        kExpiresInKey : @(kExpiresInTestValue),
        kTokenTypeKey : kTokenTypeTestValue,
        kIDTokenKey : kIDTokenTestValue,
        kRefreshTokenKey : kRefreshTokenTestValue,
        kScopesKey : kScopesTestValue,
        kTestAdditionalParameterKey : kTestAdditionalParameterValue
      }];
  return response;
}

+ (OIDTokenResponse *)testInstanceCodeExchange {
  OIDTokenRequest *request = [OIDTokenRequestTests testInstance];
  OIDTokenResponse *response =
      [[OIDTokenResponse alloc] initWithRequest:request
                                     parameters:@{
        kAccessTokenKey : kAccessTokenTestValue,
        kExpiresInKey : @(kExpiresInTestValue),
        kIDTokenKey : kIDTokenTestValue,
        kTokenTypeKey : kTokenTypeTestValue,
        kRefreshTokenKey : kRefreshTokenTestValue,
      }];
  return response;
}

+ (OIDTokenResponse *)testInstanceRefresh {
  OIDTokenRequest *request = [OIDTokenRequestTests testInstance];
  OIDTokenResponse *response =
      [[OIDTokenResponse alloc] initWithRequest:request
                                     parameters:@{
        kAccessTokenKey : kAccessTokenTestValue,
        kIDTokenKey : kIDTokenTestValue,
        kExpiresInKey : @(kExpiresInTestValue),
        kTokenTypeKey : kTokenTypeTestValue,
      }];
  return response;
}

/*! @brief Tests the @c NSCopying implementation by round-tripping an instance through the copying
        process and checking to make sure the source and destination instances are equivalent.
 */
- (void)testCopying {
  OIDTokenResponse *response = [[self class] testInstance];
  XCTAssertNotNil(response.request, @"");
  XCTAssertEqualObjects(response.accessToken, kAccessTokenTestValue, @"");
  XCTAssertEqualObjects(response.tokenType, kTokenTypeTestValue, @"");
  XCTAssertEqualObjects(response.idToken, kIDTokenTestValue, @"");
  XCTAssertEqualObjects(response.refreshToken, kRefreshTokenTestValue, @"");
  XCTAssertEqualObjects(response.scope, kScopesTestValue, @"");
  XCTAssertEqualObjects(response.additionalParameters[kTestAdditionalParameterKey],
                        kTestAdditionalParameterValue, @"");

  // Should be ~ kTestExpirationSeconds seconds. Avoiding swizzling NSDate here for certainty
  // to keep dependencies down, and simply making an assumption that this check will be executed
  // relatively quickly after the initialization above (less than 5 seconds.)
  NSTimeInterval expiration = [response.accessTokenExpirationDate timeIntervalSinceNow];
  XCTAssert(expiration > kExpiresInTestValue - 5 && expiration <= kExpiresInTestValue, @"");

  OIDTokenResponse *responseCopy = [response copy];

  XCTAssertNotNil(responseCopy.request, @"");
  XCTAssertEqualObjects(responseCopy.accessToken, kAccessTokenTestValue, @"");
  XCTAssertEqualObjects(responseCopy.tokenType, kTokenTypeTestValue, @"");
  XCTAssertEqualObjects(responseCopy.idToken, kIDTokenTestValue, @"");
  XCTAssertEqualObjects(responseCopy.refreshToken, kRefreshTokenTestValue, @"");
  XCTAssertEqualObjects(responseCopy.scope, kScopesTestValue, @"");
  XCTAssertEqualObjects(responseCopy.additionalParameters[kTestAdditionalParameterKey],
                        kTestAdditionalParameterValue, @"");
}

/*! @brief Tests the @c NSSecureCoding by round-tripping an instance through the coding process and
        checking to make sure the source and destination instances are equivalent.
 */
- (void)testSecureCoding {
  OIDTokenResponse *response = [[self class] testInstance];
  NSData *data = [NSKeyedArchiver archivedDataWithRootObject:response];
  OIDTokenResponse *responseCopy = [NSKeyedUnarchiver unarchiveObjectWithData:data];

  // Not a full test of the request deserialization, but should be sufficient as a smoke test
  // to make sure the request IS actually getting serialized and deserialized in the
  // NSSecureCoding implementation. We'll leave it up to the OIDAuthorizationRequest tests to make
  // sure the NSSecureCoding implementation of that class is correct.
  XCTAssertNotNil(responseCopy.request, @"");
  XCTAssertEqualObjects(responseCopy.request.clientID, response.request.clientID, @"");

  XCTAssertEqualObjects(responseCopy.accessToken, kAccessTokenTestValue, @"");
  XCTAssertEqualObjects(responseCopy.tokenType, kTokenTypeTestValue, @"");
  XCTAssertEqualObjects(responseCopy.idToken, kIDTokenTestValue, @"");
  XCTAssertEqualObjects(responseCopy.refreshToken, kRefreshTokenTestValue, @"");
  XCTAssertEqualObjects(responseCopy.scope, kScopesTestValue, @"");
  XCTAssertEqualObjects(responseCopy.additionalParameters[kTestAdditionalParameterKey],
                        kTestAdditionalParameterValue, @"");
}

@end

#pragma GCC diagnostic pop
