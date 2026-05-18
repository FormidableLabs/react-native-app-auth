<a href="https://commerce.nearform.com/open-source/" target="_blank">
  <img alt="React Native App Auth" src="https://oss.nearform.com/api/banner?text=react+native+app+auth" />
</a>
<p align="center">
  <strong>React native bridge for AppAuth - an SDK for communicating with OAuth2 providers</strong>
  <br><br>

  [![npm package version](https://badge.fury.io/js/react-native-app-auth.svg)](https://badge.fury.io/js/react-native-app-auth)
  [![Maintenance Status][maintenance-image]](#maintenance-status)
  ![Workflow Status](https://github.com/FormidableLabs/react-native-app-auth/actions/workflows/main.yml/badge.svg?branch=main)

</p>

This versions supports `react-native@0.63+`. The last pre-0.63 compatible version is [`v5.1.3`](https://github.com/FormidableLabs/react-native-app-auth/tree/v5.1.3).

React Native bridge for [AppAuth-iOS](https://github.com/openid/AppAuth-iOS) and
[AppAuth-Android](https://github.com/openid/AppAuth-Android) SDKS for communicating with
[OAuth 2.0](https://tools.ietf.org/html/rfc6749) and
[OpenID Connect](http://openid.net/specs/openid-connect-core-1_0.html) providers.

This library _should_ support any OAuth provider that implements the
[OAuth2 spec](https://tools.ietf.org/html/rfc6749#section-2.2).

We only support the [Authorization Code Flow](https://oauth.net/2/grant-types/authorization-code/).

> Check out the [full documentation here](https://commerce.nearform.com/open-source/react-native-app-auth/)!

## Tested OpenID providers

These providers are OpenID compliant, which means you can use [autodiscovery](https://openid.net/specs/openid-connect-discovery-1_0.html).

- [Identity Server4](https://demo.identityserver.io/) ([Example configuration](https://commerce.nearform.com/open-source/react-native-app-auth/docs/providers/identity-server-4))
- [Identity Server3](https://github.com/IdentityServer/IdentityServer3.md) ([Example configuration](https://commerce.nearform.com/open-source/react-native-app-auth/docs/providers/identity-server-3))
- [FusionAuth](https://fusionauth.io) ([Example configuration](https://commerce.nearform.com/open-source/react-native-app-auth/docs/providers/fusionauth))
- [Google](https://developers.google.com/identity/protocols/OAuth2)
  ([Example configuration](https://commerce.nearform.com/open-source/react-native-app-auth/docs/providers/google))
- [Okta](https://developer.okta.com) ([Example configuration](https://commerce.nearform.com/open-source/react-native-app-auth/docs/providers/okta))
- [Keycloak](http://www.keycloak.org/) ([Example configuration](https://commerce.nearform.com/open-source/react-native-app-auth/docs/providers/keycloak))
- [Azure Active Directory](https://docs.microsoft.com/en-us/azure/active-directory) ([Example configuration](https://commerce.nearform.com/open-source/react-native-app-auth/docs/providers/azure-active-directory))
- [AWS Cognito](https://eu-west-1.console.aws.amazon.com/cognito) ([Example configuration](https://commerce.nearform.com/open-source/react-native-app-auth/docs/providers/aws-cognito))
- [Asgardeo](https://asgardeo.io) ([Example configuration](https://commerce.nearform.com/open-source/react-native-app-auth/docs/providers/asgardeo))
- [Microsoft](https://learn.microsoft.com/en-us/entra/identity-platform/v2-protocols-oidc) ([Example configuration](https://commerce.nearform.com/open-source/react-native-app-auth/docs/providers/microsoft))

## Tested OAuth2 providers

These providers implement the OAuth2 spec, but are not OpenID providers, which means you must configure the authorization and token endpoints yourself.

- [Uber](https://developer.uber.com/docs/deliveries/guides/three-legged-oauth.md) ([Example configuration](https://commerce.nearform.com/open-source/react-native-app-auth/docs/providers/uber))
- [Fitbit](https://dev.fitbit.com/build/reference/web-api/oauth2/) ([Example configuration](https://commerce.nearform.com/open-source/react-native-app-auth/docs/providers/fitbit))
- [Dropbox](https://www.dropbox.com/developers/reference/oauth-guide) ([Example configuration](https://commerce.nearform.com/open-source/react-native-app-auth/docs/providers/dropbox))
- [Reddit](https://github.com/reddit-archive/reddit/wiki/oauth2) ([Example configuration](https://commerce.nearform.com/open-source/react-native-app-auth/docs/providers/reddit))
- [Coinbase](https://developers.coinbase.com/docs/wallet/coinbase-connect/integrating) ([Example configuration](https://commerce.nearform.com/open-source/react-native-app-auth/docs/providers/coinbase))
- [GitHub](https://developer.github.com/apps/building-oauth-apps/authorizing-oauth-apps/) ([Example configuration](https://commerce.nearform.com/open-source/react-native-app-auth/docs/providers/github))
- [Slack](https://api.slack.com/authentication/oauth-v2) ([Example configuration](https://commerce.nearform.com/open-source/react-native-app-auth/docs/providers/slack))
- [Strava](https://developers.strava.com/docs/authentication) ([Example configuration](https://commerce.nearform.com/open-source/react-native-app-auth/docs/providers/strava))
- [Spotify](https://developer.spotify.com/documentation/general/guides/authorization-guide/) ([Example configuration](https://commerce.nearform.com/open-source/react-native-app-auth/docs/providers/spotify))
- [Unsplash](https://unsplash.com/documentation) ([Example configuration](https://commerce.nearform.com/open-source/react-native-app-auth/docs/providers/unsplash))
- [Imgur](https://apidocs.imgur.com) ([Example configuration](https://commerce.nearform.com/open-source/react-native-app-auth/docs/providers/imgur))

## Why you may want to use this library

AppAuth is a mature OAuth client implementation that follows the best practices set out in
[RFC 8252 - OAuth 2.0 for Native Apps](https://tools.ietf.org/html/rfc8252) including using
`ASWebAuthenticationSession` and `SFSafariViewController` on iOS, and
[Custom Tabs](http://developer.android.com/tools/support-library/features.html#custom-tabs) on
Android. `WebView`s are explicitly _not_ supported due to the security and usability reasons
explained in [Section 8.12 of RFC 8252](https://tools.ietf.org/html/rfc8252#section-8.12).

AppAuth also supports the [PKCE](https://tools.ietf.org/html/rfc7636) ("Pixy") extension to OAuth which was created to secure authorization codes in public clients when custom URI scheme redirects are used.

To learn more, read [this short introduction to OAuth and PKCE](https://formidable.com/blog/2018/oauth-and-pkce-with-react-native) on the Formidable blog.

## Contributing

Please see our [contributing guide](./.github/CONTRIBUTING.md).

### Running the iOS app

After cloning the repository, run the following:

```sh
cd react-native-app-auth/Example
yarn
(cd ios && pod install)
npx react-native run-ios
```

### Running the Android app

After cloning the repository, run the following:

```sh
cd react-native-app-auth/Example
yarn
npx react-native run-android
```

#### Notes

- You have to have the emulator open before running the last command. If you have difficulty getting the emulator to connect, open the project from Android Studio and run it through there.
- ANDROID: When integrating with a project that utilizes deep linking (e.g. [React Navigation deep linking](https://reactnavigation.org/docs/deep-linking/#set-up-with-bare-react-native-projects)), update the redirectUrl in your config and the `appAuthRedirectScheme` value in build.gradle to use a custom scheme so that it differs from the scheme used in your deep linking intent-filter [as seen here](https://github.com/FormidableLabs/react-native-app-auth/issues/494#issuecomment-797394994).

Example:

```
// build.gradle
android {
  defaultConfig {
    manifestPlaceholders = [
      appAuthRedirectScheme: 'io.identityserver.demo.auth'
    ]
  }
}
```

## Maintenance Status

**Active:** Nearform is actively working on this project, and we expect to continue for work for the foreseeable future. Bug reports, feature requests and pull requests are welcome.

[maintenance-image]: https://img.shields.io/badge/maintenance-active-green.svg
