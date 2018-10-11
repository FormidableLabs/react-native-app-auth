/*! @file OIDServiceDiscoveryTests.m
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

#import "OIDServiceDiscoveryTests.h"

#import "Source/OIDError.h"
#import "Source/OIDServiceDiscovery.h"

// Ignore warnings about "Use of GNU statement expression extension" which is raised by our use of
// the XCTAssert___ macros.
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wgnu"

/*! Testing URL used when testing URL conversions. */
static NSString *const kTestURL = @"http://www.google.com/";

/*! A string for testing an invalid URL. */
static NSString *const kTestURLInvalid = @"abc";

/*! Field keys associated with an OpenID Connect Discovery Document. */
static NSString *const kIssuerKey = @"issuer";
static NSString *const kAuthorizationEndpointKey = @"authorization_endpoint";
static NSString *const kTokenEndpointKey = @"token_endpoint";
static NSString *const kUserinfoEndpointKey = @"userinfo_endpoint";
static NSString *const kJWKSURLKey = @"jwks_uri";
static NSString *const kRegistrationEndpointKey = @"registration_endpoint";
static NSString *const kScopesSupportedKey = @"scopes_supported";
static NSString *const kResponseTypesSupportedKey = @"response_types_supported";
static NSString *const kResponseModesSupportedKey = @"response_modes_supported";
static NSString *const kGrantTypesSupportedKey = @"grant_types_supported";
static NSString *const kACRValuesSupportedKey = @"acr_values_supported";
static NSString *const kSubjectTypesSupportedKey = @"subject_types_supported";
static NSString *const kIDTokenSigningAlgorithmValuesSupportedKey =
    @"id_token_signing_alg_values_supported";
static NSString *const kIDTokenEncryptionAlgorithmValuesSupportedKey =
    @"id_token_encryption_alg_values_supported";
static NSString *const kIDTokenEncryptionEncodingValuesSupportedKey =
    @"id_token_encryption_enc_values_supported";
static NSString *const kUserinfoSigningAlgorithmValuesSupportedKey =
    @"userinfo_signing_alg_values_supported";
static NSString *const kUserinfoEncryptionAlgorithmValuesSupportedKey =
    @"userinfo_encryption_alg_values_supported";
static NSString *const kUserinfoEncryptionEncodingValuesSupportedKey =
    @"userinfo_encryption_enc_values_supported";
static NSString *const kRequestObjectSigningAlgorithmValuesSupportedKey =
    @"request_object_signing_alg_values_supported";
static NSString *const kRequestObjectEncryptionAlgorithmValuesSupportedKey =
    @"request_object_encryption_alg_values_supported";
static NSString *const kRequestObjectEncryptionEncodingValuesSupported =
    @"request_object_encryption_enc_values_supported";
static NSString *const kTokenEndpointAuthMethodsSupportedKey =
    @"token_endpoint_auth_methods_supported";
static NSString *const kTokenEndpointAuthSigningAlgorithmValuesSupportedKey =
    @"token_endpoint_auth_signing_alg_values_supported";
static NSString *const kDisplayValuesSupportedKey = @"display_values_supported";
static NSString *const kClaimTypesSupportedKey = @"claim_types_supported";
static NSString *const kClaimsSupportedKey = @"claims_supported";
static NSString *const kServiceDocumentationKey = @"service_documentation";
static NSString *const kClaimsLocalesSupportedKey = @"claims_locales_supported";
static NSString *const kUILocalesSupportedKey = @"ui_locales_supported";
static NSString *const kClaimsParameterSupportedKey = @"claims_parameter_supported";
static NSString *const kRequestParameterSupportedKey = @"request_parameter_supported";
static NSString *const kRequestURIParameterSupportedKey = @"request_uri_parameter_supported";
static NSString *const kRequireRequestURIRegistrationKey = @"require_request_uri_registration";
static NSString *const kOPPolicyURIKey = @"op_policy_uri";
static NSString *const kOPTosURIKey = @"op_tos_uri";

