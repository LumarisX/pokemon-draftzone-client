import { Environment } from '.';

export const environment: Environment = {
  production: false,
  apiUrl: 'localhost:3860',
  bucketUrl: 'https://pokemondraftzone-public.s3.us-east-2.amazonaws.com',
  tls: false,
  auth: {
    domain: 'login.pokemondraftzone.com',
    clientId: 'nAyvHSOL1PbsFZfodzgIjRgYBUA1M1DH',
    audience: 'https://dev-wspjxi5f6mjqsjea.us.auth0.com/api/v2/',
    scope: 'openid profile email read:username offline_access',
    interceptorScope: 'openid profile email read:username',
  },
};

