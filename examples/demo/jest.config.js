module.exports = {
  preset: '@react-native/jest-preset',
  transformIgnorePatterns: [
    'node_modules/(?!((@)?react-native|react-native-base64)/)',
  ],
  moduleNameMapper: {
    '^react$': require.resolve('react'),
  },
};
