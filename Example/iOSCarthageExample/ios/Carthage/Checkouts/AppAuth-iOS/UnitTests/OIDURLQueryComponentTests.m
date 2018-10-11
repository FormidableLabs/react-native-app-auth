/*! @file OIDURLQueryComponentTests.m
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

#import "OIDURLQueryComponentTests.h"

#import "Source/OIDURLQueryComponent.h"

// Ignore warnings about "Use of GNU statement expression extension" which is raised by our use of
// the XCTAssert___ macros.
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wgnu"

/*! @brief A testing parameter name.
 */
static NSString *const kTestParameterName = @"ParameterName";

/*! @brief A different testing parameter name.
 */
static NSString *const kTestParameterName2 = @"ParameterName2";

/*! @brief A testing parameter value.
 */
static NSString *const kTestParameterValue = @"ParameterValue";

/*! @brief A different testing parameter value.
 */
static NSString *const kTestParameterValue2 = @"Param+eter Va=l&u#e2";
static NSString *const kTestParameterValue2Encoded = @"Para+meter%20Va%3Dl%26u%23e2";

/*! @brief The result of generating a parameter string from:
        @@{ kTestParameterName : kTestParameterValue, kTestParameterName2 : kTestParameterValue2 }
 */
static NSString *const kTestSimpleParameterStringEncoded =
    @"ParameterName=ParameterValue&ParameterName2=Param%2Beter%20Va%3Dl%26u%23e2";

/*! @brief Same as @c kTestSimpleParameterStringEncoded but with the parameter order reversed.
 */
static NSString *const kTestSimpleParameterStringEncodedRev =
    @"ParameterName2=Param%2Beter%20Va%3Dl%26u%23e2&ParameterName=ParameterValue";

/*! @brief Encoding test string representing the unencoded example from RFC6749 Appendix B.
    @see https://tools.ietf.org/html/rfc6749#appendix-B
 */
static NSString *const kEncodingTestUnencoded =
    @" %&+£€";

/*! @brief Encoding test string representing the encoded example from RFC6749 Appendix B, but with
        the U+0020 (SPACE) character also percentage encoded.
    @see https://tools.ietf.org/html/rfc6749#appendix-B
 */
static NSString *const kEncodingTestEncoded =
    @"%20%25%26%2B%C2%A3%E2%82%AC";


/*! @brief A URL string to use for testing.
 */
static NSString *const kTestURLRoot = @"https://www.example.com/";

@implementation OIDURLQueryComponentTests

- (void)testAddingParameter {
  OIDURLQueryComponent *query = [[OIDURLQueryComponent alloc] init];
  [query addParameter:kTestParameterName value:kTestParameterValue];
  XCTAssertEqualObjects([query valuesForParameter:kTestParameterName].firstObject,
                        kTestParameterValue, @"");
}

/*! @brief Test that URI query items are decoded correctly, using application/x-www-form-urlencoded
        encoding.
    @see https://tools.ietf.org/html/rfc6749#section-4.1.2
    @see https://tools.ietf.org/html/rfc6749#appendix-B
 */