@implementation OIDServiceDiscoveryTests

+ (NSDictionary *)minimumServiceDiscoveryDictionary {
  return @{
    kIssuerKey : @"http://www.example.com/issuer",
    kAuthorizationEndpointKey : @"http://www.example.com/authorization",
    kTokenEndpointKey : @"http://www.example.com/token",
    kJWKSURLKey : @"http://www.example.com/jwks",
    kResponseTypesSupportedKey : @"Response Types Supported",
    kSubjectTypesSupportedKey : @"Subject Types Supported",
    kIDTokenSigningAlgorithmValuesSupportedKey : @"ID Token Signing Algorithm Values Supported",
  };
}

+ (NSDictionary *)completeServiceDiscoveryDictionary {
  return @{
    kIssuerKey : @"http://www.example.com/issuer",
    kAuthorizationEndpointKey : @"http://www.example.com/authorization",
    kTokenEndpointKey : @"http://www.example.com/token",
    kUserinfoEndpointKey : @"User Info Endpoint",
    kJWKSURLKey : @"http://www.example.com/jwks",
    kRegistrationEndpointKey : @"Registration Endpoint",
    kScopesSupportedKey : @"Scopes Supported",
    kResponseTypesSupportedKey : @"Response Types Supported",
    kResponseModesSupportedKey : @"Response Modes Supported",
    kGrantTypesSupportedKey : @"Grant Types Supported",
    kACRValuesSupportedKey : @"ACR Values Supported",
    kSubjectTypesSupportedKey : @"Subject Types Supported",
    kIDTokenSigningAlgorithmValuesSupportedKey : @"Token Signing Algorithm Values Supported",
    kIDTokenEncryptionAlgorithmValuesSupportedKey : @"Token Encryption Algorithm Values Supported",
    kIDTokenEncryptionEncodingValuesSupportedKey : @"token Encryption Encoding Values Supported",
    kUserinfoSigningAlgorithmValuesSupportedKey : @"User Info Signing Algorithm Values Supported",
    kUserinfoEncryptionAlgorithmValuesSupportedKey :
        @"User Info Encryption Algorithm Values Supported",
    kUserinfoEncryptionEncodingValuesSupportedKey :
        @"User Info Encryption Encoding Values Supported",
    kRequestObjectSigningAlgorithmValuesSupportedKey :
        @"Request Object Signing Algorithm Values Supported",
    kRequestObjectEncryptionAlgorithmValuesSupportedKey :
        @"Reqest Object Encryption Algorithm Values Supported",
    kRequestObjectEncryptionEncodingValuesSupported :
        @"Request Object Encryption Encoding Values Supported",
    kTokenEndpointAuthMethodsSupportedKey : @"Token Endpoint Auth Methods Supported",
    kTokenEndpointAuthSigningAlgorithmValuesSupportedKey :
        @"Token Endpoint Auth Signing Algorithm Values Supported",
    kDisplayValuesSupportedKey : @"Display Values Supported",
    kClaimTypesSupportedKey : @"Claim Types Supported",
    kClaimsSupportedKey : @"Claims Supported",
    kServiceDocumentationKey : @"Service Documentation",
    kClaimsLocalesSupportedKey : @"Claims Locales Supported",
    kUILocalesSupportedKey : @"UI Locales Supported",
    kClaimsParameterSupportedKey : @YES,
    kRequestParameterSupportedKey : @YES,
    kRequestURIParameterSupportedKey : @NO,
    kRequireRequestURIRegistrationKey : @YES,
    kOPPolicyURIKey : @"OP Policy URI",
    kOPTosURIKey : @"OP TOS URI",
  };
}

+ (NSURL *)googleDiscoveryAuthorizationEndpoint {
  return [NSURL URLWithString:@"https://accounts.google.com/o/oauth2/v2/auth"];
}

