/*! @file OIDServiceConfigurationTests.m
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

#import "OIDServiceConfigurationTests.h"

#import <objc/runtime.h>

#import "OIDServiceDiscoveryTests.h"
#import "Source/OIDAuthorizationService.h"
#import "Source/OIDError.h"
#import "Source/OIDServiceConfiguration.h"
#import "Source/OIDServiceDiscovery.h"

// Ignore warnings about "Use of GNU statement expression extension" which is raised by our use of
// the XCTAssert___ macros.
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wgnu"

/*! @brief The callback signature for @c NSURLSession 's @c dataTaskWithURL:completionHandler:
        method, which we swizzle in @c testFetcher to fake the network response with an OpenID
        Connect Discovery document.
 */
typedef void(^DataTaskWithURLCompletionHandler)(NSData *_Nullable data,
                                                NSURLResponse *_Nullable response,
                                                NSError *_Nullable error);

/*! @brief The function signature for a @c dataTaskWithURL:completionHandler: implementation. Used
        in @c testFetcher for implementing a swizzled version of @c NSURLSession 's
        @c dataTaskWithURL:completionHandler:
 */
typedef NSURLSessionDataTask *(^DataTaskWithURLCompletionImplementation)
    (id _self, NSURL *url, DataTaskWithURLCompletionHandler completionHandler);

/*! @brief A block to be called during teardown.
 */
typedef void(^TeardownTask)(void);

/*! @brief Test value for the @c authorizationEndpoint property.
 */
static NSString *const kInitializerTestAuthEndpoint = @"https://www.example.com/auth";

/*! @brief Test value for the @c tokenEndpoint property.
 */
static NSString *const kInitializerTestTokenEndpoint = @"https://www.example.com/token";

/*! @brief Test value for the @c tokenEndpoint property.
 */
static NSString *const kInitializerTestRegistrationEndpoint =
    @"https://www.example.com/registration";

/*! @brief Test URL for OpenID Connect Discovery document. Not actually retrieved.
 */
static NSString *const kInitializerTestDiscoveryEndpoint = @"https://www.example.com/discovery";

/*! @brief Test issuer for OpenID Connect discovery
 */
static NSString *const kIssuerTestIssuer = @"https://accounts.google.com/";

/*! @brief Test issuer without a slash for OpenID Connect discovery
 */
static NSString *const kIssuerTestIssuer2 = @"https://accounts.google.com";

/*! @brief Test complete valid discovery URL
 */
static NSString *const kIssuerTestExpectedFullDiscoveryURL =
    @"https://accounts.google.com/.well-known/openid-configuration";


@implementation OIDServiceConfigurationTests {
  /*! @brief A list of tasks to perform during tearDown.
   */
  NSMutableArray<TeardownTask> *_teardownTasks;
}

+ (OIDServiceConfiguration *)testInstance {
  NSURL *authEndpoint = [NSURL URLWithString:kInitializerTestAuthEndpoint];
  NSURL *tokenEndpoint = [NSURL URLWithString:kInitializerTestTokenEndpoint];
  NSURL *registrationEndpoint = [NSURL URLWithString:kInitializerTestRegistrationEndpoint];
  OIDServiceConfiguration *configuration =
      [[OIDServiceConfiguration alloc] initWithAuthorizationEndpoint:authEndpoint
                                                       tokenEndpoint:tokenEndpoint
                                                registrationEndpoint:registrationEndpoint];
  return configuration;
}

- (void)setUp {
  _teardownTasks = [NSMutableArray array];
}


- (void)tearDown {
  for (TeardownTask task in _teardownTasks) {
    task();
  }
  _teardownTasks = nil;
}

/*! @brief Replaces the given method with a block for testing, undoing the change during tearDown.
    @param method The method to replace.
    @param block The new implementation of the method to be used.
 */
