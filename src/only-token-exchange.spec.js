import onlyTokenExchange from './only-token-exchange';

jest.mock('react-native', () => ({
  NativeModules: {
    RNAppAuth: {
      onlyTokenExchange: jest.fn(),
    },
  },
  Platform: {
    OS: 'ios',
  },
}));

describe('onlyTokenExchange', () => {
  let mockTokenExchange;

  beforeAll(() => {
    mockTokenExchange = require('react-native').NativeModules.RNAppAuth.onlyTokenExchange;
    mockTokenExchange.mockReturnValue('EXCHANGED');
  });

  it('calls onlyTokenExchange', async () => {
    const result = await onlyTokenExchange();
    expect(result).toEqual('EXCHANGED');
    expect(mockTokenExchange).toHaveBeenCalled();
  });
});
