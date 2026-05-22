---
'react-native-app-auth': minor
---

Android: opt-in Partial Custom Tab (bottom-sheet) for the authorization flow via the new `androidCustomTabPartialHeightFraction` option. When set to a fraction in `(0, 1]`, Chrome 107+ renders the Custom Tab as a user-resizable bottom sheet at that fraction of the screen height (a common choice is `0.85`), keeping the app visible behind the sheet and matching the modal feel of iOS's `ASWebAuthenticationSession`. Older Chrome silently ignores the extra and falls back to the full-screen Custom Tab. Bumps `androidx.browser:browser` from `1.4.0` to `1.5.0` for the `setInitialActivityHeightPx` API.
