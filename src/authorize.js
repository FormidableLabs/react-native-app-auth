import onlyAuthorize from './only-authorize';
import onlyTokenExchange from './only-token-exchange';

export default async args => {
  const authRespone = await onlyAuthorize(args);
  const tokenExhangeResponse = await onlyTokenExchange({
    clientSecret: args.clientSecret,
    additionalParameters: args.additionalParameters,
    dangerouslyAllowInsecureHttpRequests: args.dangerouslyAllowInsecureHttpRequests,
  });
  return {
    ...authRespone,
    ...tokenExhangeResponse,
  };
};
