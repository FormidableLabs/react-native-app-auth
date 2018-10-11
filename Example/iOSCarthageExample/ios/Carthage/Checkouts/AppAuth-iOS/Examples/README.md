# AppAuth for iOS and macOS Examples

The examples need to be configured with an OpenID Connect issuer (or
Authorization and Token endpoints manually), and the OAuth client information
like the Client ID and Redirect URI.

## Examples

Each example has docs on how to configure:

* [Example for iOS (Objective-C)](Example-iOS_ObjC/README.md)
* [Example for iOS w/ Carthage (Objective-C)](Example-iOS_ObjC-Carthage/README.md)
* [Example for macOS](Example-macOS/README.md)

To get the Issuer, Client ID, and Redirect URI, for your particular IdP, you
may view the IdP-specific information in the next section.

## OpenID Certified Providers

All [Certified OpenID providers](http://openid.net/certification/) that support
[RFC 8252](https://tools.ietf.org/html/rfc8252#appendix-A)
are welcome to submit a README with IdP information.

Those with instructions on file:

* [Google](README-Google.md)
* [IdentityServer](README-IdentityServer.md)
* [Okta](README-Okta.md)
* [PingFederate](README-PingFederate.md)