// from https://accounts.google.com/.well-known/openid-configuration
static NSString *const kDiscoveryDocument =
    @"{\"issuer\":\"https://accounts.google.com\",\"authorization_endpoint\":\"https://account"
      "s.google.com/o/oauth2/v2/auth\",\"token_endpoint\":\"https://www.googleapis.com/oauth2/v4/to"
      "ken\",\"userinfo_endpoint\":\"https://www.googleapis.com/oauth2/v3/userinfo\",\"revocation_e"
      "ndpoint\":\"https://accounts.google.com/o/oauth2/revoke\",\"jwks_uri\":\"https://www.googlea"
      "pis.com/oauth2/v3/certs\",\"response_types_supported\":[\"code\",\"token\",\"id_token\",\"co"
      "de token\",\"code id_token\",\"token id_token\",\"code token id_token\",\"none\"],\"subject_"
      "types_supported\":[\"public\"],\"id_token_signing_alg_values_supported\":[\"RS256\"],\"scope"
      "s_supported\":[\"openid\",\"email\",\"profile\"],\"token_endpoint_auth_methods_supported\":["
      "\"client_secret_post\",\"client_secret_basic\"],\"claims_supported\":[\"aud\",\"email\",\"em"
      "ail_verified\",\"exp\",\"family_name\",\"given_name\",\"iat\",\"iss\",\"locale\",\"name\",\""
      "picture\",\"sub\"]}";

// from https://accounts.google.com/.well-known/openid-configuration with authorization_endpoint
// removed
static NSString *const kDiscoveryDocumentMissingField =
    @"{\"issuer\":\"https://accounts.google.com\",\"token_endpoint\":\"https://www.googleapis."
      "com/oauth2/v4/to"
      "ken\",\"userinfo_endpoint\":\"https://www.googleapis.com/oauth2/v3/userinfo\",\"revocation_e"
      "ndpoint\":\"https://accounts.google.com/o/oauth2/revoke\",\"jwks_uri\":\"https://www.googlea"
      "pis.com/oauth2/v3/certs\",\"response_types_supported\":[\"code\",\"token\",\"id_token\",\"co"
      "de token\",\"code id_token\",\"token id_token\",\"code token id_token\",\"none\"],\"subject_"
      "types_supported\":[\"public\"],\"id_token_signing_alg_values_supported\":[\"RS256\"],\"scope"
      "s_supported\":[\"openid\",\"email\",\"profile\"],\"token_endpoint_auth_methods_supported\":["
      "\"client_secret_post\",\"client_secret_basic\"],\"claims_supported\":[\"aud\",\"email\",\"em"
      "ail_verified\",\"exp\",\"family_name\",\"given_name\",\"iat\",\"iss\",\"locale\",\"name\",\""
      "picture\",\"sub\"]}";

  // from https://accounts.google.com/.well-known/openid-configuration with authorization_endpoint
  // and token_endpoint set to JSON 'null'
static NSString *const kDiscoveryDocumentNullField =
    @"{\"issuer\":\"https://accounts.google.com\",\"authorization_endpoint\":null,"
      "\"token_endpoint\":null"
      ",\"userinfo_endpoint\":\"https://www.googleapis.com/oauth2/v3/userinfo\",\"revocation_e"
      "ndpoint\":\"https://accounts.google.com/o/oauth2/revoke\",\"jwks_uri\":\"https://www.googlea"
      "pis.com/oauth2/v3/certs\",\"response_types_supported\":[\"code\",\"token\",\"id_token\",\"co"
      "de token\",\"code id_token\",\"token id_token\",\"code token id_token\",\"none\"],\"subject_"
      "types_supported\":[\"public\"],\"id_token_signing_alg_values_supported\":[\"RS256\"],\"scope"
      "s_supported\":[\"openid\",\"email\",\"profile\"],\"token_endpoint_auth_methods_supported\":["
      "\"client_secret_post\",\"client_secret_basic\"],\"claims_supported\":[\"aud\",\"email\",\"em"
      "ail_verified\",\"exp\",\"family_name\",\"given_name\",\"iat\",\"iss\",\"locale\",\"name\",\""
      "picture\",\"sub\"]}";

