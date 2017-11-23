Thanks for reading this guide and considering to contribute code to the project!
We always welcome contributions to `react-native-app-auth`.

This document will get you started on how to contribute and things you should know.
So please give it a thorough read.

This guide will help you to get started setting up the repository, and how to contribute
a change. Please read it carefully.

If you're reading this, please take a look at our [Code of Conduct](CODE_OF_CONDUCT.md)
as well.

## How do I set up the project?

First of all, you'll need to run `yarn install` to install all dependencies.

All of the module's JavaScript code is located inside `index.js`, and all of the tests
are located inside `index.spec.js`.

You can run the tests using `yarn test`, which uses Jest.

Please note that the project is set up to use our eslint rules.
You can run the linter manually using `yarn lint`.

<!-- TODO: Add missing reference to the future example/ folder -->

## Where is the native code?

Since most of the code inside `index.js` is just an interface to the native code of this project
you'll most likely be searching for those native modules instead.

Those are located at:

- `./android/src/main/java/com/reactlibrary/RNAppAuth{Module,Package}.java` for Android
- `./ios/RNAppAuth.{m,h}` for iOS

All changes to the behaviour of the Android native module must be replicated for iOS as well,
and vice-versa.
If you don't feel comfortable making changes to both, feel free to contribute
(open a PR) for one of them first, and ask for help.

## How do I contribute code?

1. Search for something you'd like to change. This can be an open issue, or just a feature
  you'd like to implement. Make sure that no one else is already on it, so that you're not
  duplicating someone else's effort.

2. Fork the repository and then clone it, i.e. `git clone https://github.com/YOUR_NAME/react-native-app-auth.git`

3. Checkout a new branch with a descriptive name, e.g. `git checkout -b fix/issue-123`

4. Make your changes :sparkles:

5. Update the tests if necessary and make sure that the existing ones are still passing using `yarn test`

6. Make sure that your code is adhering to the linter's rules using `yarn lint`

7. Commit your changes with a short description, `git add -A && git commit -m 'Your meaningful and descriptive message'`

6. Push your new branch, `git push -u origin fix/issue-123`

7. Finally, open a pull request with a title and a short summary of what has been changed and why.

8. Wait for a maintainer to review it and make some changes as they're being recommended and as you see fit.

9. Get it merged and make cool a celebratory pose! :dancer:

