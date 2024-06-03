---
sidebar_position: 6
---

# Logout

This method will logout a user, as per the [OpenID Connect RP Initiated Logout](https://openid.net/specs/openid-connect-rpinitiated-1_0.html) specification. It requires an `idToken`, obtained after successfully authenticating with OpenID Connect, and a URL to redirect back after the logout has been performed.

```js
import { logout } from 'react-native-app-auth';

const config = {
  issuer: '<YOUR_ISSUER_URL>',
};

const result = await logout(config, {
  idToken: '<ID_TOKEN>',
  postLogoutRedirectUrl: '<POST_LOGOUT_URL>',
});
```
