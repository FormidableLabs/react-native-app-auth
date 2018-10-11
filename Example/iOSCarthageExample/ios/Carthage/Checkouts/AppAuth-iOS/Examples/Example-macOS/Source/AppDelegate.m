/*! @file AppDelegate.m
    @brief AppAuth macOS SDK Example
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

#import "AppDelegate.h"

#import <AppAuth/AppAuth.h>

#import "AppAuthExampleViewController.h"

NS_ASSUME_NONNULL_BEGIN

@interface AppDelegate ()
@property(nullable) IBOutlet NSWindow *window;
@end

@implementation AppDelegate

- (void)applicationDidFinishLaunching:(NSNotification *)aNotification {
  _window.title = @"AppAuth Example for macOS";
  AppAuthExampleViewController *contentViewController =
      [[AppAuthExampleViewController alloc] initWithNibName:nil bundle:nil];
  contentViewController.appDelegate = self;
  _window.contentViewController = contentViewController;

  // Register for GetURL events.
  NSAppleEventManager *appleEventManager = [NSAppleEventManager sharedAppleEventManager];
  [appleEventManager setEventHandler:self
                         andSelector:@selector(handleGetURLEvent:withReplyEvent:)
                       forEventClass:kInternetEventClass
                          andEventID:kAEGetURL];
}

- (void)handleGetURLEvent:(NSAppleEventDescriptor *)event
           withReplyEvent:(NSAppleEventDescriptor *)replyEvent {
  NSString *URLString = [[event paramDescriptorForKeyword:keyDirectObject] stringValue];
  NSURL *URL = [NSURL URLWithString:URLString];
  [_currentAuthorizationFlow resumeExternalUserAgentFlowWithURL:URL];
}

@end

NS_ASSUME_NONNULL_END