- (void)replaceMethod:(Method)method withBlock:(id)block {
  IMP originalImpl = method_getImplementation(method);
  IMP testImpl = imp_implementationWithBlock(block);
  // swizzles the method
  method_setImplementation(method, testImpl);
  // unswizzles the method during teardown
  [_teardownTasks addObject:^(){
      method_setImplementation(method, originalImpl);
  }];
}

/*! @brief Replaces the given instance method with a block for testing, reversing the change during
        tearDown.
    @param class The class whose method will be replaced.
    @param selector The selector of the class method that will be replaced.
    @param block The new implementation of the method to be used.
 */
- (void)replaceInstanceMethodForClass:(Class)class selector:(SEL)selector withBlock:(id)block {
  Method method = class_getInstanceMethod(class, selector);
  [self replaceMethod:method withBlock:block];
}

/*! @brief Replaces the given class method with a block for testing, reversing the change during
        tearDown.
    @param class The class whose method will be replaced.
    @param selector The selector of the class method that will be replaced.
    @param block The new implementation of the method to be used.
 */
- (void)replaceClassMethodForClass:(Class)class selector:(SEL)selector withBlock:(id)block {
  Method method = class_getClassMethod(class, selector);
  [self replaceMethod:method withBlock:block];
}

/*! @brief Tests the designated initializer.
 */
- (void)testInitializer {
  OIDServiceConfiguration *configuration = [[self class] testInstance];
  XCTAssertEqualObjects(configuration.authorizationEndpoint.absoluteString,
                        kInitializerTestAuthEndpoint, @"");
  XCTAssertEqualObjects(configuration.tokenEndpoint.absoluteString,
                        kInitializerTestTokenEndpoint);
  XCTAssertEqualObjects(configuration.registrationEndpoint.absoluteString,
                        kInitializerTestRegistrationEndpoint, @"");
}

- (void)testIssuer {
  [self discoveryWithIssuer:kIssuerTestIssuer];
}
- (void)testIssuer2 {
  [self discoveryWithIssuer:kIssuerTestIssuer2];
}

- (void)discoveryWithIssuer:(NSString *)issuer {
  XCTestExpectation *expectation =
      [self expectationWithDescription:@"Discovery URL should be correct."];

  id successfulResponse =
      ^(id _self, NSURL *discoveryURL, OIDDiscoveryCallback completion) {
        NSURL *fullDiscoveryURL = [NSURL URLWithString:kIssuerTestExpectedFullDiscoveryURL];
        if ([discoveryURL isEqual:fullDiscoveryURL]) {
          [expectation fulfill];
          return;
        }

        XCTAssert(NO,
                  @"Not equal %@ != %@",
                  [fullDiscoveryURL absoluteString],
                  [discoveryURL absoluteString]);
      };

  [self replaceClassMethodForClass:[OIDAuthorizationService class]
       selector:@selector(discoverServiceConfigurationForDiscoveryURL:completion:)
      withBlock:successfulResponse];

  NSURL *issuerURL = [NSURL URLWithString:issuer];
  [OIDAuthorizationService discoverServiceConfigurationForIssuer:issuerURL
      completion:^(OIDServiceConfiguration *_Nullable configuration, NSError *_Nullable error) {}];

  [self waitForExpectationsWithTimeout:2 handler:nil];
}

/*! @brief Tests the OpenID Connect Discovery Document fetching and initialization.
 */
