import {
  identityPayload,
  isChoiceComplete,
  sameIdentity,
} from './team-identity.model';

describe('identityPayload', () => {
  it('sends a pack identity by reference only', () => {
    expect(
      identityPayload({
        source: 'pack',
        pack: 'starter',
        id: 'sinnoh-jazz',
        name: 'Sinnoh Jazz',
        logo: 'logo-packs/starter/sinnoh-jazz.webp',
      }),
    ).toEqual({ identity: { pack: 'starter', id: 'sinnoh-jazz' } });
  });

  it('sends a saved team by reference only', () => {
    expect(
      identityPayload({
        source: 'saved',
        id: 'abc',
        name: 'Old Owls',
        logo: 'team-logos/owls.png',
      }),
    ).toEqual({ identity: { saved: 'abc' } });
  });

  it('sends a custom name with its own upload', () => {
    expect(
      identityPayload({
        source: 'custom',
        name: 'Sturdy Shedinjas',
        logo: 'team-logos/new.png',
      }),
    ).toEqual({ teamName: 'Sturdy Shedinjas', logo: 'team-logos/new.png' });
  });

  it('never sends a stock logo as a custom upload', () => {
    expect(
      identityPayload({
        source: 'custom',
        name: 'Renamed',
        logo: 'logo-packs/starter/sinnoh-jazz.webp',
      }),
    ).toEqual({ teamName: 'Renamed' });
  });
});

describe('isChoiceComplete', () => {
  it('needs a name that is not blank', () => {
    expect(isChoiceComplete(null)).toBe(false);
    expect(isChoiceComplete({ source: 'custom', name: '  ', logo: null })).toBe(false);
    expect(isChoiceComplete({ source: 'custom', name: 'A', logo: null })).toBe(true);
  });
});

describe('sameIdentity', () => {
  it('matches on name and logo whatever the source', () => {
    expect(
      sameIdentity(
        { name: 'Sinnoh Jazz', logo: 'logo-packs/starter/sinnoh-jazz.webp' },
        { name: 'Sinnoh Jazz ', logo: 'logo-packs/starter/sinnoh-jazz.webp' },
      ),
    ).toBe(true);
    expect(
      sameIdentity({ name: 'A', logo: null }, { name: 'A', logo: 'team-logos/a.png' }),
    ).toBe(false);
  });
});
