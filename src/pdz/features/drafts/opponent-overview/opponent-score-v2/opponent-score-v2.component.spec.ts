import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { ReplayService } from '@pdz/features/tools/replay_analyzer/replay.service';
import { DraftService } from '@pdz/features/drafts/draft-overview/draft.service';
import {
  Match,
  Matchup,
} from '@pdz/features/drafts/matchup-overview/matchup.model';
import { OpponentScoreV2Component } from './opponent-score-v2.component';
import { koKey, linkKo } from './ko-graph.model';

const a = (id: string) => koKey('side1', id);
const b = (id: string) => koKey('side2', id);

function roster(...ids: string[]) {
  return ids.map((id) => ({ id, name: id }));
}

function matchupWith(matches: Match[] = []): Matchup {
  return {
    _id: 'matchup-1',
    leagueName: 'Spring Cup',
    stage: 'Round 1',
    matches,
    score: null,
    aTeam: {
      teamName: 'Team A',
      paste: '',
      team: roster('pikachu', 'charizard', 'garchomp', 'rotomwash', 'toxapex'),
    },
    bTeam: {
      teamName: 'Team B',
      paste: '',
      team: roster('gengar', 'snorlax', 'dragapult'),
    },
  } as unknown as Matchup;
}

describe('OpponentScoreV2Component', () => {
  let component: any;

  function setup(matchup: Matchup = matchupWith()) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [OpponentScoreV2Component],
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

    component = TestBed.createComponent(OpponentScoreV2Component)
      .componentInstance;
    component.ngOnInit();
  }

  function payload() {
    return component.buildPayload(component.matchup());
  }

  it('opens the team sheets for a matchup with nothing entered', () => {
    setup();

    expect(component.sheets()).toEqual({ side1: [], side2: [] });
    expect(component.editingSheets()).toBe(true);
    expect(payload().matches[0].aTeam.stats).toEqual([]);
  });

  it('stores every sheet Pokémon in every game and leaves the rest of the roster out', () => {
    setup();
    component.setSheets({
      side1: [a('pikachu'), a('garchomp')],
      side2: [b('gengar')],
    });
    component.addGame();
    component.setGraph(0, linkKo(component.games()[0].graph, a('pikachu'), b('gengar')));

    const [first, second] = payload().matches;

    expect(first.aTeam.stats).toEqual([
      ['pikachu', { kills: 1, indirect: 0, teammate: 0, status: 'survived' }],
      ['garchomp', { kills: 0, indirect: 0, teammate: 0, status: 'brought' }],
    ]);
    expect(first.bTeam.stats).toEqual([
      ['gengar', { kills: 0, indirect: 0, teammate: 0, status: 'fainted' }],
    ]);
    expect(first.kos).toEqual([
      {
        victim: { team: 'b', pokemon: 'gengar' },
        attacker: { team: 'a', pokemon: 'pikachu' },
        indirect: false,
      },
    ]);
    expect(second.aTeam.stats.map(([id, stat]: any) => [id, stat.status])).toEqual([
      ['pikachu', 'brought'],
      ['garchomp', 'brought'],
    ]);
    expect(second.kos).toEqual([]);
  });

  it('builds the sheet from every game a classic save recorded, in roster order', () => {
    setup(
      matchupWith([
        {
          aTeam: {
            score: 1,
            stats: [['garchomp', { kills: 2, status: 'survived' }]],
          },
          bTeam: { score: 0, stats: [['gengar', { status: 'fainted' }]] },
        },
        {
          aTeam: {
            score: 1,
            stats: [['pikachu', { kills: 1, status: 'survived' }]],
          },
          bTeam: { score: 0, stats: [['snorlax', { status: 'fainted' }]] },
        },
      ]),
    );

    expect(component.sheets()).toEqual({
      side1: [a('pikachu'), a('garchomp')],
      side2: [b('gengar'), b('snorlax')],
    });
    expect(component.editingSheets()).toBe(false);
  });

  it('keeps classic KO counts until an arrow is drawn, then counts only the arrows', () => {
    setup(
      matchupWith([
        {
          aTeam: {
            score: 1,
            stats: [['pikachu', { kills: 2, indirect: 1, status: 'survived' }]],
          },
          bTeam: { score: 0, stats: [['gengar', { status: 'fainted' }]] },
        },
      ]),
    );

    let match = payload().matches[0];
    expect(match.kos).toBeUndefined();
    expect(match.aTeam.stats[0][1]).toMatchObject({ kills: 2, indirect: 1 });

    component.setGraph(0, linkKo(component.games()[0].graph, a('pikachu'), b('gengar')));

    match = payload().matches[0];
    expect(match.kos).toHaveLength(1);
    expect(match.aTeam.stats[0][1]).toMatchObject({ kills: 1, indirect: 0 });
  });

  it('brings back the arrows a KO map saved', () => {
    const kos = [
      {
        victim: { team: 'b' as const, pokemon: 'gengar' },
        attacker: { team: 'a' as const, pokemon: 'pikachu' },
        indirect: true,
        note: 'Toxic',
      },
    ];
    setup(
      matchupWith([
        {
          aTeam: {
            score: 1,
            stats: [['pikachu', { indirect: 1, status: 'survived' }]],
          },
          bTeam: { score: 0, stats: [['gengar', { status: 'fainted' }]] },
          kos,
        },
      ]),
    );

    expect(component.games()[0].graph.edges).toEqual([
      { from: a('pikachu'), to: b('gengar'), indirect: true, note: 'Toxic' },
    ]);
    expect(payload().matches[0].kos).toEqual(kos);
  });

  it('drops a Pokémon taken off the sheet from every game, arrows included', () => {
    setup();
    component.setSheets({ side1: [a('pikachu')], side2: [b('gengar')] });
    component.setGraph(0, linkKo(component.games()[0].graph, a('pikachu'), b('gengar')));

    component.setSheets({ side1: [a('pikachu')], side2: [] });

    expect(component.games()[0].graph.edges).toEqual([]);
    expect(payload().matches[0].bTeam.stats).toEqual([]);
  });

  it('lets an edited game pick its own winner instead of the saved one', () => {
    setup(
      matchupWith([
        {
          aTeam: { score: 1, stats: [['pikachu', { status: 'survived' }]] },
          bTeam: { score: 0, stats: [['gengar', { status: 'fainted' }]] },
          winner: 'a',
        },
      ]),
    );
    const game = component.games()[0];
    expect(component.gameWinner(game)).toBe('side1');

    component.setGraph(0, linkKo(game.graph, b('gengar'), a('pikachu')));

    expect(component.gameWinner(component.games()[0])).toBeNull();
  });
});
