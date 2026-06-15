import { ActivatedRouteSnapshot, CanActivateFn } from '@angular/router';

const TRUSTED_DOMAINS = ['pokemondraftzone.com'];

const isTrustedDomain = (hostname: string): boolean => {
  const target = hostname.toLowerCase();
  const localHost = window.location.hostname.toLowerCase();
  const allowlist = [localHost, ...TRUSTED_DOMAINS];

  return allowlist.some(
    (domain) => target === domain || target.endsWith(`.${domain}`),
  );
};

export const externalLinkBypassGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
) => {
  const urlParam = route.queryParamMap.get('url');
  if (!urlParam) return true;

  try {
    const decoded = decodeURIComponent(urlParam);
    const parsedUrl = new URL(decoded);
    const isWebUrl = ['http:', 'https:'].includes(parsedUrl.protocol);

    if (isWebUrl && isTrustedDomain(parsedUrl.hostname)) {
      window.location.replace(parsedUrl.toString());
      return false;
    }
  } catch {
    return true;
  }

  return true;
};
