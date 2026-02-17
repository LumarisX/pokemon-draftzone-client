const BUCKETPATH = 'pokemondraftzone-public.s3.us-east-2.amazonaws.com';

export function getLogoUrlOld(path: string) {
  return (logoId: string | undefined): string | undefined => {
    if (!logoId) return undefined;
    return `https://${BUCKETPATH}/${path}/${logoId}`;
  };
}

export function getLogoUrl(logoId: string | undefined) {
  if (!logoId) return '/assets/images/battle-zone/default_logo.png';
  return `https://${BUCKETPATH}/${logoId}`;
}
