/*! @file OIDExternalUserAgentMac.m
    @brief AppAuth iOS SDK
    @copyright
        Copyright 2016 Google Inc. All Rights Reserved.
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

#import "OIDExternalUserAgentMac.h"

#import <Cocoa/Cocoa.h>

#import "OIDErrorUtilities.h"
#import "OIDExternalUserAgentSession.h"
#import "OIDExternalUserAgentRequest.h"

NS_ASSUME_NONNULL_BEGIN

@implementation OIDExternalUserAgentMac {
  BOOL _externalUserAgentFlowInProgress;
  __weak id<OIDExternalUserAgentSession> _session;
}

- (BOOL)presentExternalUserAgentRequest:(id<OIDExternalUserAgentRequest>)request
                                session:(id<OIDExternalUserAgentSession>)session {
  if (_externalUserAgentFlowInProgress) {
    // TODO: Handle errors as authorization is already in progress.
    return NO;
  }

  _externalUserAgentFlowInProgress = YES;
  _session = session;
  NSURL *requestURL = [request externalUserAgentRequestURL];

  BOOL openedBrowser = [[NSWorkspace sharedWorkspace] openURL:requestURL];
  if (!openedBrowser) {
    [self cleanUp];
    NSError *safariError = [OIDErrorUtilities errorWithCode:OIDErrorCodeBrowserOpenError
                                            underlyingError:nil
                                                description:@"Unable to open the browser."];
    [session failExternalUserAgentFlowWithError:safariError];
  }
  return openedBrowser;
}

- (void)dismissExternalUserAgentAnimated:(BOOL)animated completion:(void (^)(void))completion {
  if (!_externalUserAgentFlowInProgress) {
    // Ignore this call if there is no authorization flow in progress.
    return;
  }
  // Ideally the browser tab with the URL should be closed here, but the AppAuth library does not
  // control the browser.
  [self cleanUp];
  if (completion) completion();
}

- (void)cleanUp {
  _session = nil;
  _externalUserAgentFlowInProgress = NO;
}

@end

NS_ASSUME_NONNULL_END