- (void)test_formurlencoded_decoding {
  // Authorization response URL template
  NSString *responseURLtemplate = @"com.example.apps.1234-tepulg5joaks7:/?state=z634l182&code=4/WQA"
      "stm4iiN_0Qi-n4mEo-jL-85CvQ&scope=%@&authuser=0&session_state=ab78c20&prompt=consent#";

  NSString *expectedDecodedScope =
    @"https://www.example.com/auth/plus.me https://www.example.com/auth/userinfo.profile";
  
  // Tests an encoded scope with a '+'-encoded space
  {
    NSString* encodedScope =
        @"https://www.example.com/auth/plus.me+https://www.example.com/auth/userinfo.profile";
    NSString *authorizationResponse = [NSString stringWithFormat:responseURLtemplate,encodedScope];
    OIDURLQueryComponent *query =
        [[OIDURLQueryComponent alloc] initWithURL:[NSURL URLWithString:authorizationResponse]];
     NSString* value = [query valuesForParameter:@"scope"][0];
      XCTAssertEqualObjects(value,
                            expectedDecodedScope,
                            @"Failed to decode scope with '+' delimiter");
  }
  // Tests an encoded scope with a '%20'-encoded space
  {
    NSString* encodedScope =
      @"https://www.example.com/auth/plus.me%20https://www.example.com/auth/userinfo.profile";
    NSString *authorizationResponse = [NSString stringWithFormat:responseURLtemplate,encodedScope];
    OIDURLQueryComponent *query =
        [[OIDURLQueryComponent alloc] initWithURL:[NSURL URLWithString:authorizationResponse]];
    NSString* value = [query valuesForParameter:@"scope"][0];
    XCTAssertEqualObjects(value,
                          expectedDecodedScope,
                          @"Failed to decode scope with '%%20' delimiter");
  }
  // Tests that the example string from RFC6749 Appendix B is decoded correctly
  {
    NSString* encodedScope = @"+%25%26%2B%C2%A3%E2%82%AC";
    NSString *authorizationResponse = [NSString stringWithFormat:responseURLtemplate,encodedScope];
    OIDURLQueryComponent *query =
        [[OIDURLQueryComponent alloc] initWithURL:[NSURL URLWithString:authorizationResponse]];
    NSString* value = [query valuesForParameter:@"scope"][0];
    XCTAssertEqualObjects(value,
                          @" %&+£€",
                          @"Failed to decode RFC6749 Appendix B sample string correctly.");
  }
}

/*! @brief Test that URI query items are encoded correctly, using application/x-www-form-urlencoded
        encoding. Note that AppAuth always encodes "+" as "%20" (as permitted) to reduce
        ambiguity.
    @see https://tools.ietf.org/html/rfc6749#section-4.1.3
    @see https://tools.ietf.org/html/rfc6749#appendix-B
 */
- (void)test_formurlencoded_encoding {
  NSURL *baseURL = [NSURL URLWithString:kTestURLRoot];
  // Tests that space is encoded as %20
  {
    OIDURLQueryComponent *query = [[OIDURLQueryComponent alloc] initWithURL:baseURL];
    [query addParameter:@"scope" value:@"openid profile"];
    NSString *encodedParams = [query URLEncodedParameters];
    NSString *expected = @"scope=openid%20profile";
    XCTAssertEqualObjects(encodedParams,
                          expected,
                          @"Failed to encode space as %%20.");
  }
  // Tests that the example string from RFC6749 Appendix B is encoded correctly (but with space
  // encoded as %20, not +, as allowed by application/x-www-form-urlencoded.
  {
      OIDURLQueryComponent *query = [[OIDURLQueryComponent alloc] initWithURL:baseURL];
      [query addParameter:@"scope" value:@" %&+£€"];
      // Tests the URLEncodedParameters method
      NSString *encodedParams = [query URLEncodedParameters];
      NSString *expected = @"scope=%20%25%26%2B%C2%A3%E2%82%AC";
      XCTAssertEqualObjects(encodedParams,
                            expected,
                            @"Failed to encode RFC6749 Appendix B sample string correctly.");
  }
}

- (void)testAddingTwoParameters {
  OIDURLQueryComponent *query = [[OIDURLQueryComponent alloc] init];
  [query addParameter:kTestParameterName value:kTestParameterValue];
  XCTAssertEqualObjects([query valuesForParameter:kTestParameterName].firstObject,
                        kTestParameterValue, @"");

  [query addParameter:kTestParameterName value:kTestParameterValue2];
  NSArray<NSString *> *values = [query valuesForParameter:kTestParameterName];
  XCTAssertNotNil(values, @"");
  XCTAssertEqual(values.count, 2, @"");
  XCTAssertEqualObjects(values.firstObject, kTestParameterValue, @"");
  XCTAssertEqualObjects(values[1], kTestParameterValue2, @"");
}

