---
sidebar_position: 7
---

# Error Messages

Values are in the `code` field of the rejected Error object.

- OAuth Authorization [error codes](https://tools.ietf.org/html/rfc6749#section-4.1.2.1)
- OAuth Access Token [error codes](https://tools.ietf.org/html/rfc6749#section-5.2)
- OpendID Connect Registration [error codes](https://openid.net/specs/openid-connect-registration-1_0.html#RegistrationError)
- `service_configuration_fetch_error` - could not fetch the service configuration
- `authentication_failed` - user authentication failed
- `token_refresh_failed` - could not exchange the refresh token for a new JWT
- `registration_failed` - could not register
- `browser_not_found` (Android only) - no suitable browser installed
