/*! @file OIDRegistrationResponseTests.m
    @brief AppAuth iOS SDK
    @copyright
        Copyright 2016 The AppAuth for iOS Authors. All Rights Reserved.
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

#import "OIDRegistrationResponseTests.h"

#import "OIDClientMetadataParameters.h"
#import "OIDRegistrationRequestTests.h"
#import "Source/OIDRegistrationRequest.h"
#import "Source/OIDRegistrationResponse.h"

/*! @brief The test value for the @c clientID property.
 */
static NSString *const kClientIDTestValue = @"client1";

/*! @brief The test value for the @c clientSecretExpiresAt property.
 */
static long long const kClientSecretExpiresAtTestValue = 1463414761;

/*! @brief The test value for the @c clientSecret property.
 */
static NSString *const kClientSecretTestValue = @"secret1";

/*! @brief The test value for the @c clientIDIssuedAt property.
 */
static long long const kClientIDIssuedAtTestValue = 1463411161;

/*! @brief The test value for the @c clientRegistrationAccessToken property.
 */
static NSString *const kClientRegistrationAccessTokenTestValue = @"abcdefgh";

/*! @brief The test value for the @c registrationClientURI property.
 */
static NSString *const kRegistrationClientURITestValue = @"https://provider.example.com/client1";

/*! @brief The test value for the @c tokenEndpointAuthenticationMethod property.
 */
static NSString *const kTokenEndpointAuthMethodTestValue = @"client_secret_basic";

/*! @brief Test key for the @c additionalParameters property.
 */
static NSString *const kTestAdditionalParameterKey = @"example_parameter";

/*! @brief Test value for the @c additionalParameters property.
 */
static NSString *const kTestAdditionalParameterValue = @"example_value";

@implementation OIDRegistrationResponseTests
+ (OIDRegistrationResponse *)testInstance {
  OIDRegistrationRequest *request = [OIDRegistrationRequestTests testInstance];
  OIDRegistrationResponse *response = [[OIDRegistrationResponse alloc] initWithRequest:request
      parameters:@{
          OIDClientIDParam : kClientIDTestValue,
          OIDClientIDIssuedAtParam : @(kClientIDIssuedAtTestValue),
          OIDClientSecretParam : kClientSecretTestValue,
          OIDClientSecretExpirestAtParam : @(kClientSecretExpiresAtTestValue),
          OIDRegistrationAccessTokenParam : kClientRegistrationAccessTokenTestValue,
          OIDRegistrationClientURIParam : [NSURL URLWithString:kRegistrationClientURITestValue],
          OIDTokenEndpointAuthenticationMethodParam : kTokenEndpointAuthMethodTestValue,
          kTestAdditionalParameterKey : kTestAdditionalParameterValue
      }];
  return response;
}

/*! @brief Tests the @c NSCopying implementation by round-tripping an instance through the copying
        process and checking to make sure the source and destination instances are equivalent.
 */
- (void)testCopying {
  OIDRegistrationResponse *response = [[self class] testInstance];
  XCTAssertNotNil(response.request, @"");
  XCTAssertEqualObjects(response.clientID, kClientIDTestValue, @"");
  XCTAssertEqualObjects(response.clientIDIssuedAt,
                        [NSDate dateWithTimeIntervalSince1970:kClientIDIssuedAtTestValue], @"");
  XCTAssertEqualObjects(response.clientSecret, kClientSecretTestValue, @"");
  XCTAssertEqualObjects(response.clientSecretExpiresAt,
                        [NSDate dateWithTimeIntervalSince1970:kClientSecretExpiresAtTestValue], @"");
  XCTAssertEqualObjects(response.registrationAccessToken, kClientRegistrationAccessTokenTestValue, @"");
  XCTAssertEqualObjects(response.registrationClientURI,
                        [NSURL URLWithString:kRegistrationClientURITestValue], @"");
  XCTAssertEqualObjects(response.tokenEndpointAuthenticationMethod,
                        kTokenEndpointAuthMethodTestValue, @"");
  XCTAssertEqualObjects(response.additionalParameters[kTestAdditionalParameterKey],
                        kTestAdditionalParameterValue, @"");

  OIDRegistrationResponse *responseCopy = [response copy];

  XCTAssertNotNil(responseCopy.request, @"");
  XCTAssertEqualObjects(responseCopy.clientID, response.clientID, @"");
  XCTAssertEqualObjects(responseCopy.clientIDIssuedAt, response.clientIDIssuedAt, @"");
  XCTAssertEqualObjects(responseCopy.clientSecret, response.clientSecret, @"");
  XCTAssertEqualObjects(responseCopy.clientSecretExpiresAt, response.clientSecretExpiresAt, @"");
  XCTAssertEqualObjects(responseCopy.registrationAccessToken, response.registrationAccessToken, @"");
  XCTAssertEqualObjects(responseCopy.registrationClientURI, response.registrationClientURI, @"");
  XCTAssertEqualObjects(responseCopy.additionalParameters[kTestAdditionalParameterKey],
                        kTestAdditionalParameterValue, @"");
}

