import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { TeamIdentityPickerComponent } from './team-identity-picker.component';
import {
  IdentityPack,
  SavedIdentity,
  TeamIdentityChoice,
} from './team-identity.model';
import { TeamIdentityService } from './team-identity.service';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';

const PACKS: IdentityPack[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    identities: [
      { id: 'sinnoh-jazz', name: 'Sinnoh Jazz', logo: 'logo-packs/starter/sinnoh-jazz.webp' },
      { id: 'azalea-kings', name: 'Azalea Kings', logo: 'logo-packs/starter/azalea-kings.webp' },
    ],
  },
  {
    id: 'letters',
    name: 'Lettering',
    identities: [{ id: 'x', name: 'Team X', logo: 'logo-packs/letters/x.webp' }],
  },
];

const SAVED: SavedIdentity[] = [
  { id: 's1', name: 'Old Owls', logo: 'team-logos/owls.png' },
];

@Component({
  imports: [TeamIdentityPickerComponent],
  template: `<pdz-team-identity-picker [(value)]="value" [showSaved]="showSaved" />`,
})
class HostComponent {
  value = signal<TeamIdentityChoice | null>(null);
  showSaved = true;
}

function render(options: {
  saved?: SavedIdentity[];
  packs?: Observable<IdentityPack[]>;
  value?: TeamIdentityChoice | null;
  showSaved?: boolean;
}) {
  const mine = jest.fn(() => of(options.saved ?? []));
  const rename = jest.fn((id: string, name: string) =>
    of({ ...options.saved!.find((entry) => entry.id === id)!, name }),
  );
  const remove = jest.fn(() => of(undefined));
  const confirm = jest.fn().mockResolvedValue(true);
  TestBed.configureTestingModule({
    imports: [HostComponent],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      {
        provide: TeamIdentityService,
        useValue: { packs: () => options.packs ?? of(PACKS), mine, rename, remove },
      },
      { provide: DialogService, useValue: { confirm } },
    ],
  });
  const fixture = TestBed.createComponent(HostComponent);
  fixture.componentInstance.value.set(options.value ?? null);
  fixture.componentInstance.showSaved = options.showSaved ?? true;
  fixture.detectChanges();
  const element: HTMLElement = fixture.nativeElement;
  const section = (heading: string) =>
    Array.from(element.querySelectorAll<HTMLElement>('pdz-disclosure')).find(
      (disclosure) =>
        disclosure
          .querySelector('.pdz-disclosure__heading')
          ?.textContent?.includes(heading),
    )!;
  const tiles = (heading: string) =>
    Array.from(
      section(heading).querySelectorAll<HTMLButtonElement>('button.tile'),
    );
  const names = (heading: string) =>
    tiles(heading).map((tile) => tile.querySelector('.tile__name')?.textContent?.trim());
  const expanded = (heading: string) =>
    section(heading)
      .querySelector('.pdz-disclosure__toggle')
      ?.getAttribute('aria-expanded');
  const menuItem = (index: number, label: string) =>
    Array.from(
      section('Custom Teams')
        .querySelectorAll('.tile-slot')
        [index].querySelectorAll<HTMLButtonElement>('button[pdz-menu-item]'),
    ).find((item) => item.textContent?.includes(label))!;
  return {
    fixture,
    element,
    section,
    tiles,
    names,
    expanded,
    menuItem,
    mine,
    rename,
    remove,
    confirm,
  };
}

