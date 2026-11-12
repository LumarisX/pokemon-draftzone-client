export interface StockIdentity {
  id: string;
  name: string;
  logo: string;
}

export interface IdentityPack {
  id: string;
  name: string;
  identities: StockIdentity[];
}

export interface SavedIdentity {
  id: string;
  name: string;
  logo: string | null;
}

export type TeamIdentityChoice =
  | { source: 'pack'; pack: string; id: string; name: string; logo: string }
  | { source: 'saved'; id: string; name: string; logo: string | null }
  | { source: 'custom'; name: string; logo: string | null };

export type TeamIdentityPayload =
  | { identity: { pack: string; id: string } }
  | { identity: { saved: string } }
  | { teamName: string; logo?: string };

const STOCK_LOGO_PREFIX = 'logo-packs/';

export function isStockLogo(logo: string | null | undefined): boolean {
  return !!logo && logo.startsWith(STOCK_LOGO_PREFIX);
}

export function isChoiceComplete(
  choice: TeamIdentityChoice | null | undefined,
): choice is TeamIdentityChoice {
  return !!choice && choice.name.trim().length > 0;
}

export function sameIdentity(
  a: { name: string; logo: string | null } | null | undefined,
  b: { name: string; logo: string | null } | null | undefined,
): boolean {
  return (
    !!a &&
    !!b &&
    a.name.trim() === b.name.trim() &&
    (a.logo ?? null) === (b.logo ?? null)
  );
}

export function identityPayload(
  choice: TeamIdentityChoice,
): TeamIdentityPayload {
  switch (choice.source) {
    case 'pack':
      return { identity: { pack: choice.pack, id: choice.id } };
    case 'saved':
      return { identity: { saved: choice.id } };
    case 'custom':
      return {
        teamName: choice.name.trim(),
        ...(choice.logo && !isStockLogo(choice.logo)
          ? { logo: choice.logo }
          : {}),
      };
  }
}
