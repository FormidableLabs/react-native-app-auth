/*! @file OIDTokenRequestTests.h
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

#import <XCTest/XCTest.h>

@class OIDTokenRequest;

NS_ASSUME_NONNULL_BEGIN

/*! @brief Unit tests for @c OIDTokenRequest.
 */
@interface OIDTokenRequestTests : XCTestCase

/*! @brief Creates a new @c OIDTokenRequest for testing.
 */
+ (OIDTokenRequest *)testInstance;

/*! @brief Creates a new @c OIDTokenRequest for testing the code exchange.
 */
+ (OIDTokenRequest *)testInstanceCodeExchange;

/*! @brief Creates a new @c OIDTokenRequest for testing the token refresh.
 */
+ (OIDTokenRequest *)testInstanceRefresh;

@end

NS_ASSUME_NONNULL_END
