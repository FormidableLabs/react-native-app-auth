import base64 from 'react-native-base64';
import { revoke } from './';

jest.mock('react-native', () => ({ NativeModules: { RNAppAuth: {} }, Platform: { OS: 'ios' } }));
jest.mock('react-native-base64', () => ({ encode: jest.fn() }));

describe('revoke', () => {
  const endpoint = 'https://fixture.example/revoke';
  const config = {
    clientId: 'fixture-client',
    serviceConfiguration: { revocationEndpoint: endpoint },
  };
  const response = { status: 200 };
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue(response);
    base64.encode.mockReset();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('uses an explicit endpoint without discovery and returns the response unchanged', async () => {
    await expect(
      revoke({ ...config, issuer: 'https://fixture.example' }, { tokenToRevoke: 'fixture-token' })
    ).resolves.toBe(response);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'token=fixture-token',
    });
  });

  it('discovers the endpoint when only an issuer is configured', async () => {
    const json = jest.fn().mockResolvedValue({ revocation_endpoint: endpoint });
    fetch.mockResolvedValueOnce({ json });
    await revoke(
      { clientId: config.clientId, issuer: 'https://fixture.example' },
      { tokenToRevoke: 'fixture-token' }
    );
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      'https://fixture.example/.well-known/openid-configuration'
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      endpoint,
      expect.objectContaining({ body: 'token=fixture-token' })
    );
  });

  it('rejects missing discovery metadata without posting the token', async () => {
    fetch.mockResolvedValueOnce({ json: jest.fn().mockResolvedValue({}) });
    await expect(
      revoke(
        { clientId: config.clientId, issuer: 'https://fixture.example' },
        { tokenToRevoke: 'fixture-token' }
      )
    ).rejects.toThrow('does not specify a revocation endpoint');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('preserves discovery network failures without posting the token', async () => {
    const error = new Error('Fixture network failure');
    fetch.mockRejectedValueOnce(error);
    await expect(
      revoke(
        { clientId: config.clientId, issuer: 'https://fixture.example' },
        { tokenToRevoke: 'fixture-token' }
      )
    ).rejects.toBe(error);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('rejects malformed discovery JSON without posting the token', async () => {
    const error = new SyntaxError('Fixture invalid JSON');
    fetch.mockResolvedValueOnce({ json: jest.fn().mockRejectedValue(error) });
    await expect(
      revoke(
        { clientId: config.clientId, issuer: 'https://fixture.example' },
        { tokenToRevoke: 'fixture-token' }
      )
    ).rejects.toBe(error);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('encodes form values so delimiters and Unicode cannot alter the token or client ID', async () => {
    const token = "fixture+token&other=value% !'()~ café";
    const clientId = 'fixture+client&other=value% café';
    await revoke({ ...config, clientId }, { tokenToRevoke: token, sendClientId: true });
    const body = fetch.mock.calls[0][1].body;
    expect(body).toBe(
      'token=fixture%2Btoken%26other%3Dvalue%25+%21%27%28%29%7E+caf%C3%A9&client_id=fixture%2Bclient%26other%3Dvalue%25+caf%C3%A9'
    );
    const parameters = new URLSearchParams(body);
    expect([...parameters.keys()]).toEqual(['token', 'client_id']);
    expect(parameters.get('token')).toBe(token);
    expect(parameters.get('client_id')).toBe(clientId);
  });

  it('adds Basic authentication only when requested', async () => {
    base64.encode.mockReturnValue('fixture-encoded-credentials');
    await revoke(
      { ...config, clientSecret: 'fixture-secret' },
      { tokenToRevoke: 'fixture-token', includeBasicAuth: true }
    );
    expect(base64.encode).toHaveBeenCalledWith('fixture-client:fixture-secret');
    expect(fetch).toHaveBeenCalledWith(
      endpoint,
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: 'Basic fixture-encoded-credentials',
        },
        body: 'token=fixture-token',
      })
    );
  });

  it('preserves the existing rejection message for revocation network failures', async () => {
    fetch.mockRejectedValueOnce(new Error('Fixture network failure'));
    await expect(revoke(config, { tokenToRevoke: 'fixture-token' })).rejects.toThrow(
      'Failed to revoke token'
    );
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('rejects a missing token before making a request', async () => {
    await expect(revoke(config, {})).rejects.toThrow('Please include the token to revoke');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects a missing issuer and endpoint before making a request', async () => {
    await expect(
      revoke({ clientId: config.clientId }, { tokenToRevoke: 'fixture-token' })
    ).rejects.toThrow('revocation endpoint');
    expect(fetch).not.toHaveBeenCalled();
  });
});
