# Using AppAuth with [Okta](https://developer.okta.com/docs/api/resources/oidc.html)

Since Okta is a certified OpenID Connect provider and supports PKCE by default, configuration is quick and simple. There are no additional libraries or tools required.

## Add an OpenID Connect Client

You can create an Okta developer account at [https://developer.okta.com/](https://developer.okta.com/). 

  1. After login, navigate to https://{{yourOrg}}-admin.oktapreview.com/admin/apps/add-app and select **Create New App**
  1. Choose **Native** as the platform, Sign on method as **OpenID Connect** then select **Create**.
  1. Populate your new OpenID Connect application with values similar to:

| Setting             | Value                                               |
| ------------------- | --------------------------------------------------- |
| Application Name    | OpenId Connect App *(must be unique)* |
| Redirect URIs       | com.oktapreview.yoursubdomain://callback_url|
| Allowed grant types | Authorization Code |

4. Click **Finish** to redirect back to the *General Settings* of your application.
5. Copy the **Client ID**, as it will be needed for the client configuration.

**Note:** *As with any Okta application, make sure you assign Users or Groups to the OpenID Connect Client. Otherwise, no one can use it.*

The following changes are required for the AppAuth sample:

```
// set the issuer
// This will be your specific subdomain.okta.com or subdomain.oktapreview.com
static NSString *const kIssuer = @"https://subdomain.okta.com”;

// client ID for code flow + PKCE
// This is available from your OpenID Connect Client page
static NSString *const kClientID = @“YourClientID”;

static NSString *const kRedirectURI = @"com.oktapreview.yoursubdomain:/oauth";
