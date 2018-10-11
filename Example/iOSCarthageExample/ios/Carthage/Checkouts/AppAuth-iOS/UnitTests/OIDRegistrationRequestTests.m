/*! @file OIDRegistrationRequestTests.m
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

#import "OIDRegistrationRequestTests.h"

#import "OIDServiceConfigurationTests.h"
#import "Source/OIDClientMetadataParameters.h"
#import "Source/OIDRegistrationRequest.h"
#import "Source/OIDServiceConfiguration.h"

/*! @brief Test key for the @c additionalParameters property.
 */
static NSString *const kTestAdditionalParameterKey = @"A";

/*! @brief Test value for the @c additionalParameters property.
 */
static NSString *const kTestAdditionalParameterValue = @"1";

/*! @brief Test value for the @c initialAccessToken property.
 */
static NSString *const kInitialAccessTokenTestValue = @"test";

/*! @brief Test value for the @c redirectURL property.
 */
static NSString *kRedirectURLTestValue = @"https://client.example.com/redirect";

/*! @brief Test value for the @c responseTypes property.
 */
static NSString *kResponseTypeTestValue = @"code";

/*! @brief Test value for the @c grantTypes property.
 */
static NSString *kGrantTypeTestValue = @"authorization_code";

/*! @brief Test value for the @c subjectType property.
 */
static NSString *kSubjectTypeTestValue = @"public";

/*! @brief Test value for the @c tokenEndpointAuthenticationMethod property.
 */
static NSString *kTokenEndpointAuthMethodTestValue = @"client_secret_basic";

@implementation OIDRegistrationRequestTests

+ (OIDRegistrationRequest *)testInstance {
  NSDictionary *additionalParameters = @{
                                         kTestAdditionalParameterKey : kTestAdditionalParameterValue
                                         };

  OIDServiceConfiguration *config = [OIDServiceConfigurationTests testInstance];
  OIDRegistrationRequest *request =
      [[OIDRegistrationRequest alloc] initWithConfiguration:config
                               redirectURIs:@[ [NSURL URLWithString:kRedirectURLTestValue] ]
                              responseTypes:@[ kResponseTypeTestValue ]
                                 grantTypes:@[ kGrantTypeTestValue ]
                                subjectType:kSubjectTypeTestValue
                    tokenEndpointAuthMethod:kTokenEndpointAuthMethodTestValue
                         initialAccessToken:kInitialAccessTokenTestValue
                       additionalParameters:additionalParameters];

  return request;
}

- (void)testApplicationIsNativeByDefault {
  OIDRegistrationRequest *request = [[self class] testInstance];
  XCTAssertEqualObjects(request.applicationType, OIDApplicationTypeNative);
}

/*! @brief Tests the @c NSCopying implementation by round-tripping an instance through the copying
        process and checking to make sure the source and destination instances are equivalent.
 */
- (void)testCopying {
  OIDRegistrationRequest *request = [[self class] testInstance];

  XCTAssertNotNil(request.configuration);
  XCTAssertEqualObjects(request.applicationType, OIDApplicationTypeNative);
  XCTAssertEqualObjects(request.initialAccessToken, kInitialAccessTokenTestValue);
  XCTAssertEqualObjects(request.redirectURIs, @[ [NSURL URLWithString:kRedirectURLTestValue] ]);
  XCTAssertEqualObjects(request.responseTypes, @[ kResponseTypeTestValue ]);
  XCTAssertEqualObjects(request.grantTypes, @[ kGrantTypeTestValue ]);
  XCTAssertEqualObjects(request.subjectType, kSubjectTypeTestValue);
  XCTAssertEqualObjects(request.tokenEndpointAuthenticationMethod,
                        kTokenEndpointAuthMethodTestValue);
  XCTAssertNotNil(request.additionalParameters);
  XCTAssertEqualObjects(request.additionalParameters[kTestAdditionalParameterKey],
                        kTestAdditionalParameterValue);

  OIDRegistrationRequest *requestCopy = [request copy];

  // Not a full test of the configuration deserialization, but should be sufficient as a smoke test
  // to make sure the configuration IS actually getting carried along in the copy implementation.
  XCTAssertEqualObjects(requestCopy.configuration, request.configuration);

  XCTAssertEqualObjects(requestCopy.applicationType, request.applicationType);
  XCTAssertEqualObjects(requestCopy.initialAccessToken, kInitialAccessTokenTestValue);
  XCTAssertEqualObjects(requestCopy.redirectURIs, request.redirectURIs);
  XCTAssertEqualObjects(requestCopy.responseTypes, request.responseTypes);
  XCTAssertEqualObjects(requestCopy.grantTypes, request.grantTypes);
  XCTAssertEqualObjects(requestCopy.subjectType, request.subjectType);
  XCTAssertEqualObjects(requestCopy.tokenEndpointAuthenticationMethod,
                        request.tokenEndpointAuthenticationMethod);
  XCTAssertNotNil(requestCopy.additionalParameters);
  XCTAssertEqualObjects(requestCopy.additionalParameters[kTestAdditionalParameterKey],
                        kTestAdditionalParameterValue);
}

