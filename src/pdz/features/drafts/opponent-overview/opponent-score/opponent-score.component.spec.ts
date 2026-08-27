import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import {
  rosterEntries,
  setKills,
  setPokemonStatus,
} from '@pdz/shared/widgets/score-entry/score-entry.form';
import { ScoreEntrySide } from '@pdz/shared/widgets/score-entry/score-entry.model';
import { ReplayService } from '../../../tools/replay_analyzer/replay.service';
import { DraftService } from '../../draft-overview/draft.service';
import { Matchup } from '../../matchup-overview/matchup.model';
import { OpponentScoreComponent } from './opponent-score.component';

const baseMatchup = {
  _id: 'matchup-1',
  leagueName: 'Spring Cup',
  stage: 'Round 1',
  matches: [],
  score: null,
  aTeam: {
    teamName: 'Team A',
    paste: '',
    team: [
      { id: 'pikachu', name: 'Pikachu' },
      { id: 'charizard', name: 'Charizard' },
    ],
  },
  bTeam: {
    teamName: 'Team B',
    paste: '',
    team: [
      { id: 'gengar', name: 'Gengar' },
      { id: 'snorlax', name: 'Snorlax' },
    ],
  },
} as unknown as Matchup;

describe('OpponentScoreComponent', () => {
  let component: OpponentScoreComponent;

  function setup(matchup: Matchup = baseMatchup) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [OpponentScoreComponent],
      providers: [
        {
          provide: DraftService,
          useValue: {
            getMatchup: () => of(matchup),
            scoreMatchup: () => of(null),
          },
        },
        {
          provide: ReplayService,
          useValue: { analyzeReplayV2: () => of(null) },
        },
        {
          provide: Router,
          useValue: { navigate: () => Promise.resolve(true) },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            parent: { snapshot: { paramMap: { get: () => 'team-1' } } },
            queryParams: of({ matchup: 'matchup-1' }),
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(OpponentScoreComponent);
    component = fixture.componentInstance;
    component.ngOnInit();
    return component;
  }

  function mon(side: ScoreEntrySide, index: number, gameIndex = 0) {
    return rosterEntries(component.gameControls[gameIndex], side)[index];
  }

  function payload() {
    return (component as any).buildPayload();
  }

  function typeMatchScore(value: string) {
    component.onMatchScoreInput({
      target: { value },
    } as unknown as Event);
  }

  beforeEach(() => setup());

  it('starts with one empty game covering both drafted teams', () => {
    expect(component.gameControls.length).toBe(1);
    expect(
      rosterEntries(component.gameControls[0], 'side1').map(
        (entry) => entry.controls.id.value,
      ),
    ).toEqual(['pikachu', 'charizard']);
  });

  it('sends a status and all three kill buckets per Pokemon, skipping benched ones', () => {
    const game = component.gameControls[0];
    setPokemonStatus(mon('side1', 0), 'survived', game, 'side1');
    setKills(mon('side1', 0), 'direct', 2, game, 'side1');
    setKills(mon('side1', 0), 'indirect', 1, game, 'side1');
    setPokemonStatus(mon('side2', 0), 'fainted', game, 'side2');
    setPokemonStatus(mon('side2', 1), 'brought', game, 'side2');

    const match = payload().matches[0];

    expect(match.aTeam.stats).toEqual([
      ['pikachu', { kills: 2, indirect: 1, teammate: 0, status: 'survived' }],
    ]);
    expect(match.bTeam.stats).toEqual([
      ['gengar', { kills: 0, indirect: 0, teammate: 0, status: 'fainted' }],
      ['snorlax', { kills: 0, indirect: 0, teammate: 0, status: 'brought' }],
    ]);
  });

  it('scores each game by survivors unless the score is typed in', () => {
    const game = component.gameControls[0];
    setPokemonStatus(mon('side1', 0), 'survived', game, 'side1');
    setPokemonStatus(mon('side1', 1), 'fainted', game, 'side1');

    expect(payload().matches[0].aTeam.score).toBe(1);

    game.controls.side1ScoreLocked.setValue(true);
    game.controls.side1Score.setValue(4);

    expect(payload().matches[0].aTeam.score).toBe(4);
  });

  it('omits a blank replay and an undecided winner', () => {
    const match = payload().matches[0];

    expect('replay' in match).toBe(false);
    expect('winner' in match).toBe(false);
  });

  it('trims the replay link and maps side keys back to a/b', () => {
    component.gameControls[0].patchValue({
      link: '  replay.pokemonshowdown.com/gen9-1  ',
      winner: 'side2',
    });

    const match = payload().matches[0];

    expect(match.replay).toBe('replay.pokemonshowdown.com/gen9-1');
    expect(match.winner).toBe('b');
  });

  it('infers a single-game match score from that game, and a match from wins', () => {
    const game = component.gameControls[0];
    setPokemonStatus(mon('side1', 0), 'survived', game, 'side1');
    setPokemonStatus(mon('side1', 1), 'survived', game, 'side1');

    expect(component.inferredMatchScore()).toEqual([2, 0]);

    component.addGame();
    component.gameControls[0].controls.winner.setValue('side1');
    component.gameControls[1].controls.winner.setValue('side2');

    expect(component.inferredMatchScore()).toEqual([1, 1]);
  });

  it('sends no match override until the score or winner is set by hand', () => {
    const game = component.gameControls[0];
    setPokemonStatus(mon('side1', 0), 'survived', game, 'side1');

    expect(payload().scoreOverride).toBeNull();
    expect(payload().winnerOverride).toBeNull();
  });

  it('sends the match score override once typed in, and drops it on reset', () => {
    typeMatchScore('3');
    component.form!.controls.matchScore1.setValue(3);
    component.form!.controls.matchScore2.setValue(2);

    expect(payload().scoreOverride).toEqual([3, 2]);

    component.resetMatchScore();
    expect(payload().scoreOverride).toBeNull();
  });

  it('goes back to the inferred score when a match score is cleared', () => {
    const game = component.gameControls[0];
    setPokemonStatus(mon('side1', 0), 'survived', game, 'side1');

    typeMatchScore('9');
    component.form!.controls.matchScore1.setValue(9);
    expect(payload().scoreOverride).toEqual([9, 0]);

    typeMatchScore('');
    component.form!.controls.matchScore1.setValue(null as never);
    component.onMatchScoreBlur('side1');

    expect(payload().scoreOverride).toBeNull();
    expect(component.matchScore('side1')).toBe(1);
  });

  it('sends the match winner override and reports it back as the winner', () => {
    const game = component.gameControls[0];
    setPokemonStatus(mon('side1', 0), 'survived', game, 'side1');
    expect(component.inferredMatchWinner()).toBe('side1');

    component.setMatchWinner('side2');

    expect(component.matchWinner()).toBe('side2');
    expect(payload().winnerOverride).toBe('b');

    component.clearMatchWinner();
    expect(component.matchWinner()).toBe('side1');
    expect(payload().winnerOverride).toBeNull();
  });

  it('warns without blocking when the set winner contradicts the score', () => {
    const game = component.gameControls[0];
    setPokemonStatus(mon('side1', 0), 'survived', game, 'side1');
    game.controls.winner.setValue('side1');
    component.setMatchWinner('side2');

    expect(component.matchWarnings()).toContain(
      'Team B is set as the winner but Team A has the higher score.',
    );
    expect(() => payload()).not.toThrow();
  });

  it('treats a regular match as no forfeit', () => {
    expect(component.isForfeit()).toBe(false);
    expect(payload().forfeitedBy).toBeNull();
  });

  it('toggles a side on and back off through the forfeit button', () => {
    component.toggleForfeit('side1');
    expect(component.hasForfeited('side1')).toBe(true);
    expect(payload().forfeitedBy).toBe('a');

    component.toggleForfeit('side1');
    expect(component.hasForfeited('side1')).toBe(false);
    expect(payload().forfeitedBy).toBeNull();
  });

  it('awards the win to the other team when one side forfeits', () => {
    component.toggleForfeit('side1');

    expect(payload().forfeitedBy).toBe('a');
    expect(component.matchWinner()).toBe('side2');
    expect(component.matchWarnings()).toEqual([
      'Team B wins by forfeit. The games below are ignored.',
    ]);

    component.toggleForfeit('side1');
    component.toggleForfeit('side2');

    expect(payload().forfeitedBy).toBe('b');
    expect(component.matchWinner()).toBe('side1');
  });

  it('leaves a double forfeit with no winner and calls it a loss for both', () => {
    component.toggleForfeit('side1');
    component.toggleForfeit('side2');

    expect(payload().forfeitedBy).toBe('both');
    expect(component.isDoubleForfeit()).toBe(true);
    expect(component.matchWinner()).toBeNull();
    expect(component.matchWarnings()).toEqual([
      'Both teams forfeited. This counts as a loss for both.',
    ]);
  });

  it('will not let a manual winner override a forfeit', () => {
    component.toggleForfeit('side1');

    component.setMatchWinner('side1');

    expect(component.matchWinner()).toBe('side2');
  });

  it('restores both checkboxes from a saved double forfeit', () => {
    setup({ ...baseMatchup, forfeitedBy: 'both' } as unknown as Matchup);

    expect(component.hasForfeited('side1')).toBe(true);
    expect(component.hasForfeited('side2')).toBe(true);
  });

  it('warns about games with no winner picked', () => {
    component.addGame();
    component.gameControls[0].controls.winner.setValue('side1');

    expect(
      component
        .matchWarnings()
        .some((warning) => warning.startsWith('No winner picked for game 2')),
    ).toBe(true);
  });

  it('rehydrates saved statuses, kills, and overrides', () => {
    setup({
      ...baseMatchup,
      scoreOverride: [2, 1],
      winnerOverride: 'b',
      matches: [
        {
          replay: 'replay.pokemonshowdown.com/gen9-1',
          winner: 'a',
          aTeam: {
            score: 1,
            stats: [
              [
                'pikachu',
                {
                  kills: 2,
                  indirect: 1,
                  teammate: 0,
                  status: 'survived' as const,
                },
              ],
            ],
          },
          bTeam: {
            score: 0,
            stats: [['gengar', { kills: 0, status: 'fainted' as const }]],
          },
        },
      ],
    } as unknown as Matchup);

    expect(component.gameControls[0].controls.link.value).toBe(
      'replay.pokemonshowdown.com/gen9-1',
    );
    expect(component.gameControls[0].controls.winner.value).toBe('side1');
    expect(mon('side1', 0).controls.direct.value).toBe(2);
    expect(mon('side1', 0).controls.status.value).toBe('survived');
    expect(mon('side1', 1).controls.status.value).toBeNull();
    expect(component.matchScore('side1')).toBe(2);
    expect(component.matchWinner()).toBe('side2');
  });

  it('reads legacy brought/deaths flags as statuses', () => {
    setup({
      ...baseMatchup,
      matches: [
        {
          aTeam: {
            score: 1,
            stats: [
              ['pikachu', { kills: 1, brought: 1, deaths: 0 }],
              ['charizard', { brought: 1, deaths: 1 }],
            ],
          },
          bTeam: { score: 0, stats: [] },
        },
      ],
    } as unknown as Matchup);

    expect(mon('side1', 0).controls.status.value).toBe('survived');
    expect(mon('side1', 1).controls.status.value).toBe('fainted');
  });
});
