import authorize from './authorize';

jest.mock('react-native', () => ({
  NativeModules: {
    RNAppAuth: {
      authorize: jest.fn(),
      refresh: jest.fn(),
    },
  },
  Platform: {
    OS: 'ios',
  },
}));

jest.mock('./only-authorize', () => () => ({ auth: 'response' }));

jest.mock('./only-token-exchange', () => () => ({ token: 'response' }));

describe('authorize', () => {
  it('calls authorize and token exchange and merges the results', async () => {
    const result = await authorize({});
    expect(result).toEqual({ auth: 'response', token: 'response' });
  });
});