/*! @brief Tests that URLs are handled properly when converted from the dictionary's string
        representation.
 */
- (void)testURLs {
  NSError *error;
  NSMutableDictionary *serviceDiscoveryDictionary =
      [[[self class] minimumServiceDiscoveryDictionary] mutableCopy];
  serviceDiscoveryDictionary[kOPPolicyURIKey] = kTestURL;
  OIDServiceDiscovery *discovery =
      [[OIDServiceDiscovery alloc] initWithDictionary:serviceDiscoveryDictionary
                                                error:&error];
  XCTAssertNotNil(discovery, @"We supplied the minimum required fields when initializing the "
                             "service discovery instance, so we should have gotten a new "
                             "instance.");
  XCTAssertNil(error, @"We supplied the minimum required fields when initializing the "
                      "service discovery instance, so we should not have gotten an error.");

  NSURL *testPolicyURL = [NSURL URLWithString:kTestURL];

  XCTAssertEqualObjects(discovery.OPPolicyURI, testPolicyURL, @"");
}

/*! @brief Tests that we get an error when the document is not valid JSON.
 */
- (void)testErrorWhenBadFormat {
  NSError *error;
  OIDServiceDiscovery *discovery = [[OIDServiceDiscovery alloc] initWithJSON:@"JUNK" error:&error];
  XCTAssertNil(discovery, @"When initializing a discovery document, it should not return an "
                          "instance if it is not valid JSON.");
  XCTAssertNotNil(error, @"There should be an error indicating we received bad JSON.");
  XCTAssertEqualObjects(error.domain, OIDGeneralErrorDomain, @"");
  XCTAssertEqual(error.code, OIDErrorCodeJSONDeserializationError, @"");
}

/*! @brief Tests that we get an error when the required fields aren't in the source dictionary.
 */
- (void)testErrorWhenMissingFields {
  NSError *error;
  OIDServiceDiscovery *discovery =
      [[OIDServiceDiscovery alloc] initWithDictionary:@{ } error:&error];
  XCTAssertNil(discovery, @"When initializing a discovery document, it should not return an "
                          "instance if there are missing required fields.");
  XCTAssertNotNil(error, @"There should be an error indicating we are missing required fields.");
  XCTAssertEqualObjects(error.domain, OIDGeneralErrorDomain, @"");
  XCTAssertEqual(error.code, OIDErrorCodeInvalidDiscoveryDocument, @"");
}

/*! @brief Tests that we get an error when the required fields aren't in the source dictionary.
 */
- (void)testErrorWhenMissingFieldsJSON {
  NSError *error;
  OIDServiceDiscovery *discovery =
      [[OIDServiceDiscovery alloc] initWithJSON:kDiscoveryDocumentMissingField error:&error];
  XCTAssertNil(discovery, @"When initializing a discovery document with JSON, it should not return"
                          " an instance if there are missing required fields.");
  XCTAssertNotNil(error, @"There should be an error indicating we are missing required fields.");
  XCTAssertEqualObjects(error.domain, OIDGeneralErrorDomain, @"");
  XCTAssertEqual(error.code, OIDErrorCodeInvalidDiscoveryDocument, @"");
}

/*! @brief Tests that we do not get an error, and we do get an instance of
        @c OIDServiceDiscovery when the required fields are in the source dictionary.
 */
- (void)testNoErrorWhenNoMissingFields {
  NSError *error;
  NSDictionary *serviceDiscoveryDictionary = [[self class] minimumServiceDiscoveryDictionary];
  OIDServiceDiscovery *discovery =
      [[OIDServiceDiscovery alloc] initWithDictionary:serviceDiscoveryDictionary
                                                error:&error];
  XCTAssertNotNil(discovery, @"We supplied the minimum required fields when initializing the "
                             "service discovery instance, so we should have gotten a new "
                             "instance.");
  XCTAssertNil(error, @"We supplied the minimum required fields when initializing the "
                      "service discovery instance, so we should not have gotten an error.");
}

