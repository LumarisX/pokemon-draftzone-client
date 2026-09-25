import { isReplayUrl, toReplayLink } from './score-entry.model';

describe('toReplayLink', () => {
  it('adds https to a link pasted without a protocol', () => {
    expect(toReplayLink('replay.pokemonshowdown.com/gen9ou-1')).toBe(
      'https://replay.pokemonshowdown.com/gen9ou-1',
    );
  });

  it('upgrades an http link to https', () => {
    expect(toReplayLink(' http://replay.pokemonshowdown.com/gen9ou-1 ')).toBe(
      'https://replay.pokemonshowdown.com/gen9ou-1',
    );
  });

  it('keeps an https link as it is', () => {
    expect(toReplayLink('https://replay.pokemonshowdown.com/gen9ou-1')).toBe(
      'https://replay.pokemonshowdown.com/gen9ou-1',
    );
  });

  it('sends nothing for a blank link', () => {
    expect(toReplayLink('   ')).toBeUndefined();
    expect(toReplayLink('https://')).toBeUndefined();
  });

  it('produces a link isReplayUrl still accepts', () => {
    expect(
      isReplayUrl(toReplayLink('replay.pokemonshowdown.com/gen9ou-1')!),
    ).toBe(true);
  });
});
