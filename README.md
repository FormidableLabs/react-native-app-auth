
# react-native-app-auth

## Getting started

`$ npm install react-native-app-auth --save`

### Mostly automatic installation

`$ react-native link react-native-app-auth`

### Manual installation


#### iOS

1. In XCode, in the project navigator, right click `Libraries` ➜ `Add Files to [your project's name]`
2. Go to `node_modules` ➜ `react-native-app-auth` and add `RNAppAuth.xcodeproj`
3. In XCode, in the project navigator, select your project. Add `libRNAppAuth.a` to your project's `Build Phases` ➜ `Link Binary With Libraries`
4. Run your project (`Cmd+R`)<

#### Android

1. Open up `android/app/src/main/java/[...]/MainActivity.java`
  - Add `import com.reactlibrary.RNAppAuthPackage;` to the imports at the top of the file
  - Add `new RNAppAuthPackage()` to the list returned by the `getPackages()` method
2. Append the following lines to `android/settings.gradle`:
  	```
  	include ':react-native-app-auth'
  	project(':react-native-app-auth').projectDir = new File(rootProject.projectDir, 	'../node_modules/react-native-app-auth/android')
  	```
3. Insert the following lines inside the dependencies block in `android/app/build.gradle`:
  	```
      compile project(':react-native-app-auth')
  	```

#### Windows
[Read it! :D](https://github.com/ReactWindows/react-native)

1. In Visual Studio add the `RNAppAuth.sln` in `node_modules/react-native-app-auth/windows/RNAppAuth.sln` folder to their solution, reference from their app.
2. Open up your `MainPage.cs` app
  - Add `using App.Auth.RNAppAuth;` to the usings at the top of the file
  - Add `new RNAppAuthPackage()` to the `List<IReactPackage>` returned by the `Packages` method


## Usage
```javascript
import RNAppAuth from 'react-native-app-auth';

// TODO: What to do with the module?
RNAppAuth;
```
  