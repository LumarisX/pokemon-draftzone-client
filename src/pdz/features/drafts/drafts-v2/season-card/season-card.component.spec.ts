import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Season } from '../drafts-v2.model';
import { SeasonCardComponent } from './season-card.component';

const SEASON: Season = {
  id: 'draft.test',
  kind: 'draft',
  status: 'active',
  name: 'Test League',
  teamName: 'Test Team',
  format: 'Singles',
  ruleset: 'Gen 9 NatDex',
  record: { wins: 2, losses: 1, diff: 4 },
  unresolved: 0,
  roster: [
    { id: 'garchomp', name: 'Garchomp' },
    { id: 'dragapult', name: 'Dragapult' },
  ],
  source: { type: 'draft', slug: 'test' },
};

@Component({
  imports: [SeasonCardComponent],
  template: `<button pdz-season-card [season]="season()"></button>`,
})
class HostComponent {
  readonly season = signal(SEASON);
}

describe('SeasonCardComponent', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('renders a resolved sprite image for every roster slot', () => {
    const images = [
      ...fixture.nativeElement.querySelectorAll('img'),
    ] as HTMLImageElement[];

    expect(images.length).toBe(2);
    expect(images.map((image) => image.getAttribute('src'))).toEqual([
      'https://play.pokemonshowdown.com/sprites/home/garchomp.png',
      'https://play.pokemonshowdown.com/sprites/home/dragapult.png',
    ]);
  });
});
