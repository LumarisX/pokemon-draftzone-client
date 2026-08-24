import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  PokemonTypeComponent,
  PokemonTypeContent,
} from './pokemon-type.component';

@Component({
  imports: [PokemonTypeComponent],
  template: `<pdz-pokemon-type
    [type]="type()"
    [content]="content()"
    [labelWidth]="labelWidth()"
  />`,
})
class HostComponent {
  readonly type = signal('Fire');
  readonly content = signal<PokemonTypeContent>('text');
  readonly labelWidth = signal<string | undefined>(undefined);
}

describe('PokemonTypeComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const badge = () =>
    fixture.nativeElement.querySelector('pdz-pokemon-type') as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('paints the type onto the host custom properties', () => {
    expect(badge().style.getPropertyValue('--pdz-pokemon-type-fill')).toBe('#E62829');
    expect(badge().style.getPropertyValue('--pdz-pokemon-type-ink')).toBe('#E62829');
  });

  it('gives Stellar a flat ink so borders and text stay valid', () => {
    host.type.set('Stellar');
    fixture.detectChanges();

    expect(badge().style.getPropertyValue('--pdz-pokemon-type-fill')).toContain(
      'linear-gradient',
    );
    expect(badge().style.getPropertyValue('--pdz-pokemon-type-ink')).toBe(
      'hsl(180 75% 45%)',
    );
  });

  it('leaves the label width to the size ramp until a call site overrides it', () => {
    expect(
      badge().style.getPropertyValue('--pdz-pokemon-type-label-width'),
    ).toBe('');

    host.labelWidth.set('auto');
    fixture.detectChanges();

    expect(
      badge().style.getPropertyValue('--pdz-pokemon-type-label-width'),
    ).toBe('auto');
  });

  it('defaults to md, solid, horizontal', () => {
    expect(badge().dataset['size']).toBe('md');
    expect(badge().dataset['variant']).toBe('solid');
    expect(badge().dataset['direction']).toBe('horizontal');
  });

  it('falls back to the label when the type has no glyph', () => {
    host.type.set('Stellar');
    host.content.set('icon');
    fixture.detectChanges();

    expect(badge().querySelector('pdz-icon')).toBeNull();
    expect(badge().textContent?.trim()).toBe('Stellar');
    expect(badge().getAttribute('aria-label')).toBeNull();
  });

  it('names itself for screen readers when it is icon-only', () => {
    host.content.set('icon');
    fixture.detectChanges();

    expect(badge().querySelector('.pdz-pokemon-type__label')).toBeNull();
    expect(badge().getAttribute('role')).toBe('img');
    expect(badge().getAttribute('aria-label')).toBe('Fire');
  });
});