/*! @brief Tests the @c NSSecureCoding by round-tripping an instance through the coding process and
        checking to make sure the source and destination instances are equivalent.
 */
- (void)testSecureCoding {
  OIDRegistrationRequest *request = [[self class] testInstance];

  XCTAssertNotNil(request.configuration);
  XCTAssertEqualObjects(request.applicationType, OIDApplicationTypeNative);
  XCTAssertEqualObjects(request.initialAccessToken, kInitialAccessTokenTestValue);
  XCTAssertEqualObjects(request.redirectURIs, @[ [NSURL URLWithString:kRedirectURLTestValue] ]);
  XCTAssertEqualObjects(request.responseTypes, @[ kResponseTypeTestValue ]);
  XCTAssertEqualObjects(request.grantTypes, @[ kGrantTypeTestValue ]);
  XCTAssertEqualObjects(request.subjectType, kSubjectTypeTestValue);
  XCTAssertEqualObjects(request.tokenEndpointAuthenticationMethod,
                        kTokenEndpointAuthMethodTestValue);
  XCTAssertEqualObjects(request.additionalParameters[kTestAdditionalParameterKey],
                        kTestAdditionalParameterValue);

  NSData *data = [NSKeyedArchiver archivedDataWithRootObject:request];
  OIDRegistrationRequest *requestCopy = [NSKeyedUnarchiver unarchiveObjectWithData:data];

  // Not a full test of the configuration deserialization, but should be sufficient as a smoke test
  // to make sure the configuration IS actually getting serialized and deserialized in the
  // NSSecureCoding implementation. We'll leave it up to the OIDServiceConfiguration tests to make
  // sure the NSSecureCoding implementation of that class is correct.
  XCTAssertNotNil(requestCopy.configuration);

  XCTAssertEqualObjects(requestCopy.applicationType, request.applicationType);
  XCTAssertEqualObjects(requestCopy.initialAccessToken, kInitialAccessTokenTestValue);
  XCTAssertEqualObjects(requestCopy.redirectURIs, request.redirectURIs);
  XCTAssertEqualObjects(requestCopy.responseTypes, request.responseTypes);
  XCTAssertEqualObjects(requestCopy.grantTypes, request.grantTypes);
  XCTAssertEqualObjects(requestCopy.subjectType, request.subjectType);
  XCTAssertEqualObjects(requestCopy.tokenEndpointAuthenticationMethod,
                        request.tokenEndpointAuthenticationMethod);
  XCTAssertEqualObjects(requestCopy.additionalParameters[kTestAdditionalParameterKey],
                        kTestAdditionalParameterValue);
}

/*! @brief Tests the @c URLRequest method
 */
- (void)testURLRequest {
  OIDRegistrationRequest *request = [[self class] testInstance];
  NSURLRequest *httpRequest = [request URLRequest];
  NSError *error;
  NSDictionary *parsedJSON = [NSJSONSerialization JSONObjectWithData:httpRequest.HTTPBody
                                                             options:kNilOptions
                                                               error:&error];

  XCTAssertEqualObjects(httpRequest.HTTPMethod, @"POST");
  XCTAssertEqualObjects([httpRequest valueForHTTPHeaderField:@"Content-Type"],
                        @"application/json");
  XCTAssertEqualObjects([httpRequest valueForHTTPHeaderField:@"Authorization"],
                        @"Bearer test");
  XCTAssertEqualObjects(httpRequest.URL, request.configuration.registrationEndpoint);
  XCTAssertEqualObjects(parsedJSON[OIDApplicationTypeParam], request.applicationType);
  XCTAssertEqualObjects(parsedJSON[OIDRedirectURIsParam][0],
                        [request.redirectURIs[0] absoluteString]);
  XCTAssertEqualObjects(parsedJSON[OIDResponseTypesParam], request.responseTypes);
  XCTAssertEqualObjects(parsedJSON[OIDGrantTypesParam], request.grantTypes);
  XCTAssertEqualObjects(parsedJSON[OIDSubjectTypeParam], request.subjectType);
  XCTAssertEqualObjects(parsedJSON[OIDTokenEndpointAuthenticationMethodParam],
                        request.tokenEndpointAuthenticationMethod);
  XCTAssertEqualObjects(parsedJSON[kTestAdditionalParameterKey], kTestAdditionalParameterValue);
}

@end
