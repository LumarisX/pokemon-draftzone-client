export type Environment = {
  production: boolean;
  apiUrl: string;
  tls?: boolean;
  bucketUrl: string;
  auth: {
    domain: string;
    clientId: string;
    audience: string;
    scope: string;
    interceptorScope: string;
  };
};

