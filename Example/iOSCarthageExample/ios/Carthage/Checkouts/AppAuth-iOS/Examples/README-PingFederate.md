# Using AppAuth for iOS and macOS with PingFederate

This example uses the *PingFederate OAuth2 Playground* sample application to quickly stand up a new PingFederate server as an OpenID Connect Provider.

Developer licenses and the PingFederate software can be found at https://developer.pingidentity.com/get-started.



## You will need

* PingFederate server & license ([download developer software and licenses](https://developer.pingidentity.com/get-started))
* PingFederate OAuth2 Playground (available from [product downloads](https://www.pingidentity.com/en/products/downloads/pingfederate.html))



## PingFederate configuration

* Install PingFederate and the OAuth2 Playground (see the readme in the OAuth2 Playground distribution)
* Modify the OAuth client `Authorization Code Client` in the PingFederate console:
  * Edit the `Redirect URIs` option to add the example redirect URI (e.g. com.example.appauth://cb)
  * If using the loopback interface with the macOS example, add the following redirect URI: `http://127.0.0.1:*/`
* Save your changes

Single sign-on using the SFSafariViewController expects a persistent session cookie to be used. This is not the default configuration for PingFederate, however there are [simple instructions to switch from using session cookies to persistent cookies](https://docs.pingidentity.com/bundle/pf_sm_extendLifetimeOfPfCookie_pf83/page/concept/extendingLifetimeOfPfCookie.html).

**Note**: Due to the Application Transport Security (ATS) features of iOS9+, your PingFederate server must have a valid SSL certificate. Developers may disable ATS by following [Apple directions](https://developer.apple.com/library/content/documentation/General/Reference/InfoPlistKeyReference/Articles/CocoaKeys.html), however this should only be done so in development environments.



## Configure the example app

Use the following information to configure the examples.

### iOS

| Configuration | Description      |
|---------------|------------------|
| Issuer        | The hostname of your PingFederate server, include the port if applicable (e.g. `https://pf.example.com:9031`). |
| Client ID     | The `Client ID` from the OAuth client configuration (e.g. `ac_client`). |
| Client Secret | Blank. The authorization code client does not have a secret. |
| Redirect URI  | The `Redirect URI` from the OAuth client configuration (e.g. `com.example.appauth://cb`). | 


### macOS

| Configuration | Description      |
|---------------|------------------|
| Issuer        | The hostname of your PingFederate server, include the port if applicable (e.g. `https://pf.example.com:9031`). |
| Client ID     | The `Client ID` from the OAuth client configuration (e.g. `ac_client`). |
| Client Secret | Blank. The authorization code client does not have a secret. |
| Redirect URI  | For macOS, you can use either the loopback interface (where AppAuth will generate the redirect URI for you), or a custom scheme. For a custom scheme, use the `Redirect URI` from the OAuth client configuration (e.g. `com.example.appauth://cb`). | 



## Support Information

For help and support visit the [Ping Identity developers site](https://developer.pingidentity.com/en/support.html) or contact your account team.

