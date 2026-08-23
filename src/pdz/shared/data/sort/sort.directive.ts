import {
  Directive,
  booleanAttribute,
  input,
  linkedSignal,
  output,
} from '@angular/core';

export type SortDirection = 'asc' | 'desc' | '';

export interface Sort {
  active: string;
  direction: SortDirection;
}

@Directive({
  selector: '[pdzSort]',
  exportAs: 'pdzSort',
})
export class SortDirective {
  readonly active = input<string>('', { alias: 'pdzSortActive' });
  readonly direction = input<SortDirection>('', { alias: 'pdzSortDirection' });
  readonly disableClear = input(false, {
    alias: 'pdzSortDisableClear',
    transform: booleanAttribute,
  });

  readonly sortChange = output<Sort>({ alias: 'pdzSortChange' });

  readonly state = linkedSignal<Sort>(() => ({
    active: this.active(),
    direction: this.direction(),
  }));

  directionFor(id: string): SortDirection {
    const state = this.state();
    return state.active === id ? state.direction : '';
  }

  sort(id: string, start: SortDirection = 'asc'): void {
    const current = this.state();
    const direction =
      current.active === id
        ? this.nextDirection(current.direction, start)
        : start;
    const next: Sort = { active: id, direction };
    this.state.set(next);
    this.sortChange.emit(next);
  }

  private nextDirection(
    current: SortDirection,
    start: SortDirection,
  ): SortDirection {
    const cycle: SortDirection[] =
      start === 'desc' ? ['desc', 'asc'] : ['asc', 'desc'];
    const index = cycle.indexOf(current);

    if (index === -1) return cycle[0];
    if (index < cycle.length - 1) return cycle[index + 1];
    return this.disableClear() ? cycle[0] : '';
  }
}
