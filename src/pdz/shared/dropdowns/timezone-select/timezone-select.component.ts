import { Component, computed, input, model } from '@angular/core';
import { SelectOptionComponent } from '@pdz/shared/dropdowns/select/select-option.component';
import { SelectComponent } from '@pdz/shared/dropdowns/select/select.component';
import {
  abbreviatedTimeZones,
  TimeZone,
  timeZones,
} from '@pdz/shared/time/timezone';

let nextId = 0;

@Component({
  selector: 'pdz-timezone-select',
  imports: [SelectComponent, SelectOptionComponent],
  templateUrl: './timezone-select.component.html',
  styleUrl: './timezone-select.component.scss',
})
export class TimezoneSelectComponent {
  readonly selectId = `pdz-timezone-select-${nextId++}`;

  readonly label = input('');
  readonly zones = input<TimeZone[]>(timeZones());
  readonly shortZones = input<TimeZone[]>(abbreviatedTimeZones());
  readonly value = model<TimeZone>();

  readonly selectedKey = computed(() => {
    const value = this.value();
    return value ? this.key(value) : undefined;
  });

  key(zone: TimeZone): string {
    return `${zone.short ?? ''}|${zone.name}`;
  }

  onKeyChange(key: unknown): void {
    const match = [...this.shortZones(), ...this.zones()].find(
      (zone) => this.key(zone) === key,
    );
    if (match) this.value.set(match);
  }
}
