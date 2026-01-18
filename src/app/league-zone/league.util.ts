const BUCKETPATH =
  'pokemondraftzone-public.s3.us-east-2.amazonaws.com/user-uploads';

export function getLogoUrl(logoId: string | undefined): string | undefined {
  if (!logoId) return undefined;
  return `https://${BUCKETPATH}/${logoId}`;
}
