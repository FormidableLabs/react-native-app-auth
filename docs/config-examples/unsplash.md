# Unsplash

If you don't already have a unsplash app, create it [here](https://unsplash.com/oauth/applications).

Once you have an app, go to your app page. Here you'll need to add two things:

1. Redirect URL
   Under "Redirect URLs", add one for your app, e.g. `com.myapp://oauth` and save

2. Scopes
   Under "Scopes", add the scopes you want to request from the user, e.g, "public"

```js
const config = {
  usePKCE: false, // Important !!
  clientId: '<client_id>', // found under App Credentials
  clientSecret: '<client_secret>', // found under App Credentials
  scopes: ['public'], // choose any of the scopes set up in step 1
  redirectUrl: 'com.myapp://oauth', // set up in step 2
  serviceConfiguration: {
    authorizationEndpoint: 'https://unsplash.com/oauth/authorize',
    tokenEndpoint: 'https://unsplash.com/oauth/token',
  },
};

const authState = await authorize(config);
```
