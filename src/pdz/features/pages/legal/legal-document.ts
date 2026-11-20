export const LEGAL_CONTACT_EMAIL = 'pokemondraftzone@outlook.com';

export type LegalBlock =
  | { kind: 'p'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'contact'; text: string };

export interface LegalSection {
  id: string;
  label: string;
  blocks: LegalBlock[];
}

export interface LegalDocument {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}

export type LegalDocumentKey = 'privacy' | 'terms';
