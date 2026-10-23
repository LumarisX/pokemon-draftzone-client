import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { PokemonComponent } from '@pdz/shared/data/pokemon/pokemon.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { TierListChange } from '../tier-list.model';

type PokemonRow = {
  id: string;
  name: string;
  detail: string;
  delta: number | null;
};

type Group = {
  id: string;
  label: string;
  icon: string;
  rows: PokemonRow[];
  lines: string[];
};

function costText(cost: number | undefined): string {
  return cost === undefined ? '' : ` (${cost} pts)`;
}

export function groupChanges(changes: TierListChange[]): Group[] {
  const tiers: string[] = [];
  const moved: PokemonRow[] = [];
  const added: PokemonRow[] = [];
  const removed: PokemonRow[] = [];
  const banned: PokemonRow[] = [];
  const unbanned: PokemonRow[] = [];
  const details: PokemonRow[] = [];
  const bans: string[] = [];

  for (const change of changes) {
    switch (change.kind) {
      case 'tier-added':
        tiers.push(`Added ${change.name}${costText(change.cost)}`);
        break;
      case 'tier-removed':
        tiers.push(`Removed ${change.name}${costText(change.cost)}`);
        break;
      case 'tier-renamed':
        tiers.push(`Renamed ${change.from} to ${change.to}`);
        break;
      case 'tier-repriced':
        tiers.push(`${change.name}: ${change.from} → ${change.to} pts`);
        break;
      case 'moved':
        moved.push({
          id: change.pokemonId,
          name: change.name,
          detail: `${change.from ?? 'Untiered'} → ${change.to ?? 'Untiered'}`,
          delta:
            change.fromCost !== undefined && change.toCost !== undefined
              ? change.toCost - change.fromCost
              : null,
        });
        break;
      case 'added':
        added.push({
          id: change.pokemonId,
          name: change.name,
          detail: change.tier ? `${change.tier}${costText(change.cost)}` : '',
          delta: null,
        });
        break;
      case 'removed':
        removed.push({
          id: change.pokemonId,
          name: change.name,
          detail: change.tier ? `was ${change.tier}${costText(change.cost)}` : '',
          delta: null,
        });
        break;
      case 'banned':
        banned.push({ id: change.pokemonId, name: change.name, detail: '', delta: null });
        break;
      case 'unbanned':
        unbanned.push({ id: change.pokemonId, name: change.name, detail: '', delta: null });
        break;
      case 'details':
        details.push({
          id: change.pokemonId,
          name: change.name,
          detail: 'Notes, formes or add-ons',
          delta: null,
        });
        break;
      case 'ban-list': {
        const label = change.field === 'moves' ? 'moves' : 'abilities';
        if (change.added.length)
          bans.push(`Banned ${label}: ${change.added.join(', ')}`);
        if (change.removed.length)
          bans.push(`Allowed ${label}: ${change.removed.join(', ')}`);
        break;
      }
    }
  }

  const groups: Group[] = [
    { id: 'tiers', label: 'Tiers', icon: 'layers', rows: [], lines: tiers },
    { id: 'moved', label: 'Moved', icon: 'swap_vert', rows: moved, lines: [] },
    { id: 'added', label: 'Added', icon: 'add_circle', rows: added, lines: [] },
    { id: 'removed', label: 'Removed', icon: 'remove_circle', rows: removed, lines: [] },
    { id: 'banned', label: 'Banned', icon: 'block', rows: banned, lines: [] },
    { id: 'unbanned', label: 'Unbanned', icon: 'check_circle', rows: unbanned, lines: [] },
    { id: 'details', label: 'Details', icon: 'edit_note', rows: details, lines: [] },
    { id: 'bans', label: 'Banned Moves and Abilities', icon: 'gavel', rows: [], lines: bans },
  ];
  return groups.filter((group) => group.rows.length || group.lines.length);
}

@Component({
  selector: 'pdz-tier-list-changes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PokemonComponent, IconComponent],
  template: `
    @if (groups().length) {
      @for (group of groups(); track group.id) {
        <section class="changes__group">
          <h3 class="changes__label">
            <pdz-icon [name]="group.icon" [size]="16" aria-hidden="true" />
            {{ group.label }}
            <span class="changes__count">{{ group.rows.length || group.lines.length }}</span>
          </h3>
          @if (group.lines.length) {
            <ul class="changes__lines">
              @for (line of group.lines; track line) {
                <li>{{ line }}</li>
              }
            </ul>
          }
          @if (group.rows.length) {
            <ul class="changes__rows">
              @for (row of group.rows; track row.id) {
                <li class="changes__row">
                  <pdz-pokemon size="inline" [pokemon]="{ id: row.id, name: row.name }" />
                  @if (row.detail) {
                    <span class="changes__detail">{{ row.detail }}</span>
                  }
                  @if (row.delta) {
                    <span
                      class="changes__delta"
                      [class.changes__delta--up]="row.delta > 0"
                      [class.changes__delta--down]="row.delta < 0"
                    >
                      {{ row.delta > 0 ? '+' : '−' }}{{ abs(row.delta) }} pts
                    </span>
                  }
                </li>
              }
            </ul>
          }
        </section>
      }
    } @else {
      <p class="changes__none">{{ emptyText() }}</p>
    }
  `,
  styleUrl: './tier-list-changes.component.scss',
})
export class TierListChangesComponent {
  readonly changes = input.required<TierListChange[]>();
  readonly emptyText = input('No differences.');

  protected readonly groups = computed(() => groupChanges(this.changes()));

  protected abs(value: number): number {
    return Math.abs(value);
  }
}