/*! @brief Tests that we get an error when the required fields are present but invalid.
 */
// TODO: this test is failing
- (void)pendingTestErrorWhenMalformedFields {
  NSError *error;
  // builds a discovery document with a munged field
  NSMutableDictionary *serviceDiscoveryDictionary =
      [[[self class] minimumServiceDiscoveryDictionary] mutableCopy];
  [serviceDiscoveryDictionary setObject:kTestURLInvalid forKey:kAuthorizationEndpointKey];
  [serviceDiscoveryDictionary setObject:kTestURLInvalid forKey:kTokenEndpointKey];

  OIDServiceDiscovery *discovery =
      [[OIDServiceDiscovery alloc] initWithDictionary:serviceDiscoveryDictionary error:&error];
  XCTAssertNil(discovery,
               @"When initializing a discovery document, it should not return an  instance if there"
                   " are missing required fields.");
  XCTAssertNotNil(error, @"There should be an error indicating we are missing required fields.");
  XCTAssertEqualObjects(error.domain, OIDGeneralErrorDomain, @"");
  XCTAssertEqual(error.code, OIDErrorCodeInvalidDiscoveryDocument, @"");
}

/*! @brief Tests that we get an error when null is passed in through JSON.
 */
// TODO: this test is failing
- (void)pendingTestErrorWhenJSONNullField {
  NSError *error;
  OIDServiceDiscovery *discovery =
      [[OIDServiceDiscovery alloc] initWithJSON:kDiscoveryDocumentNullField error:&error];
  XCTAssertNil(discovery, @"When initializing a discovery document, it should not return an "
                          "instance if there are missing required fields.");
  XCTAssertNotNil(error, @"There should be an error indicating we are missing required fields.");
  XCTAssertEqualObjects(error.domain, OIDGeneralErrorDomain, @"");
  XCTAssertEqual(error.code, OIDErrorCodeInvalidDiscoveryDocument, @"");
}

/*! @brief Tests that the JSON String version results in a valid object.
 */
- (void)testJSONStringDecoding {
  NSError *error;
  OIDServiceDiscovery *discovery =
      [[OIDServiceDiscovery alloc] initWithJSON:kDiscoveryDocument error:&error];
  XCTAssertNotNil(discovery, @"When initializing a discovery document with JSON it should return a"
                              "valid object");
  XCTAssertNil(error, @"There should not be any errors.");
  XCTAssertEqualObjects(discovery.authorizationEndpoint,
                        [[self class] googleDiscoveryAuthorizationEndpoint], @"");
}

/*! @brief Tests that the JSON NSData version results in a valid object.
 */
- (void)testJSONDataDecoding {
  NSError *error;
  NSData *jsonData = [kDiscoveryDocument dataUsingEncoding:NSUTF8StringEncoding];
  OIDServiceDiscovery *discovery =
      [[OIDServiceDiscovery alloc] initWithJSONData:jsonData error:&error];
  XCTAssertNotNil(discovery, @"When initializing a discovery document with JSON it should return a"
                              "valid object");
  XCTAssertNil(error, @"There should not be any errors.");
  XCTAssertEqualObjects(discovery.authorizationEndpoint,
                        [[self class] googleDiscoveryAuthorizationEndpoint], @"");
}

/*! @brief Tests that initialising with the dictionary initialiser and the JSON initialiser result
        in equal objects.
 */
