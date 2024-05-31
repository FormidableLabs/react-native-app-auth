# Slack

If you don't already have a slack app, create it [here](https://api.slack.com/apps).

Once you have an app, go "Add features and functionality" => "Permissions". Here you'll need to add two things:

1. Redirect URL
   Under "Redirect URLs", add one for your app, e.g. `com.myapp://oauth` and save

2. Scopes
   Under "Scopes", add the scopes you want to request from the user, e.g, "emoji:read"

```js
const config = {
  clientId: '<client_id>', // found under App Credentials
  clientSecret: '<client_secret>', // found under App Credentials
  scopes: ['emoji:read'], // choose any of the scopes set up in step 1
  redirectUrl: 'com.myapp://oauth', // set up in step 2
  serviceConfiguration: {
    authorizationEndpoint: 'https://slack.com/oauth/authorize',
    tokenEndpoint: 'https://slack.com/api/oauth.access',
  },
};

const authState = await authorize(config);
```
