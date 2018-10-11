/*! @file OIDURLQueryComponentTests.h
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

@interface OIDURLQueryComponentTests : XCTestCase

/*! @brief Test adding a single string parameter to a query.
    @remarks The query should have a single string value for the specified key.
 */
- (void)testAddingParameter;

/*! @brief Test adding two string parameters with the same key to a query.
    @remarks The query should have an array with both values for the specified key.
 */
- (void)testAddingTwoParameters;

/*! @brief Test adding three string parameters with the same key to a dictionary.
    @remarks The dictionary should have an array with all three values for the specified key.
 */
- (void)testAddingThreeParameters;

/*! @brief Test building a simple query string with two parameters, both strings.
 */
- (void)testBuildingParameterStringWithSimpleParameters;

/*! @brief Test parsing a simple query string with two string parameters.
 */
- (void)testParsingQueryString;

@end
