const BUCKETPATH = 'pokemondraftzone-public.s3.us-east-2.amazonaws.com';

export function getLogoUrl(path: string) {
  return (logoId: string | undefined): string | undefined => {
    if (!logoId) return undefined;
    return `https://${BUCKETPATH}/${path}/${logoId}`;
  };
}
