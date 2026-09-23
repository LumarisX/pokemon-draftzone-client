const BUCKETPATH = 'pokemondraftzone-public.s3.us-east-2.amazonaws.com';

export function getLogoUrl(logoId: string | undefined) {
  if (!logoId) return '/assets/images/battle-zone/default_logo.png';
  return `https://${BUCKETPATH}/${logoId}`;
}

/**
 * League and tournament logos span two storage conventions: legacy rows hold a
 * bare filename that lived under `league-uploads/`, while uploads through the
 * presigned-URL flow store the full S3 key (folder included). The separator
 * tells them apart.
 */
export function getLeagueLogoUrl(logoId: string | undefined): string | undefined {
  if (!logoId) return undefined;
  // Some endpoints hand back an already-resolved public URL.
  if (/^https?:\/\//i.test(logoId)) return logoId;
  if (logoId.includes('/')) return `https://${BUCKETPATH}/${logoId}`;
  return `https://${BUCKETPATH}/league-uploads/${logoId}`;
}

export const ORGANIZER_NAME_MIN = 3;
export const ORGANIZER_NAME_MAX = 24;
const ORGANIZER_NAME_PATTERN = /^[\p{L}\p{N}](?:[^\p{C}]*[\p{L}\p{N}])?$/u;

export function isValidOrganizerName(name: string): boolean {
  const trimmed = name.trim();
  return (
    trimmed.length >= ORGANIZER_NAME_MIN &&
    trimmed.length <= ORGANIZER_NAME_MAX &&
    ORGANIZER_NAME_PATTERN.test(trimmed)
  );
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
