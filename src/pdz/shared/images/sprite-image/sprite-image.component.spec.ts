import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SpriteService } from '@pdz/core/services/sprite.service';
import { SettingsService } from '@pdz/layout/top-navbar/settings.service';
import { BehaviorSubject } from 'rxjs';
import { SpriteImageComponent } from './sprite-image.component';

@Component({
  imports: [SpriteImageComponent],
  template: `<pdz-sprite-image
    [pokemon]="pokemon()"
    [flipped]="flipped()"
    [disabled]="disabled()"
    (loadedEvent)="loads = loads + 1"
  />`,
})
class HostComponent {
  pokemon = signal<{ id: string; name: string; shiny?: boolean }>({
    id: 'magearnaoriginalmega',
    name: 'Mega Magearna-Original',
  });
  flipped = signal(false);
  disabled = signal(false);
  loads = 0;
}

const UNKNOWN = '../../../../assets/icons/unknown.svg';

describe('SpriteImageComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let settings: BehaviorSubject<{ spriteSet?: string | null }>;

  const img = () => fixture.nativeElement.querySelector('img') as HTMLImageElement;
  const src = () => img().getAttribute('src');
  const error = () => {
    img().dispatchEvent(new Event('error'));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    settings = new BehaviorSubject<{ spriteSet?: string | null }>({
      spriteSet: 'home',
    });
    const settingsSignal = signal(settings.value);
    settings.subscribe((value) => settingsSignal.set(value));
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        {
          provide: SettingsService,
          useValue: {
            settingsData$: settings,
            settings: settingsSignal,
            get settingsData() {
              return settings.value;
            },
            get settings$() {
              return settings.asObservable();
            },
          },
        },
        SpriteService,
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('starts on the primary sprite for the selected set', () => {
    expect(src()).toBe(
      'https://play.pokemonshowdown.com/sprites/home/magearna-original-mega.png',
    );
  });

  it('walks the full fallback chain on repeated errors, then stops at unknown', () => {
    expect(src()).toContain('/home/magearna-original-mega.png');
    error();
    expect(src()).toContain('/gen5/magearna-original-mega.png');
    error();
    expect(src()).toContain('/home/magearna-original.png');
    error();
    expect(src()).toContain('/home/magearna.png');
    error();
    expect(src()).toBe(UNKNOWN);
    error();
    expect(src()).toBe(UNKNOWN);
  });

  it('restarts the chain when the pokemon changes', () => {
    error();
    error();
    expect(src()).toContain('/home/magearna-original.png');

    host.pokemon.set({ id: 'pikachu', name: 'Pikachu' });
    fixture.detectChanges();
    expect(src()).toBe(
      'https://play.pokemonshowdown.com/sprites/home/pikachu.png',
    );
  });

  it('restarts the chain and re-resolves when the sprite set changes', () => {
    error();
    expect(src()).toContain('/gen5/magearna-original-mega.png');

    settings.next({ spriteSet: 'ani' });
    fixture.detectChanges();
    expect(src()).toBe(
      'https://play.pokemonshowdown.com/sprites/ani/magearna-original-mega.gif',
    );
  });

  it('applies shiny paths', () => {
    host.pokemon.set({ id: 'pikachu', name: 'Pikachu', shiny: true });
    fixture.detectChanges();
    expect(src()).toBe(
      'https://play.pokemonshowdown.com/sprites/home-shiny/pikachu.png',
    );
  });

  it('reacts to flipped and disabled without touching the chain', () => {
    const before = src();
    host.disabled.set(true);
    fixture.detectChanges();
    expect(img().className).toContain('disabled');
    expect(src()).toBe(before);

    host.flipped.set(true);
    fixture.detectChanges();
    expect(img().className).toContain('flip');
    expect(src()).toBe(before);
  });

  it('drops the flip class once it falls through to the unknown sprite', () => {
    host.pokemon.set({ id: 'ivysaur', name: 'Ivysaur' });
    host.flipped.set(false);
    fixture.detectChanges();
    expect(img().className).toContain('flip');

    while (src() !== UNKNOWN) error();
    expect(img().className).not.toContain('flip');
  });

  it('emits loadedEvent when the image loads', () => {
    expect(host.loads).toBe(0);
    img().dispatchEvent(new Event('load'));
    fixture.detectChanges();
    expect(host.loads).toBe(1);
  });

  it('renders nothing for an empty id', () => {
    host.pokemon.set({ id: '', name: '' });
    fixture.detectChanges();
    expect(img()).toBeNull();
  });
});
