import { ConfigPlugin, withMainActivity } from '@expo/config-plugins';

const RESULT_FORWARDING = `    if (requestCode == RNAppAuthModule.AUTHORIZATION_REQUEST_CODE) {
      RNAppAuthModule.stashAuthorizationResult(data)
    }`;

// Ignore example text and commented-out code when detecting existing integration.
// Kotlin block comments can nest; raw strings can contain quotes and comment markers.
const maskKotlinNonCode = (contents: string): string => {
  const masked = contents.split('');
  let index = 0;
  while (index < contents.length) {
    const start = index;
    if (contents.startsWith('//', index)) {
      while (index < contents.length && !/[\r\n]/.test(contents[index])) index++;
    } else if (contents.startsWith('/*', index)) {
      index += 2;
      let depth = 1;
      while (index < contents.length && depth > 0) {
        if (contents.startsWith('/*', index)) {
          depth++;
          index += 2;
        } else if (contents.startsWith('*/', index)) {
          depth--;
          index += 2;
        } else {
          index++;
        }
      }
    } else if (contents.startsWith('"""', index)) {
      const end = contents.indexOf('"""', index + 3);
      index = end === -1 ? contents.length : end + 3;
    } else if (contents[index] === '"' || contents[index] === "'") {
      const quote = contents[index++];
      while (index < contents.length) {
        if (contents[index] === '\\') {
          index += 2;
        } else if (contents[index++] === quote) {
          break;
        }
      }
    } else {
      index++;
      continue;
    }
    for (let offset = start; offset < Math.min(index, contents.length); offset++) {
      if (!/[\r\n]/.test(contents[offset])) masked[offset] = ' ';
    }
  }
  return masked.join('');
};

export const applyAppAuthActivityResultPatch = (contents: string): string => {
  const code = maskKotlinNonCode(contents);
  if (/\bRNAppAuthModule\s*\.\s*stashAuthorizationResult\s*\(\s*data\s*\)/.test(code)) {
    return contents;
  }
  if (/\bfun\s+(?:onActivityResult|`onActivityResult`)\s*\(/.test(code)) {
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
