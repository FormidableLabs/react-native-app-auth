---
"react-native-app-auth": patch
---

Convert Android dynamic-registration epoch seconds to milliseconds before date formatting. Return the iOS registrationClientUri as its absolute URL string rather than an NSURL object that cannot cross the JSON bridge.
