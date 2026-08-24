import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SettingsService } from '@pdz/layout/top-navbar/settings.service';
import { BehaviorSubject } from 'rxjs';
import { DebugSpritesComponent } from './debug-sprites.component';

describe('DebugSpritesComponent', () => {
  let fixture: ComponentFixture<DebugSpritesComponent>;
  let component: DebugSpritesComponent;

  const cells = (): HTMLElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.sprite-grid__cell'));
  const grid = (): HTMLElement =>
    fixture.nativeElement.querySelector('.sprite-grid');
  // Filtering is CSS-driven (:has on the step badge), so assert the selector
  // the stylesheet uses rather than a computed style jsdom will not resolve.
  const hiddenByFilter = (cell: HTMLElement) => {
    const filter = grid().getAttribute('data-filter');
    if (filter === 'missing') {
      return !cell.matches(':has(.sprite-grid__step[data-step="missing"])');
    }
    if (filter === 'fallback') {
      return cell.matches(':has(.sprite-grid__step[data-step="primary"])');
    }
    return false;
  };
  const visibleCells = () => cells().filter((c) => !hiddenByFilter(c));
  const stepOf = (cell: HTMLElement) =>
    cell.querySelector('.sprite-grid__step')?.getAttribute('data-step');
  const failAll = (cell: HTMLElement) => {
    const img = cell.querySelector('img') as HTMLImageElement;
    for (let i = 0; i < 8; i++) img.dispatchEvent(new Event('error'));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    const settings = new BehaviorSubject<{ spriteSet?: string | null }>({
      spriteSet: 'home',
    });
    const settingsSignal = signal(settings.value);
    await TestBed.configureTestingModule({
      imports: [DebugSpritesComponent],
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
    fixture = TestBed.createComponent(DebugSpritesComponent);
    component = fixture.componentInstance;
    // Narrow the grid before first render so the suite is not rendering 1480 sprites.
    component['search'].set('charizard');
    fixture.detectChanges();
  });

  it('renders one cell per matching id', () => {
    expect(cells().length).toBeGreaterThan(0);
    expect(cells().length).toBe(component['rows']().length);
  });

  it('filters by search term against id and name', () => {
    const before = cells().length;
    component['search'].set('charizardmegax');
    fixture.detectChanges();
    expect(cells().length).toBe(1);
    expect(cells().length).toBeLessThan(before);

    component['search'].set('Mega Charizard Y');
    fixture.detectChanges();
    expect(cells().length).toBe(1);
  });

  it('writes the shiny signal through the two-way ngModel binding', () => {
    const box = fixture.nativeElement.querySelector(
      'input[pdz-checkbox]',
    ) as HTMLInputElement;
    expect(component['shiny']()).toBe(false);

    box.checked = true;
    box.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(component['shiny']()).toBe(true);
    const src = fixture.nativeElement.querySelector('img').getAttribute('src');
    expect(src).toContain('/home-shiny/');
  });

  it('writes the search signal through the two-way ngModel binding', () => {
    const box = fixture.nativeElement.querySelector(
      'input[pdz-input]',
    ) as HTMLInputElement;
    box.value = 'blastoise';
    box.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(component['search']()).toBe('blastoise');
  });

  it('labels a healthy sprite primary and an exhausted chain missing', () => {
    const cell = cells()[0];
    expect(stepOf(cell)).toBe('primary');
    failAll(cell);
    expect(stepOf(cell)).toBe('missing');
  });

  it('exposes the active filter on the grid for the stylesheet', () => {
    expect(grid().getAttribute('data-filter')).toBe('all');
    component['filter'].set('fallback');
    fixture.detectChanges();
    expect(grid().getAttribute('data-filter')).toBe('fallback');
  });

  it('hides passing sprites under the missing filter, and shows failures', () => {
    const cell = cells()[0];
    expect(visibleCells().length).toBe(cells().length);

    component['filter'].set('missing');
    fixture.detectChanges();
    expect(visibleCells().length).toBe(0);

    failAll(cell);
    expect(visibleCells()).toContain(cell);
    expect(visibleCells().length).toBe(1);
  });

  it('reports the visible count', () => {
    const count = fixture.nativeElement.querySelector('.sprites__count');
    expect(count.textContent).toContain(`${component['rows']().length} matching`);
  });
});
