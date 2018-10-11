/*! @file SwiftTests.swift
    @brief AppAuth iOS SDK
    @copyright
        Copyright 2017 The AppAuth for iOS Authors. All Rights Reserved.
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

import Foundation
import XCTest

/*! @brief Unit tests to verify Swift compatability.
 */
class OIDSwiftTests: XCTestCase {

  /*! @brief Tests creation of a basic AppAuth object.
   */
  func testSwift() {
    let authorizationEndpoint = URL(string: "https://example.com/authorization")!
    let tokenEndpoint = URL(string: "https://example.com/token")!
    let service = OIDServiceConfiguration(authorizationEndpoint: authorizationEndpoint,
                                          tokenEndpoint: tokenEndpoint)
    XCTAssertNotNil(service, "OIDServiceConfiguration not nil")
  }
}