- (void)testFetcher {
  DataTaskWithURLCompletionImplementation successfulResponse =
      ^NSURLSessionDataTask *(
          id _self, NSURL *url, DataTaskWithURLCompletionHandler completionHandler) {
        NSError *error;
        NSDictionary *jsonObject =
            [OIDServiceDiscoveryTests completeServiceDiscoveryDictionary];
        NSData *jsonData = [NSJSONSerialization dataWithJSONObject:jsonObject
                                                           options:NSJSONWritingPrettyPrinted
                                                             error:&error];
        NSHTTPURLResponse *jsonResponse =
            [[NSHTTPURLResponse alloc] initWithURL:url
                                        statusCode:200
                                       HTTPVersion:@"1.1"
                                      headerFields:nil];
        completionHandler(jsonData, jsonResponse, nil);
        return nil;
      };

  [self replaceInstanceMethodForClass:[NSURLSession class]
                             selector:@selector(dataTaskWithURL:completionHandler:)
                            withBlock:successfulResponse];


  NSURL *url = [NSURL URLWithString:kInitializerTestDiscoveryEndpoint];

  NSDictionary *expectedDictionary =
      [OIDServiceDiscoveryTests completeServiceDiscoveryDictionary];
  OIDServiceDiscovery *expectedValues =
      [[OIDServiceDiscovery alloc] initWithDictionary:expectedDictionary error:NULL];

  XCTestExpectation *expectation = [self expectationWithDescription:@"Callback should be fired."];
  OIDServiceConfigurationCreated callback =
    ^(OIDServiceConfiguration *_Nullable serviceConfiguration,
      NSError *_Nullable error) {
      [expectation fulfill];
      XCTAssertNil(error, @"");
      XCTAssertNotNil(serviceConfiguration, @"");
      XCTAssertEqualObjects(serviceConfiguration.tokenEndpoint,
                            expectedValues.tokenEndpoint, @"");
      XCTAssertEqualObjects(serviceConfiguration.authorizationEndpoint,
                            expectedValues.authorizationEndpoint, @"");
    };
  [OIDAuthorizationService discoverServiceConfigurationForDiscoveryURL:url
                                                            completion:callback];
  [self waitForExpectationsWithTimeout:2 handler:nil];
}

/*! @brief Tests the OpenID Connect Discovery Document fetching and initialization in the face of
        a network error.
 */
- (void)testFetcherWithNetworkError {
  DataTaskWithURLCompletionImplementation successfulResponse =
      ^NSURLSessionDataTask *(
          id _self, NSURL *url, DataTaskWithURLCompletionHandler completionHandler) {
        NSError *error = [NSError errorWithDomain:NSURLErrorDomain code:500 userInfo:nil];
        completionHandler(nil, nil, error);
        return nil;
      };

  [self replaceInstanceMethodForClass:[NSURLSession class]
                             selector:@selector(dataTaskWithURL:completionHandler:)
                            withBlock:successfulResponse];

  NSURL *url = [NSURL URLWithString:kInitializerTestDiscoveryEndpoint];

  XCTestExpectation *expectation = [self expectationWithDescription:@"Callback should be fired."];
  OIDServiceConfigurationCreated callback =
    ^(OIDServiceConfiguration *_Nullable serviceConfiguration,
      NSError *_Nullable error) {
      [expectation fulfill];
      XCTAssertNotNil(error, @"");
      XCTAssertNil(serviceConfiguration, @"");
    };
  [OIDAuthorizationService discoverServiceConfigurationForDiscoveryURL:url
                                                            completion:callback];
  [self waitForExpectationsWithTimeout:2 handler:nil];
}

/*! @brief Tests the OpenID Connect Discovery Document fetching and initialization in the face of
        a non-2xx HTTP status code. Should return an error.
 */
- (void)testFetcherWithErrorCode {
  DataTaskWithURLCompletionImplementation successfulResponse =
      ^NSURLSessionDataTask *(
          id _self, NSURL *url, DataTaskWithURLCompletionHandler completionHandler) {
        NSError *error;
        NSDictionary *jsonObject = [OIDServiceDiscoveryTests completeServiceDiscoveryDictionary];
        NSData *jsonData = [NSJSONSerialization dataWithJSONObject:jsonObject
                                                           options:NSJSONWritingPrettyPrinted
                                                             error:&error];
        NSHTTPURLResponse *jsonResponse =
            [[NSHTTPURLResponse alloc] initWithURL:url
                                        statusCode:500
                                       HTTPVersion:@"1.1"
                                      headerFields:nil];
        completionHandler(jsonData, jsonResponse, nil);
        return nil;
      };

  [self replaceInstanceMethodForClass:[NSURLSession class]
                             selector:@selector(dataTaskWithURL:completionHandler:)
                            withBlock:successfulResponse];


  NSURL *url = [NSURL URLWithString:kInitializerTestDiscoveryEndpoint];

  XCTestExpectation *expectation = [self expectationWithDescription:@"Callback should be fired."];
  OIDServiceConfigurationCreated callback =
    ^(OIDServiceConfiguration *_Nullable serviceConfiguration,
      NSError *_Nullable error) {
      [expectation fulfill];
      XCTAssertNotNil(error, @"");
      XCTAssertNil(serviceConfiguration, @"");
    };
  [OIDAuthorizationService discoverServiceConfigurationForDiscoveryURL:url
                                                            completion:callback];
  [self waitForExpectationsWithTimeout:2 handler:nil];
}

