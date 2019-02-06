import onlyAuthorize from './only-authorize';
import onlyTokenExchange from './only-token-exchange';

export default async args => {
  const authRespone = await onlyAuthorize(args);
  const tokenExhangeResponse = await onlyTokenExchange();
  return {
    ...authRespone,
    ...tokenExhangeResponse,
  };
};