// TODO: this test is failing
- (void)pendingTestJSONEqualsDictionary {
  NSError *error;
  OIDServiceDiscovery *discovery =
    [[OIDServiceDiscovery alloc] initWithDictionary:[[self class] minimumServiceDiscoveryDictionary]
                                              error:&error];
  XCTAssertNotNil(discovery, @"Discovery document should initialize.");
  XCTAssertNil(error, @"There should not be any errors.");

  NSData *jsonData = [NSJSONSerialization dataWithJSONObject:discovery.discoveryDictionary
                                                     options:0
                                                       error:&error];
  XCTAssertNotNil(jsonData, @"Serialization error");
  XCTAssertNil(error, @"Serialization error");

  OIDServiceDiscovery *discovery2 =
      [[OIDServiceDiscovery alloc] initWithJSONData:jsonData error:&error];
  XCTAssertNotNil(discovery2, @"Discovery document should initialize.");
  XCTAssertNil(error, @"There should not be any errors.");

  XCTAssertEqualObjects(discovery.discoveryDictionary, discovery2.discoveryDictionary, @"");
  XCTAssertEqualObjects(discovery, discovery2, @"");
}


/*! @brief Tests that requestURIParameterSupported returns YES (the default) when not specified in
        the source dictionary.
 */
- (void)testRequestURIParameterSupportedDefaultToYes {
  NSError *error;
  NSDictionary *serviceDiscoveryDictionary = [[self class] minimumServiceDiscoveryDictionary];
  OIDServiceDiscovery *discovery =
      [[OIDServiceDiscovery alloc] initWithDictionary:serviceDiscoveryDictionary
                                                error:&error];
  XCTAssert(discovery.requestURIParameterSupported,
            @"When not specified, |requestURIParameterSupported| should return YES.");
}

/*! @brief Tests the NSSecureCoding by round-tripping an instance through the coding process and
        checking to make sure the source and destination instances have equivalent dictionaries.
 */
- (void)testSecureCoding {
  NSError *error;
  NSDictionary *serviceDiscoveryDictionary = [[self class] completeServiceDiscoveryDictionary];
  OIDServiceDiscovery *discovery =
      [[OIDServiceDiscovery alloc] initWithDictionary:serviceDiscoveryDictionary
                                                             error:&error];
  NSData *data = [NSKeyedArchiver archivedDataWithRootObject:discovery];
  OIDServiceDiscovery *unarchived = [NSKeyedUnarchiver unarchiveObjectWithData:data];

  XCTAssertEqualObjects(discovery.discoveryDictionary, unarchived.discoveryDictionary, @"");
}

/*! @brief Tests the NSCopying implementation by round-tripping an instance through the copying
        process and checking to make sure the source and destination instances have equivalent
        dictionaries.
 */
- (void)testCopying {
  NSError *error;
  NSDictionary *serviceDiscoveryDictionary = [[self class] completeServiceDiscoveryDictionary];
  OIDServiceDiscovery *discovery =
      [[OIDServiceDiscovery alloc] initWithDictionary:serviceDiscoveryDictionary
                                                error:&error];

  OIDServiceDiscovery *unarchived = [discovery copy];

  XCTAssertEqualObjects(discovery.discoveryDictionary, unarchived.discoveryDictionary, @"");
}

#pragma mark - Field Mappings

/*! @define TestFieldBackedBy
    @brief Auto-generates unit test methods for checking that a property in
        @c OIDServiceDiscovery is, in fact, using the key specified by the second
        parameter as it's source of data.
 */
#define TestFieldBackedBy(_field_, _backed_by_, _test_value_)                                      \
                                                                                                   \
- (void)testField_##_field_ {                                                                      \
  NSError *error;                                                                                  \
  NSMutableDictionary *json = [[[self class] minimumServiceDiscoveryDictionary] mutableCopy];      \
  [json addEntriesFromDictionary:@{                                                                \
    _backed_by_ : _test_value_                                                                     \
  }];                                                                                              \
  OIDServiceDiscovery *discovery =                                                                 \
      [[OIDServiceDiscovery alloc] initWithDictionary:json error:&error];                          \
  XCTAssertNotNil(discovery, @"We supplied the minimum required fields when initializing the "     \
                             "service discovery instance, so we should have gotten a new "         \
                             "instance.");                                                         \
  XCTAssertNil(error, @"We supplied the minimum required fields when initializing the "            \
                      "service discovery instance, so we should not have gotten an error.");       \
  XCTAssertEqualObjects(discovery._field_, _test_value_);                                          \
}

