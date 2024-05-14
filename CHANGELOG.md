# react-native-app-auth

## 7.2.0

### Minor Changes

- Updated the minimum version of AppAuth-iOS to 1.7.3 to meet the package's requirement, which includes the necessary privacy manifest. ([#971](https://github.com/FormidableLabs/react-native-app-auth/pull/971))

## 7.1.3

### Patch Changes

- Moves '@changesets/cli' from dependencies to devDependencies, so that it isn't downloaded for react-native-app-auth package users ([#945](https://github.com/FormidableLabs/react-native-app-auth/pull/945))

## 7.1.2

### Patch Changes

- Fix iosCustomBrowser not exchanging token ([`cb3b70a`](https://github.com/FormidableLabs/react-native-app-auth/commit/cb3b70a24cc02f46c72805a933ece66726e72213))

## 7.1.1

### Patch Changes

- Fix Android crash with NullPointerException ([`a437123`](https://github.com/FormidableLabs/react-native-app-auth/commit/a4371235f37894e2aede6645efef95cf26e4143f))

## 7.1.0

### Minor Changes

- Added `androidTrustedWebActivity` config to opt-in to EXTRA_LAUNCH_AS_TRUSTED_WEB_ACTIVITY ([#908](https://github.com/FormidableLabs/react-native-app-auth/pull/908))

## 7.0.0

### Minor Changes

- Added support for Chrome Trusted Web Activity ([#897](https://github.com/FormidableLabs/react-native-app-auth/pull/897))

### Patch Changes

- Fix order of parameters for register on iOS ([#804](https://github.com/FormidableLabs/react-native-app-auth/pull/804))

* Readme update for RN 0.68+ setup ([#900](https://github.com/FormidableLabs/react-native-app-auth/pull/900))

- Update README to link to Contributing guide ([#887](https://github.com/FormidableLabs/react-native-app-auth/pull/887))

* correct swift setup example code ([#775](https://github.com/FormidableLabs/react-native-app-auth/pull/775))

- Improve readability of method arguments be renaming `headers` argument to `customHeaders` ([#899](https://github.com/FormidableLabs/react-native-app-auth/pull/899))

* Fix support of setAdditionalParameters on logout method on Android ([#765](https://github.com/FormidableLabs/react-native-app-auth/pull/765))

- Update the Example app to RN 0.72 ([#896](https://github.com/FormidableLabs/react-native-app-auth/pull/896))

* Fix authorization state parameter in iOS when using custom configuration ([#847](https://github.com/FormidableLabs/react-native-app-auth/pull/847))

- Adding GitHub release workflow ([#853](https://github.com/FormidableLabs/react-native-app-auth/pull/853))

* Added Asgardeo configuration example ([#882](https://github.com/FormidableLabs/react-native-app-auth/pull/882))
