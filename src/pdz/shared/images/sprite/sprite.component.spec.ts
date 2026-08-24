import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Pokemon, DraftOptions } from '@pdz/core/utils/pokemon';
import { SettingsService } from '@pdz/layout/top-navbar/settings.service';
import { BehaviorSubject } from 'rxjs';
import { SpriteComponent } from './sprite.component';

@Component({
  imports: [SpriteComponent],
  template: `<pdz-sprite
    [pokemon]="pokemon()"
    [interactive]="interactive()"
    [(formeIndex)]="formeIndex"
  />`,
})
class HostComponent {
  pokemon = signal<Pokemon<DraftOptions>>({
    id: 'charizard',
    name: 'Charizard',
    draftFormes: [
      { id: 'charizardmegax', name: 'Mega Charizard X' },
      { id: 'charizardmegay', name: 'Mega Charizard Y' },
    ],
  });
  interactive = signal(true);
  formeIndex = signal(0);
}

describe('SpriteComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const stack = (): HTMLElement =>
    fixture.nativeElement.querySelector('.forme-stack');
  const key = (k: string) => {
    stack().dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    const settings = new BehaviorSubject<{ spriteSet?: string | null }>({
      spriteSet: 'home',
    });
    const settingsSignal = signal(settings.value);
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
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('exposes the stack as a focusable button when interactive', () => {
    expect(stack().getAttribute('role')).toBe('button');
    expect(stack().getAttribute('tabindex')).toBe('0');
    expect(stack().getAttribute('aria-label')).toBe('Charizard, forme 1 of 3');
  });

  it('drops role, tabindex and label when not interactive', () => {
    host.interactive.set(false);
    fixture.detectChanges();
    expect(stack().getAttribute('role')).toBeNull();
    expect(stack().getAttribute('tabindex')).toBeNull();
    expect(stack().getAttribute('aria-label')).toBeNull();
  });

  it('cycles forward on Enter, Space, ArrowRight and ArrowDown', () => {
    for (const k of ['Enter', ' ', 'ArrowRight', 'ArrowDown']) {
      const before = host.formeIndex();
      key(k);
      expect(host.formeIndex()).toBe((before + 1) % 3);
    }
  });

  it('cycles backward on ArrowLeft and ArrowUp', () => {
    key('ArrowLeft');
    expect(host.formeIndex()).toBe(2);
    key('ArrowUp');
    expect(host.formeIndex()).toBe(1);
  });

  it('ignores unrelated keys and keys when non-interactive', () => {
    key('Tab');
    expect(host.formeIndex()).toBe(0);

    host.interactive.set(false);
    fixture.detectChanges();
    key('ArrowRight');
    expect(host.formeIndex()).toBe(0);
  });

  it('updates the aria-label as the active forme changes', () => {
    key('ArrowRight');
    expect(stack().getAttribute('aria-label')).toBe(
      'Mega Charizard X, forme 2 of 3',
    );
  });

  it('hides silhouette slots from assistive tech', () => {
    const slots = fixture.nativeElement.querySelectorAll('.forme-slot');
    expect(slots[0].getAttribute('aria-hidden')).toBeNull();
    expect(slots[1].getAttribute('aria-hidden')).toBe('true');
  });

  it('resets to the base forme when the pokemon changes', () => {
    key('ArrowRight');
    expect(host.formeIndex()).toBe(1);
    host.pokemon.set({ id: 'blastoise', name: 'Blastoise' });
    fixture.detectChanges();
    expect(host.formeIndex()).toBe(0);
  });

  it('keeps one slot per position when a forme repeats the base id', () => {
    host.pokemon.set({
      id: 'charizard',
      name: 'Charizard',
      draftFormes: [{ id: 'charizard', name: 'Charizard' }],
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.forme-slot').length).toBe(2);
    key('ArrowRight');
    expect(host.formeIndex()).toBe(1);
  });

  it('steps backward on right-click and suppresses the native menu', () => {
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    stack().dispatchEvent(event);
    fixture.detectChanges();
    expect(event.defaultPrevented).toBe(true);
    expect(host.formeIndex()).toBe(2);
  });

  it('has a single forme and no button role when there is nothing to cycle', () => {
    host.pokemon.set({ id: 'blastoise', name: 'Blastoise' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.forme-slot').length).toBe(1);
    expect(stack().getAttribute('role')).toBeNull();
  });
});
