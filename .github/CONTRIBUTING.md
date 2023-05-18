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

8. Push your new branch, `git push -u origin fix/issue-123`

9. Finally, open a pull request with a title and a short summary of what has been changed and why.

10. Wait for a maintainer to review it and make some changes as they're being recommended and as you see fit.

11. Get it merged and make cool a celebratory pose! :dancer:

### Using changesets

Our official release path is to use automation to perform the actual publishing of our packages. The steps are to:

1. A human developer adds a changeset. Ideally this is as a part of a PR that will have a version impact on a package.
2. On merge of a PR our automation system opens a "Version Packages" PR.
3. On merging the "Version Packages" PR, the automation system publishes the packages.

Here are more details:

### Add a changeset

When you would like to add a changeset (which creates a file indicating the type of change), in your branch/PR issue this command:

```sh
$ yarn changeset
```

to produce an interactive menu. Navigate the packages with arrow keys and hit `<space>` to select 1+ packages. Hit `<return>` when done. Select semver versions for packages and add appropriate messages. From there, you'll be prompted to enter a summary of the change. Some tips for this summary:

1. Aim for a single line, 1+ sentences as appropriate.
2. Include issue links in GH format (e.g. `#123`).
3. You don't need to reference the current pull request or whatnot, as that will be added later automatically.

After this, you'll see a new uncommitted file in `.changesets` like:

```sh
$ git status
# ....
Untracked files:
  (use "git add <file>..." to include in what will be committed)
	.changeset/flimsy-pandas-marry.md
```

Review the file, make any necessary adjustments, and commit it to source. When we eventually do a package release, the changeset notes and version will be incorporated!

### Creating versions

On a merge of a feature PR, the changesets GitHub action will open a new PR titled `"Version Packages"`. This PR is automatically kept up to date with additional PRs with changesets. So, if you're not ready to publish yet, just keep merging feature PRs and then merge the version packages PR later.

### Publishing packages

On the merge of a version packages PR, the changesets GitHub action will publish the packages to npm.
