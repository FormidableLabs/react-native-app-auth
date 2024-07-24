---
'react-native-app-auth': major
---

Breaking change (iOS, Mac Catalyst): The boolean values `useNonce`, `usePCKE`, and `prefersEphemeralSession` are now handled correctly. Previously, they were all being interpreted as `false` regardless of their actual values, but now the intended (`true` or `false`) value is correctly marshalled from JavaScript to native. To preserve behaviour from before this breaking change, explicitly set them all to `false`.
