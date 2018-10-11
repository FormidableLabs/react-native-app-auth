/*! @file OIDTokenUtilities.m
 @brief AppAuth iOS SDK
 @copyright
        Copyright 2018 The AppAuth for iOS Authors. All Rights Reserved.
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

#import "Source/OIDTokenUtilities.h"


@interface OIDTokenUtilitiesTests : XCTestCase
@end
@implementation OIDTokenUtilitiesTests

- (void)testRedact {
  XCTAssertEqualObjects([OIDTokenUtilities redact:@"0123456789"], @"012345...[redacted]", @"");
}

- (void)testRedactWithNilParamater {
  XCTAssertEqualObjects([OIDTokenUtilities redact:nil], nil, @"");
}

- (void)testRedactWithEmptyString {
    XCTAssertEqualObjects([OIDTokenUtilities redact:@""], @"", @"");
}

- (void)testRedactWithShortInput {
  XCTAssertEqualObjects([OIDTokenUtilities redact:@"01234"], @"[redacted]", @"");
}

- (void)testFormUrlEncode {
  XCTAssertEqualObjects([OIDTokenUtilities formUrlEncode:@"t _9V-F*I+Z1Lk.u7:2/8L+w="],
                        @"t+_9V-F*I%2BZ1Lk.u7%3A2%2F8L%2Bw%3D", @"");
}

- (void)testFormUrlEncodeEmptyString {
  XCTAssertEqualObjects([OIDTokenUtilities formUrlEncode:@""], @"", @"");
}

@end