/*! @define TestBooleanFieldBackedBy
    @brief Same as @c TestFieldBackedBy, but tweaked to allow for BOOL values.
 */
#define TestBooleanFieldBackedBy(_field_, _backed_by_, _test_value_)                               \
                                                                                                   \
- (void)testField_##_field_ {                                                                      \
  NSError *error;                                                                                  \
  NSMutableDictionary *json = [[[self class] minimumServiceDiscoveryDictionary] mutableCopy];      \
  [json addEntriesFromDictionary:@{                                                                \
    _backed_by_ : @(_test_value_)                                                                  \
  }];                                                                                              \
  OIDServiceDiscovery *discovery =                                                                 \
      [[OIDServiceDiscovery alloc] initWithDictionary:json error:&error];                          \
  XCTAssertNotNil(discovery, @"We supplied the minimum required fields when initializing the "     \
                             "service discovery instance, so we should have gotten a new "         \
                             "instance.");                                                         \
  XCTAssertNil(error, @"We supplied the minimum required fields when initializing the "            \
                      "service discovery instance, so we should not have gotten an error.");       \
  XCTAssertEqual(discovery._field_, _test_value_);                                                 \
}

/*! @define TestURLFieldBackedBy
    @brief Same as @c TestFieldBackedBy, but tweaked to allow for URL values.
 */
#define TestURLFieldBackedBy(_field_, _backed_by_, _test_value_)                                   \
                                                                                                   \
- (void)testField_##_field_ {                                                                      \
  NSError *error;                                                                                  \
  NSMutableDictionary *json = [[[self class] minimumServiceDiscoveryDictionary] mutableCopy];      \
  [json addEntriesFromDictionary:@{                                                                \
    _backed_by_ : _test_value_                                                                     \
  }];                                                                                              \
  OIDServiceDiscovery *discovery =                                                                 \
      [[OIDServiceDiscovery alloc] initWithDictionary:json error:&error];                          \
  XCTAssertNotNil(discovery, @"We supplied the minimum required fields when initializing the "     \
                             "service discovery instance, so we should have gotten a new "         \
                             "instance.");                                                         \
  XCTAssertNil(error, @"We supplied the minimum required fields when initializing the "            \
                      "service discovery instance, so we should not have gotten an error.");       \
  XCTAssertEqualObjects(discovery._field_, [NSURL URLWithString:_test_value_]);                    \
}

TestURLFieldBackedBy(issuer, kIssuerKey, kTestURL)
TestURLFieldBackedBy(authorizationEndpoint, kAuthorizationEndpointKey, kTestURL)
TestURLFieldBackedBy(tokenEndpoint, kTokenEndpointKey, kTestURL)
TestURLFieldBackedBy(userinfoEndpoint, kUserinfoEndpointKey, kTestURL)
TestURLFieldBackedBy(jwksURL, kJWKSURLKey, kTestURL)
TestURLFieldBackedBy(registrationEndpoint, kRegistrationEndpointKey, kTestURL)
TestFieldBackedBy(scopesSupported, kScopesSupportedKey, @"Scopes Supported")
TestFieldBackedBy(responseTypesSupported, kResponseTypesSupportedKey, @"Response Types Supported")
TestFieldBackedBy(responseModesSupported, kResponseModesSupportedKey, @"Response Modes Supported")
TestFieldBackedBy(grantTypesSupported, kGrantTypesSupportedKey, @"Grant Types Supported")
TestFieldBackedBy(acrValuesSupported, kACRValuesSupportedKey, @"ACR Values Supported")
TestFieldBackedBy(subjectTypesSupported, kSubjectTypesSupportedKey, @"Subject Types Supported")
TestFieldBackedBy(IDTokenSigningAlgorithmValuesSupported,
                  kIDTokenSigningAlgorithmValuesSupportedKey,
                  @"Token Signing Algorithm Values Supported")
