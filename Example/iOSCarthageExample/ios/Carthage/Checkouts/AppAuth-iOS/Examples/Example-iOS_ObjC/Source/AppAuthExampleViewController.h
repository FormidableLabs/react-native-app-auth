/*! @file AppAuthExampleViewController.h
    @brief AppAuth iOS SDK Example
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
#import <UIKit/UIKit.h>

@class OIDAuthState;
@class OIDServiceConfiguration;

NS_ASSUME_NONNULL_BEGIN

/*! @brief The example application's view controller.
 */
@interface AppAuthExampleViewController : UIViewController

@property(nullable) IBOutlet UIButton *authAutoButton;
@property(nullable) IBOutlet UIButton *authManual;
@property(nullable) IBOutlet UIButton *codeExchangeButton;
@property(nullable) IBOutlet UIButton *userinfoButton;
@property(nullable) IBOutlet UIButton *clearAuthStateButton;
@property(nullable) IBOutlet UITextView *logTextView;

/*! @brief The authorization state. This is the AppAuth object that you should keep around and
        serialize to disk.
 */
@property(nonatomic, readonly, nullable) OIDAuthState *authState;

/*! @brief Authorization code flow using @c OIDAuthState automatic code exchanges.
    @param sender IBAction sender.
 */
- (IBAction)authWithAutoCodeExchange:(nullable id)sender;

/*! @brief Authorization code flow without a the code exchange (need to call @c codeExchange:
        manually)
    @param sender IBAction sender.
 */
- (IBAction)authNoCodeExchange:(nullable id)sender;

/*! @brief Performs the authorization code exchange at the token endpoint.
    @param sender IBAction sender.
 */
- (IBAction)codeExchange:(nullable id)sender;

/*! @brief Performs a Userinfo API call using @c OIDAuthState.performActionWithFreshTokens.
    @param sender IBAction sender.
 */
- (IBAction)userinfo:(nullable id)sender;

/*! @brief Nils the @c OIDAuthState object.
    @param sender IBAction sender.
 */
- (IBAction)clearAuthState:(nullable id)sender;

/*! @brief Clears the UI log.
    @param sender IBAction sender.
 */
- (IBAction)clearLog:(nullable id)sender;

@end

NS_ASSUME_NONNULL_END
