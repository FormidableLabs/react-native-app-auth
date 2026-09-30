import { ConfigPlugin, withMainActivity } from '@expo/config-plugins';

const RESULT_FORWARDING = `    if (requestCode == RNAppAuthModule.AUTHORIZATION_REQUEST_CODE) {
      RNAppAuthModule.stashAuthorizationResult(data)
    }`;

export const applyAppAuthActivityResultPatch = (contents: string): string => {
  if (contents.includes('RNAppAuthModule.stashAuthorizationResult(data)')) {
    return contents;
  }
  if (contents.includes('fun onActivityResult')) {
    throw new Error('react-native-app-auth cannot automatically patch an existing onActivityResult override. Forward authorization results as described in the authorization docs.');
  }
  const packageDeclaration = /^package\s+[^\n]+\n/m;
  if (!packageDeclaration.test(contents) || !/\n}\s*$/.test(contents)) {
    throw new Error('react-native-app-auth could not find the Kotlin MainActivity class.');
  }
  const missingImports = ['android.content.Intent', 'com.rnappauth.RNAppAuthModule']
    .filter(name => !new RegExp(`^\\s*import\\s+${name.replace(/\./g, '\\.')}\\s*;?\\s*(?://[^\\r\\n]*)?$`, 'm').test(contents))
    .map(name => `import ${name}`);
  if (missingImports.length) {
    contents = contents.replace(packageDeclaration, match => `${match}\n${missingImports.join('\n')}\n`);
  }
  return contents.replace(/\n}\s*$/, `
  override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
${RESULT_FORWARDING}
    super.onActivityResult(requestCode, resultCode, data)
  }
}
`);
};

export const withAppAuthMainActivity: ConfigPlugin = config =>
  withMainActivity(config, mod => {
    if (mod.modResults.language !== 'kt') {
      throw new Error('react-native-app-auth requires a Kotlin MainActivity for Expo SDK 57+.');
    }
    mod.modResults.contents = applyAppAuthActivityResultPatch(mod.modResults.contents);
    return mod;
  });