describe('TeamIdentityPickerComponent', () => {
  it('lists saved teams under Custom Teams with a New Team tile last', () => {
    const { names } = render({ saved: SAVED });
    expect(names('Custom Teams')).toEqual(['Old Owls', 'New Team']);
  });

  it('gives each logo pack its own section', () => {
    const { names } = render({ saved: [] });
    expect(names('Custom Teams')).toEqual(['New Team']);
    expect(names('Starter Pack')).toEqual(['Sinnoh Jazz', 'Azalea Kings']);
    expect(names('Lettering')).toEqual(['Team X']);
  });

  it('opens Custom Teams and the first pack when nothing is picked', () => {
    const { expanded } = render({});
    expect(expanded('Custom Teams')).toBe('true');
    expect(expanded('Starter Pack')).toBe('true');
    expect(expanded('Lettering')).toBe('false');
  });

  it('picks a stock identity as one name and logo', () => {
    const { fixture, tiles } = render({});
    tiles('Starter Pack')[1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toEqual({
      source: 'pack',
      pack: 'starter',
      id: 'azalea-kings',
      name: 'Azalea Kings',
      logo: 'logo-packs/starter/azalea-kings.webp',
    });
    expect(tiles('Starter Pack')[1].getAttribute('aria-pressed')).toBe('true');
  });

  it('picks a saved team by its id', () => {
    const { fixture, tiles } = render({ saved: SAVED });
    tiles('Custom Teams')[0].click();
    expect(fixture.componentInstance.value()).toEqual({
      source: 'saved',
      id: 's1',
      name: 'Old Owls',
      logo: 'team-logos/owls.png',
    });
  });

  it('opens only the section that holds the current pick', () => {
    const { tiles, expanded } = render({
      saved: SAVED,
      value: { source: 'custom', name: 'Team X', logo: 'logo-packs/letters/x.webp' },
    });
    expect(expanded('Lettering')).toBe('true');
    expect(expanded('Custom Teams')).toBe('false');
    expect(expanded('Starter Pack')).toBe('false');
    expect(tiles('Lettering')[0].getAttribute('aria-pressed')).toBe('true');
  });

  it('keeps a saved team that used a pack identity in its pack only', () => {
    const { names } = render({
      saved: [
        ...SAVED,
        { id: 's2', name: 'Sinnoh Jazz', logo: 'logo-packs/starter/sinnoh-jazz.webp' },
      ],
    });
    expect(names('Custom Teams')).toEqual(['Old Owls', 'New Team']);
  });

  it('builds a new custom team from the New Team tile', () => {
    const { fixture, element, tiles, names } = render({});
    expect(element.querySelector('input[pdz-input]')).toBeNull();
    tiles('Custom Teams')[0].click();
    fixture.detectChanges();
    const input = element.querySelector<HTMLInputElement>('input[pdz-input]')!;
    input.value = 'Sturdy Shedinjas';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toEqual({
      source: 'custom',
      name: 'Sturdy Shedinjas',
      logo: null,
    });
    expect(names('Custom Teams')).toEqual(['Sturdy Shedinjas', 'New Team']);
    expect(tiles('Custom Teams')[0].getAttribute('aria-pressed')).toBe('true');
  });

  it('keeps New Team last so another custom team can be added', () => {
    const { fixture, element, tiles, names } = render({
      saved: SAVED,
      value: { source: 'custom', name: 'Sturdy Shedinjas', logo: null },
    });
    expect(names('Custom Teams')).toEqual(['Old Owls', 'Sturdy Shedinjas', 'New Team']);
    tiles('Custom Teams')[2].click();
    fixture.detectChanges();
    expect(names('Custom Teams')).toEqual([
      'Old Owls',
      'Sturdy Shedinjas',
      'Untitled Team',
      'New Team',
    ]);
    expect(element.querySelector<HTMLInputElement>('input[pdz-input]')!.value).toBe('');
    tiles('Custom Teams')[3].click();
    fixture.detectChanges();
    expect(names('Custom Teams')).toEqual([
      'Old Owls',
      'Sturdy Shedinjas',
      'Untitled Team',
      'New Team',
    ]);
    tiles('Custom Teams')[0].click();
    fixture.detectChanges();
    expect(names('Custom Teams')).toEqual(['Old Owls', 'Sturdy Shedinjas', 'New Team']);
  });

  it('keeps a custom team to come back to after picking another', () => {
    const { fixture, element, tiles } = render({
      value: { source: 'custom', name: 'Sturdy Shedinjas', logo: null },
    });
    expect(tiles('Custom Teams')[0].getAttribute('aria-pressed')).toBe('true');
    tiles('Starter Pack')[0].click();
    fixture.detectChanges();
    expect(element.querySelector('input[pdz-input]')).toBeNull();
    tiles('Custom Teams')[0].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toEqual({
      source: 'custom',
      name: 'Sturdy Shedinjas',
      logo: null,
    });
    expect(
      element.querySelector<HTMLInputElement>('input[pdz-input]')!.value,
    ).toBe('Sturdy Shedinjas');
  });

  it('never asks for saved teams when told not to', () => {
    const { mine, names } = render({ showSaved: false, saved: SAVED });
    expect(mine).not.toHaveBeenCalled();
    expect(names('Custom Teams')).toEqual(['New Team']);
  });

  it('renames a saved team and keeps the pick on it', () => {
    const { fixture, element, names, menuItem, rename } = render({
      saved: SAVED,
      value: { source: 'saved', id: 's1', name: 'Old Owls', logo: 'team-logos/owls.png' },
    });
    menuItem(0, 'Rename').click();
    fixture.detectChanges();
    const input = element.querySelector<HTMLInputElement>('.identity__rename input')!;
    expect(input.value).toBe('Old Owls');
    input.value = 'Night Owls';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();

    expect(rename).toHaveBeenCalledWith('s1', 'Night Owls');
    expect(names('Custom Teams')).toEqual(['Night Owls', 'New Team']);
    expect(fixture.componentInstance.value()).toEqual({
      source: 'saved',
      id: 's1',
      name: 'Night Owls',
      logo: 'team-logos/owls.png',
    });
    expect(element.querySelector('.identity__rename')).toBeNull();
  });

  it('deletes a saved team after confirming, and drops it as the pick', async () => {
    const { fixture, names, menuItem, remove, confirm } = render({
      saved: SAVED,
      value: { source: 'saved', id: 's1', name: 'Old Owls', logo: 'team-logos/owls.png' },
    });
    menuItem(0, 'Delete').click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(confirm).toHaveBeenCalled();
    expect(remove).toHaveBeenCalledWith('s1');
    expect(names('Custom Teams')).toEqual(['New Team']);
    expect(fixture.componentInstance.value()).toBeNull();
  });

  it('keeps a saved team when the delete is not confirmed', async () => {
    const { fixture, names, menuItem, remove, confirm } = render({ saved: SAVED });
    confirm.mockResolvedValue(false);
    menuItem(0, 'Delete').click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(remove).not.toHaveBeenCalled();
    expect(names('Custom Teams')).toEqual(['Old Owls', 'New Team']);
  });

  it('says when the packs did not load and keeps custom teams available', () => {
    const { element, names } = render({
      packs: throwError(() => new Error('down')),
    });
    expect(element.querySelector('pdz-empty-state')).toBeTruthy();
    expect(names('Custom Teams')).toEqual(['New Team']);
  });
});
