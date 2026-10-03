import { ComponentFixture, TestBed } from '@angular/core/testing';
import { League } from '@pdz/features/league-zone/league.interface';
import { PokemonStandingsComponent } from './pokemon-standings.component';

function standing(
  id: string,
  teamName: string,
  kills: number,
  deaths: number,
): League.PokemonStanding {
  return {
    id,
    name: id,
    teamName,
    coach: `${teamName} coach`,
    record: { brought: 1, kills, deaths, diff: kills - deaths },
  } as League.PokemonStanding;
}

describe('PokemonStandingsComponent', () => {
  let component: PokemonStandingsComponent;
  let fixture: ComponentFixture<PokemonStandingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PokemonStandingsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PokemonStandingsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('standingData', [
      standing('pikachu', 'Team A', 1, 3),
      standing('eevee', 'Team B', 4, 0),
      standing('pikachu', 'Team B', 2, 0),
    ]);
    fixture.detectChanges();
  });

  it('sorts by differential, best first', () => {
    expect(component.rows().map((row) => row.record.diff)).toEqual([4, 2, -2]);
  });

  it('flips direction when the same column is sorted ascending', () => {
    component.onSort({ active: 'kills', direction: 'asc' });
    expect(component.rows().map((row) => row.record.kills)).toEqual([1, 2, 4]);
  });

  it('merges a Pokémon across teams when combining', () => {
    component.combineTeams.set(true);
    const pikachu = component.rows().find((row) => row.id === 'pikachu');
    expect(pikachu?.record).toEqual({
      brought: 2,
      kills: 3,
      deaths: 3,
      diff: 0,
    });
    expect(pikachu?.teamName).toBe('2 Teams');
  });
});