/* @brief Tests the application/x-www-form-urlencoded encoding.
    @see https://tools.ietf.org/html/rfc6749#appendix-B
 */
- (void)testURLEncodedParameters {
  NSURL *baseURL = [NSURL URLWithString:kTestURLRoot];
  OIDURLQueryComponent *query = [[OIDURLQueryComponent alloc] initWithURL:baseURL];
  [query addParameter:kTestParameterName value:kEncodingTestUnencoded];

  // Tests the URLEncodedParameters method
  NSString *encodedParams = [query URLEncodedParameters];
  NSString *expected = [NSString stringWithFormat:@"%@=%@", kTestParameterName, kEncodingTestEncoded];
  XCTAssertEqualObjects(encodedParams, expected, @"");

  // Tests that params are correctly encoded when using URLByReplacingQueryInURL
  NSURL *url = [query URLByReplacingQueryInURL:baseURL];
  NSString* expectedURL = [NSString stringWithFormat:@"%@?%@", kTestURLRoot, expected];
  XCTAssertEqualObjects([url absoluteString], expectedURL, @"");
}

- (void)testAddingThreeParameters {
  OIDURLQueryComponent *query = [[OIDURLQueryComponent alloc] init];
  [query addParameter:kTestParameterName value:kTestParameterValue];
  XCTAssertEqualObjects([query valuesForParameter:kTestParameterName].firstObject,
                        kTestParameterValue, @"");

  [query addParameter:kTestParameterName value:kTestParameterValue2];
  [query addParameter:kTestParameterName value:kTestParameterValue];
  NSArray<NSString *> *values = [query valuesForParameter:kTestParameterName];
  XCTAssertNotNil(values, @"");
  XCTAssertEqual(values.count, 3, @"");
  XCTAssertEqualObjects(values.firstObject, kTestParameterValue, @"");
  XCTAssertEqualObjects(values[1], kTestParameterValue2, @"");
  XCTAssertEqualObjects(values[2], kTestParameterValue, @"");

  NSDictionary<NSString *, NSObject<NSCopying> *> *parametersAsDictionary = @{
    kTestParameterName : @[ kTestParameterValue, kTestParameterValue2, kTestParameterValue ]
  };

  XCTAssertEqualObjects(query.dictionaryValue, parametersAsDictionary, @"");
}

- (void)testBuildingParameterStringWithSimpleParameters {
  NSDictionary<NSString *, NSString *> *parameters =
      @{
        kTestParameterName : kTestParameterValue,
        kTestParameterName2 : kTestParameterValue2,
      };
  NSURL *rootURL = [NSURL URLWithString:kTestURLRoot];

  OIDURLQueryComponent *query = [[OIDURLQueryComponent alloc] init];
  [query addParameters:parameters];
  NSURL *rootURLWithParameters = [query URLByReplacingQueryInURL:rootURL];

  XCTAssert([rootURLWithParameters.query isEqualToString:kTestSimpleParameterStringEncoded]
            || [rootURLWithParameters.query isEqualToString:kTestSimpleParameterStringEncodedRev],
            @"");

  OIDURLQueryComponent *parsedParameters =
      [[OIDURLQueryComponent alloc] initWithURL:rootURLWithParameters];

  XCTAssertEqualObjects(parsedParameters.dictionaryValue, parameters, @"");
}

- (void)testParsingQueryString {
  NSString *URLString =
      [NSString stringWithFormat:@"%@?%@", kTestURLRoot, kTestSimpleParameterStringEncoded];
  NSURL *URLToParse = [NSURL URLWithString:URLString];
  OIDURLQueryComponent *query = [[OIDURLQueryComponent alloc] initWithURL:URLToParse];

  NSDictionary<NSString *, NSObject<NSCopying> *> *parameters =
      @{
        kTestParameterName : kTestParameterValue,
        kTestParameterName2 : kTestParameterValue2
      };

  XCTAssertEqualObjects(query.dictionaryValue, parameters, @"");
}

@end

#pragma GCC diagnostic pop
