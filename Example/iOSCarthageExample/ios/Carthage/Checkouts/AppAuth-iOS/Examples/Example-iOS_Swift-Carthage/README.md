# Example Project

## Setup & Open the Project

You'll need to have [Carthage](https://github.com/Carthage/Carthage) installed
in order to pull the AppAuth dependency.

So first run `carthage bootstrap` to build AppAuth framework then open the
`Example.xcodeproj` file.

## Configuration

The example doesn't work out of the box, you need to configure it with your own
client ID.

### Information You'll Need

* Issuer
* Client ID
* Redirect URI

How to get this information varies by IdP, but we have
[instructions](../README.md#openid-certified-providers) for some OpenID
Certified providers.

### Configure the Example

#### In the file `AppAuthExampleViewController.swift` 

1. Update `kIssuer` with the IdP's issuer.
2. Update `kClientID` with your new client id.
3. Update `kRedirectURI` redirect URI

#### In the file `Info.plist`

Fully expand "URL types" (a.k.a. `CFBundleURLTypes`) and replace
`com.example.app` with the *scheme* of your redirect URI. 
The scheme is everything before the colon (`:`).  For example, if the redirect
URI is `com.example.app:/oauth2redirect/example-provider`, then the scheme
would be `com.example.app`.

### Running the Example

Now your example should be ready to run.