TestFieldBackedBy(IDTokenEncryptionAlgorithmValuesSupported,
                  kIDTokenEncryptionAlgorithmValuesSupportedKey,
                  @"Token Encryption Algorithm Values Supported")
TestFieldBackedBy(IDTokenEncryptionEncodingValuesSupported,
                  kIDTokenEncryptionEncodingValuesSupportedKey,
                  @"token Encryption Encoding Values Supported")
TestFieldBackedBy(userinfoSigningAlgorithmValuesSupported,
                  kUserinfoSigningAlgorithmValuesSupportedKey,
                  @"User Info Signing Algorithm Values Supported")
TestFieldBackedBy(userinfoEncryptionAlgorithmValuesSupported,
                  kUserinfoEncryptionAlgorithmValuesSupportedKey,
                  @"User Info Encryption Algorithm Values Supported")
TestFieldBackedBy(userinfoEncryptionEncodingValuesSupported,
                  kUserinfoEncryptionEncodingValuesSupportedKey,
                  @"User Info Encryption Encoding Values Supported")
TestFieldBackedBy(requestObjectSigningAlgorithmValuesSupported,
                  kRequestObjectSigningAlgorithmValuesSupportedKey,
                  @"Request Object Signing Algorithm Values Supported")
TestFieldBackedBy(requestObjectEncryptionAlgorithmValuesSupported,
                  kRequestObjectEncryptionAlgorithmValuesSupportedKey,
                  @"Reqest Object Encryption Algorithm Values Supported")
TestFieldBackedBy(requestObjectEncryptionEncodingValuesSupported,
                  kRequestObjectEncryptionEncodingValuesSupported,
                  @"Request Object Encryption Encoding Values Supported")
TestFieldBackedBy(tokenEndpointAuthMethodsSupported,
                  kTokenEndpointAuthMethodsSupportedKey,
                  @"Token Endpoint Auth Methods Supported")
TestFieldBackedBy(tokenEndpointAuthSigningAlgorithmValuesSupported,
                  kTokenEndpointAuthSigningAlgorithmValuesSupportedKey,
                  @"Token Endpoint Auth Signing Algorithm Values Supported")
TestFieldBackedBy(displayValuesSupported, kDisplayValuesSupportedKey, @"Display Values Supported")
TestFieldBackedBy(claimTypesSupported, kClaimTypesSupportedKey, @"Claim Types Supported")
TestFieldBackedBy(claimsSupported, kClaimsSupportedKey, @"Claims Supported")
TestURLFieldBackedBy(serviceDocumentation, kServiceDocumentationKey, kTestURL)
TestFieldBackedBy(claimsLocalesSupported, kClaimsLocalesSupportedKey, @"Claims Locales Supported")
TestFieldBackedBy(UILocalesSupported, kUILocalesSupportedKey, @"UI Locales Supported")
TestBooleanFieldBackedBy(claimsParameterSupported, kClaimsParameterSupportedKey, YES)
TestBooleanFieldBackedBy(requestParameterSupported, kRequestParameterSupportedKey, YES)
TestBooleanFieldBackedBy(requestURIParameterSupported, kRequestURIParameterSupportedKey, NO)
TestBooleanFieldBackedBy(requireRequestURIRegistration, kRequireRequestURIRegistrationKey, YES)
TestURLFieldBackedBy(OPPolicyURI, kOPPolicyURIKey, kTestURL)
TestURLFieldBackedBy(OPTosURI, kOPTosURIKey, kTestURL)

@end

#pragma GCC diagnostic pop
