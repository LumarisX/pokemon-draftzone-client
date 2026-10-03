import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import {
  BracketTeamFlex,
  FlexBracketMatch,
} from '@pdz/features/league-zone/league-bracket/bracket.model';
import { MatchCardComponent } from './match-card.component';

const teams: BracketTeamFlex[] = [
  { teamName: 'Dutch Dunsparces', coachName: 'Merlijn', seed: 1 },
  { teamName: 'Katana Paper Kutters', coachName: 'Aceman', seed: 2 },
];

function cardFor(
  match: FlexBracketMatch,
  allMatches: FlexBracketMatch[] = [match],
) {
  const fixture = TestBed.createComponent(MatchCardComponent);
  fixture.componentRef.setInput('match', match);
  fixture.componentRef.setInput('allMatches', allMatches);
  fixture.componentRef.setInput('teams', teams);
  fixture.componentRef.setInput('labels', new Map([['m13', 'Match 13']]));
  return fixture.componentInstance.card();
}

const seed = (n: number) => ({ type: 'seed' as const, seed: n });
const winnerOf = (from: string) => ({ type: 'winner' as const, from });

describe('MatchCardComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MatchCardComponent],
      providers: [provideRouter([])],
    });
  });

  it('shows a played winner with its score', () => {
    const card = cardFor({
      id: 'm',
      round: 0,
      position: 0,
      a: seed(1),
      b: seed(2),
      winner: 0,
      score: [2, 0],
    });

    expect(card.decided).toBe(true);
    expect(card.advanced).toBe(false);
    expect(card.slots[0].status).toBe('winner');
    expect(card.slots[1].status).toBe('loser');
    expect(card.slots[0].score).toBe(2);
  });

  it('shows an organizer-advanced side as the winner', () => {
    const stranded: FlexBracketMatch = {
      id: 'm13',
      round: 0,
      position: 0,
      a: seed(1),
      b: seed(2),
      advances: 'side1',
    };
    const card = cardFor(stranded);

    expect(card.decided).toBe(true);
    expect(card.slots[0].status).toBe('winner');
    expect(card.slots[1].status).toBe('loser');
  });

  it('labels an advancement as Advanced, not Forfeit', () => {
    const card = cardFor({
      id: 'm13',
      round: 0,
      position: 0,
      a: seed(1),
      b: seed(2),
      advances: 'side2',
    });

    expect(card.advanced).toBe(true);
    expect(card.forfeit).toBe(false);
  });

  it('prints no score for a side advanced without a result', () => {
    const card = cardFor({
      id: 'm13',
      round: 0,
      position: 0,
      a: seed(1),
      b: seed(2),
      advances: 'side1',
      score: [0, 0],
    });

    expect(card.slots[0].score).toBeNull();
    expect(card.slots[1].score).toBeNull();
  });

  it('keeps a forfeit win labelled as a forfeit', () => {
    const card = cardFor({
      id: 'm',
      round: 0,
      position: 0,
      a: seed(1),
      b: seed(2),
      winner: 1,
      forfeit: true,
      score: [0, 3],
    });

    expect(card.forfeit).toBe(true);
    expect(card.advanced).toBe(false);
    expect(card.slots[1].status).toBe('winner');
  });

  it('leaves a match nobody advances out of undecided', () => {
    const card = cardFor({
      id: 'm13',
      round: 0,
      position: 0,
      a: seed(1),
      b: seed(2),
      advances: 'none',
    });

    expect(card.decided).toBe(false);
    expect(card.slots[0].status).toBe('undecided');
    expect(card.slots[1].status).toBe('undecided');
  });

  it('names a slot fed by a match that advances nobody', () => {
    const card = cardFor(
      { id: 'm21', round: 1, position: 0, a: winnerOf('m13'), b: seed(1) },
      [
        {
          id: 'm13',
          round: 0,
          position: 0,
          a: seed(2),
          b: seed(2),
          advances: 'none',
        },
        { id: 'm21', round: 1, position: 0, a: winnerOf('m13'), b: seed(1) },
      ],
    );

    expect(card.slots[0].name).toBe('No winner from Match 13');
    expect(card.slots[0].pending).toBe(true);
  });
});
