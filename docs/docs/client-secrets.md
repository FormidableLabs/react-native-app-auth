---
sidebar_position: 2
---

# Client Secrets

Some authentication providers, including examples cited below, require you to provide a client secret. The authors of the AppAuth library

> [strongly recommend](https://github.com/openid/AppAuth-Android#utilizing-client-secrets-dangerous) you avoid using static client secrets in your native applications whenever possible. Client secrets derived via a dynamic client registration are safe to use, but static client secrets can be easily extracted from your apps and allow others to impersonate your app and steal user data. If client secrets must be used by the OAuth2 provider you are integrating with, we strongly recommend performing the code exchange step on your backend, where the client secret can be kept hidden.

Having said this, in some cases using client secrets is unavoidable. In these cases, a `clientSecret` parameter can be provided to `authorize`/`refresh` calls when performing a token request.
