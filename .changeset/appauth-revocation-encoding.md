---
"react-native-app-auth": patch
---

Form-encode raw token/client values and OAuth Basic credential components, preserving reserved characters and Unicode. Treat an omitted Basic secret as empty, normalize one trailing issuer slash, reject failed discovery HTTP responses, and retain the original revocation network error as cause.
