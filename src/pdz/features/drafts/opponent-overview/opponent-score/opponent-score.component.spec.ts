import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { DraftService } from '../../draft-overview/draft.service';
import { ReplayService } from '../../../tools/replay_analyzer/replay.service';
import { OpponentScoreComponent } from './opponent-score.component';

/**
 * Focused coverage for buildScorePayload — the form-value -> ScorePatchDto
 * transform the server validates. Builds the reactive form via the component's
 * own initForm, patches stats without emitting (to avoid the winner-inference
 * side effects), then inspects the payload.
 */
describe('OpponentScoreComponent.buildScorePayload', () => {
  let component: OpponentScoreComponent;

  const matchup = {
    aTeam: {
      teamName: 'Team A',
      paste: '',
      team: [{ id: 'pikachu' }, { id: 'charizard' }],
    },
    bTeam: {
      teamName: 'Team B',
      paste: '',
      team: [{ id: 'gengar' }, { id: 'snorlax' }],
    },
    matches: [],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [OpponentScoreComponent],
      providers: [
        { provide: DraftService, useValue: { getMatchup: () => of(null), scoreMatchup: () => of(null) } },
        { provide: ReplayService, useValue: { analyzeReplay: () => of(null) } },
        { provide: Router, useValue: { navigate: () => Promise.resolve(true) } },
        {
          provide: ActivatedRoute,
          useValue: {
            parent: { snapshot: { paramMap: { get: () => 'team-1' } } },
            queryParams: of({}),
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(OpponentScoreComponent);
    component = fixture.componentInstance;
    component.matchup = matchup as any;
    (component as any).initForm();
  });

  function patchMon(side: 'aTeam' | 'bTeam', index: number, value: object) {
    const team = (component as any).matchesFormArray.controls[0].get(`${side}.team`);
    team.controls[index].patchValue(value, { emitEvent: false });
  }

  it('maps only brought Pokémon to stat tuples, translating fainted -> deaths', () => {
    patchMon('aTeam', 0, { brought: 1, kills: 2, indirect: 1, fainted: 0 });
    patchMon('aTeam', 1, { brought: 0 }); // not brought -> excluded
    patchMon('bTeam', 0, { brought: 1, kills: 0, indirect: 0, fainted: 1 });
    patchMon('bTeam', 1, { brought: 1, kills: 1, indirect: 0, fainted: 0 });

    const payload = (component as any).buildScorePayload();
    const match = payload.matches[0];

    expect(match.aTeam.stats).toEqual([
      ['pikachu', { kills: 2, deaths: 0, indirect: 1, brought: 1 }],
    ]);
    expect(match.bTeam.stats).toEqual([
      ['gengar', { kills: 0, deaths: 1, indirect: 0, brought: 1 }],
      ['snorlax', { kills: 1, deaths: 0, indirect: 0, brought: 1 }],
    ]);
  });

  it('sets score to the count of brought Pokémon that did not faint', () => {
    patchMon('aTeam', 0, { brought: 1, fainted: 0 });
    patchMon('aTeam', 1, { brought: 1, fainted: 1 });
    patchMon('bTeam', 0, { brought: 1, fainted: 1 });
    patchMon('bTeam', 1, { brought: 0 });

    const match = (component as any).buildScorePayload().matches[0];

    expect(match.aTeam.score).toBe(1); // pikachu alive, charizard fainted
    expect(match.bTeam.score).toBe(0); // gengar fainted, snorlax not brought
  });

  it('omits replay when blank and winner when undecided', () => {
    const match = (component as any).buildScorePayload().matches[0];

    expect('replay' in match).toBe(false);
    expect('winner' in match).toBe(false);
  });

  it('includes a trimmed replay and the winner when set', () => {
    const matchForm = (component as any).matchesFormArray.controls[0];
    matchForm.patchValue({ replay: '  https://replay.test/1  ', winner: 'b' });

    const match = (component as any).buildScorePayload().matches[0];

    expect(match.replay).toBe('https://replay.test/1');
    expect(match.winner).toBe('b');
  });
});
