import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DraftOptions, Pokemon } from '@pdz/core/utils/pokemon';
import { SettingsService } from '@pdz/layout/top-navbar/settings.service';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { BehaviorSubject } from 'rxjs';
import { PokemonAlign, PokemonComponent, PokemonSize } from './pokemon.component';

@Component({
  imports: [PokemonComponent],
  template: `<pdz-pokemon
    [pokemon]="pokemon()"
    [size]="size()"
    [align]="align()"
    [tier]="tier()"
    [cost]="cost()"
  />`,
})
class HostComponent {
  pokemon = signal<Pokemon<DraftOptions>>({ id: 'garchomp', name: 'Garchomp' });
  size = signal<PokemonSize>('row');
  align = signal<PokemonAlign>('start');
  tier = signal<string | null>(null);
  cost = signal<number | null>(null);
}

describe('PokemonComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const el = (): HTMLElement => fixture.nativeElement.querySelector('pdz-pokemon');
  const detail = (): HTMLElement | null => el().querySelector('.pdz-pokemon__detail');
  const sprite = (): SpriteComponent =>
    fixture.debugElement.query((node) => node.componentInstance instanceof SpriteComponent)
      .componentInstance;

  beforeEach(async () => {
    const settings = new BehaviorSubject<{ spriteSet?: string | null }>({ spriteSet: 'home' });
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        {
          provide: SettingsService,
          useValue: {
            settingsData$: settings,
            settings: signal(settings.value),
            get settingsData() {
              return settings.value;
            },
            get settings$() {
              return settings.asObservable();
            },
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('shows the name and no detail line without tier, cost or types', () => {
    expect(el().querySelector('.pdz-pokemon__name')?.textContent?.trim()).toBe('Garchomp');
    expect(detail()).toBeNull();
  });

  it('puts tier and cost with a unit on the detail line', () => {
    host.tier.set('OU');
    host.cost.set(18);
    fixture.detectChanges();
    const parts = Array.from(detail()!.children).map((part) => part.textContent?.trim());
    expect(parts).toEqual(['OU', '18 pts']);
  });

  it('keeps a zero cost', () => {
    host.cost.set(0);
    fixture.detectChanges();
    expect(detail()?.textContent).toContain('0');
  });

  it('drops the detail line inline', () => {
    host.size.set('inline');
    host.tier.set('OU');
    fixture.detectChanges();
    expect(detail()).toBeNull();
  });

  it('faces the sprite toward the name on either side', () => {
    expect(sprite().flipped()).toBe(true);
    host.align.set('end');
    fixture.detectChanges();
    expect(sprite().flipped()).toBe(false);
  });

  it('marks each captain role after the name', () => {
    host.pokemon.set({
      id: 'garchomp',
      name: 'Garchomp',
      capt: { tera: ['Steel', 'Fire'], dmax: true },
    });
    fixture.detectChanges();
    const labels = Array.from(el().querySelectorAll('.pdz-pokemon__captain [aria-label]')).map(
      (icon) => icon.getAttribute('aria-label'),
    );
    expect(labels).toEqual(['Tera captain', 'Dynamax captain']);
  });
});
