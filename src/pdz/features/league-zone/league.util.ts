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

export function formatCountdown(diffMs: number): string {
  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}