/*! @brief Tests the @c NSSecureCoding by round-tripping an instance through the coding process and
        checking to make sure the source and destination instances are equivalent.
 */
- (void)testSecureCoding {
  OIDRegistrationResponse *response = [[self class] testInstance];
  NSData *data = [NSKeyedArchiver archivedDataWithRootObject:response];
  OIDRegistrationResponse *responseCopy = [NSKeyedUnarchiver unarchiveObjectWithData:data];

  // Not a full test of the request deserialization, but should be sufficient as a smoke test
  // to make sure the request IS actually getting serialized and deserialized in the
  // NSSecureCoding implementation. We'll leave it up to the OIDAuthorizationRequest tests to make
  // sure the NSSecureCoding implementation of that class is correct.
  XCTAssertNotNil(responseCopy.request, @"");
  XCTAssertEqualObjects(responseCopy.request.applicationType, response.request.applicationType, @"");

  XCTAssertEqualObjects(responseCopy.clientID, response.clientID, @"");
  XCTAssertEqualObjects(responseCopy.clientIDIssuedAt, response.clientIDIssuedAt, @"");
  XCTAssertEqualObjects(responseCopy.clientSecret, response.clientSecret, @"");
  XCTAssertEqualObjects(responseCopy.clientSecretExpiresAt, response.clientSecretExpiresAt, @"");
  XCTAssertEqualObjects(responseCopy.registrationAccessToken, response.registrationAccessToken, @"");
  XCTAssertEqualObjects(responseCopy.registrationClientURI, response.registrationClientURI, @"");
  XCTAssertEqualObjects(responseCopy.tokenEndpointAuthenticationMethod,
                        response.tokenEndpointAuthenticationMethod, @"");
  XCTAssertEqualObjects(responseCopy.additionalParameters[kTestAdditionalParameterKey],
                        kTestAdditionalParameterValue, @"");
}

/*! @brief Make sure the registration response is verified to ensure the 'client_secret_expires_at'
        parameter exists if a 'client_secret' is issued.
    @see https://openid.net/specs/openid-connect-registration-1_0.html#RegistrationResponse
 */
- (void)testMissingClientSecretExpiresAtWithClientSecret {
  OIDRegistrationRequest *request = [OIDRegistrationRequestTests testInstance];
  OIDRegistrationResponse *response = [[OIDRegistrationResponse alloc] initWithRequest:request
      parameters:@{
          OIDClientIDParam : kClientIDTestValue,
          OIDClientSecretParam : kClientSecretTestValue,
      }];
  XCTAssertNil(response, @"");
}

/*! @brief Make sure the registration response missing 'registration_access_token' is detected when
        'client_registration_uri' is specified..
    @see https://openid.net/specs/openid-connect-registration-1_0.html#RegistrationResponse
 */
- (void)testMissingRegistrationAccessTokenWithRegistrationClientURI {
  OIDRegistrationRequest *request = [OIDRegistrationRequestTests testInstance];
  OIDRegistrationResponse *response = [[OIDRegistrationResponse alloc] initWithRequest:request
      parameters:@{
          OIDClientIDParam : kClientIDTestValue,
          OIDRegistrationClientURIParam : [NSURL URLWithString:kRegistrationClientURITestValue]
      }];
  XCTAssertNil(response, @"");
}

/*! @brief Make sure the registration response missing 'client_registration_uri' is detected when
        'registration_access_token' is specified..
    @see https://openid.net/specs/openid-connect-registration-1_0.html#RegistrationResponse
 */
- (void)testMissingRegistrationClientURIWithRegistrationAccessToken {
  OIDRegistrationRequest *request = [OIDRegistrationRequestTests testInstance];
  OIDRegistrationResponse *response = [[OIDRegistrationResponse alloc] initWithRequest:request
      parameters:@{
          OIDClientIDParam : kClientIDTestValue,
          OIDRegistrationAccessTokenParam : kClientRegistrationAccessTokenTestValue
      }];
  XCTAssertNil(response, @"");
}

@end
