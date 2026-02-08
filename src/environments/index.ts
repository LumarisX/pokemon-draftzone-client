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
  rum?: {
    enabled: boolean;
    appId: string;
    appVersion: string;
    region: string;
    sessionSampleRate: number;
    identityPoolId: string;
    endpoint?: string;
    telemetries?: Array<'performance' | 'errors' | 'http'>;
    allowCookies?: boolean;
    enableXRay?: boolean;
    signing?: boolean;
  };
};
