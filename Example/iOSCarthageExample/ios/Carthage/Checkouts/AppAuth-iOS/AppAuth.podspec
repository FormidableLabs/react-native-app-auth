Pod::Spec.new do |s|

  s.name         = "AppAuth"
  s.version      = "0.94.0"
  s.summary      = "AppAuth for iOS and macOS is a client SDK for communicating with OAuth 2.0 and OpenID Connect providers."

  s.description  = <<-DESC

AppAuth for iOS and macOS is a client SDK for communicating with [OAuth 2.0]
(https://tools.ietf.org/html/rfc6749) and [OpenID Connect]
(http://openid.net/specs/openid-connect-core-1_0.html) providers. It strives to
directly map the requests and responses of those specifications, while following
the idiomatic style of the implementation language. In addition to mapping the
raw protocol flows, convenience methods are available to assist with common
tasks like performing an action with fresh tokens.

It follows the OAuth 2.0 for Native Apps best current practice
([RFC 8252](https://tools.ietf.org/html/rfc8252)).

                   DESC

  s.homepage     = "https://openid.github.io/AppAuth-iOS"
  s.license      = "Apache License, Version 2.0"
  s.authors      = { "William Denniss" => "wdenniss@google.com",
                     "Steven E Wright" => "stevewright@google.com",
                   }

  # Note: While watchOS and tvOS are specified here, only iOS and macOS have
  #       UI implementations of the authorization service. You can use the
  #       classes of AppAuth with tokens on watchOS and tvOS, but currently the
  #       library won't help you obtain authorization grants on those platforms.

  s.platforms    = { :ios => "7.0", :osx => "10.9", :watchos => "2.0", :tvos => "9.0" }

  s.source       = { :git => "https://github.com/openid/AppAuth-iOS.git", :tag => s.version }

  s.source_files = "Source/*.{h,m}"
  s.requires_arc = true

  # iOS
  s.ios.source_files      = "Source/iOS/**/*.{h,m}"
  s.ios.deployment_target = "7.0"
  s.ios.frameworks        = "SafariServices", "AuthenticationServices"

  # macOS
  s.osx.source_files = "Source/macOS/**/*.{h,m}"
  s.osx.deployment_target = '10.9'
end
