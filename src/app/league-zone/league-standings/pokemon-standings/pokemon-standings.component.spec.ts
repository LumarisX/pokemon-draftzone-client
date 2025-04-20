import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PokemonStandingsComponent } from './pokemon-standings.component';

describe('PokemonStandingsComponent', () => {
  let component: PokemonStandingsComponent;
  let fixture: ComponentFixture<PokemonStandingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PokemonStandingsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PokemonStandingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