/*! @brief Tests the OpenID Connect Discovery Document fetching and initialization in the face of
        bad JSON input.
 */
- (void)testFetcherWithBadJSON {
  DataTaskWithURLCompletionImplementation successfulResponse =
      ^NSURLSessionDataTask *(
          id _self, NSURL *url, DataTaskWithURLCompletionHandler completionHandler) {
        NSData *jsonData = [@"JUNK" dataUsingEncoding:NSUTF8StringEncoding];
        NSHTTPURLResponse *jsonResponse =
            [[NSHTTPURLResponse alloc] initWithURL:url
                                        statusCode:200
                                       HTTPVersion:@"1.1"
                                      headerFields:nil];
        completionHandler(jsonData, jsonResponse, nil);
        return nil;
      };

  [self replaceInstanceMethodForClass:[NSURLSession class]
                             selector:@selector(dataTaskWithURL:completionHandler:)
                            withBlock:successfulResponse];

  NSURL *url = [NSURL URLWithString:kInitializerTestDiscoveryEndpoint];

  XCTestExpectation *expectation = [self expectationWithDescription:@"Callback should be fired."];
  OIDServiceConfigurationCreated callback =
    ^(OIDServiceConfiguration *_Nullable serviceConfiguration,
      NSError *_Nullable error) {
      [expectation fulfill];
      XCTAssertNotNil(error, @"");
      XCTAssertNil(serviceConfiguration, @"");
    };
  [OIDAuthorizationService discoverServiceConfigurationForDiscoveryURL:url
                                                            completion:callback];
  [self waitForExpectationsWithTimeout:2 handler:nil];
}

/*! @brief Tests the @c NSSecureCoding by round-tripping an instance through the coding process and
        checking to make sure the source and destination instances have equivalent dictionaries.
 */
- (void)testSecureCoding {
  OIDServiceConfiguration *configuration = [[self class] testInstance];
  NSData *data = [NSKeyedArchiver archivedDataWithRootObject:configuration];
  OIDServiceConfiguration *unarchived = [NSKeyedUnarchiver unarchiveObjectWithData:data];

  XCTAssertEqualObjects(configuration.authorizationEndpoint, unarchived.authorizationEndpoint, @"");
  XCTAssertEqualObjects(configuration.tokenEndpoint, unarchived.tokenEndpoint, @"");
  XCTAssertEqualObjects(configuration.registrationEndpoint, unarchived.registrationEndpoint, @"");
}

/*! @brief Tests the @c NSCopying implementation by round-tripping an instance through the copying
        process and checking to make sure the source and destination instances have equivalent
        dictionaries.
 */
- (void)testCopying {
  OIDServiceConfiguration *configuration = [[self class] testInstance];
  OIDServiceConfiguration *unarchived = [configuration copy];

  XCTAssertEqualObjects(configuration.authorizationEndpoint, unarchived.authorizationEndpoint, @"");
  XCTAssertEqualObjects(configuration.tokenEndpoint, unarchived.tokenEndpoint, @"");
  XCTAssertEqualObjects(configuration.registrationEndpoint, unarchived.registrationEndpoint, @"");
}

@end

#pragma GCC diagnostic pop
