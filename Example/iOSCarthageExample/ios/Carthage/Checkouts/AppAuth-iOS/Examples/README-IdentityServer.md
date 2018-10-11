# Using AppAuth with [IdentityServer4](https://github.com/IdentityServer/IdentityServer4)

Since IdentityServer4 is a certified OpenID Connect implementation and supports PKCE, there are no special steps needed to use it with AppAuth.

Sample IdentityServer client definition that works OOB with the AppAuth sample:

```csharp
var client = new Client
{
    ClientId = "native.code",
    ClientName = "Native Client (Code with PKCE)",
    RequireClientSecret = false,
    
    RedirectUris = { "io.identityserver.demo:/oauthredirect" },

    AllowedGrantTypes = GrantTypes.Code,
    RequirePkce = true,
    AllowedScopes = { "openid", "profile" },
    AllowOfflineAccess = true
};
```

## Connecting the AppAuth sample to the IdentityServer4 demo instance

You can find a demo instance of IdentityServer4 at [https://demo.identityserver.io](https://demo.identityserver.io). 
On the main page you can find a number of registered clients and their configuration (all clients can use arbitrary redirect URIs).

The following changes are required for the AppAuth sample:

```
// set the issuer
static NSString *const kIssuer = @"https://demo.identityserver.io";

// client ID for code flow + PKCE
static NSString *const kClientID =
    @"native.code";

// some redirect URI (must match the plist setting)
static NSString *const kRedirectURI =
    @"io.identityserver.demo:/oauthredirect";
```

## Getting support for IdentityServer
The IdentityServer project has an [issue tracker](https://github.com/IdentityServer/IdentityServer4/issues) and [documentation](https://identityserver4.readthedocs.io/en/release/). Feel free to open an issue when you think you found a bug or unexpected behavior.
There's also a pretty active community on [StackOverflow](https://stackoverflow.com/questions/tagged/identityserver4) that can help out with more general questions.
