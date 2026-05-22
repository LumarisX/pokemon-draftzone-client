import { Component, EventEmitter, Input, Output } from '@angular/core';

let nextId = 0;

export type SelectOptionGroup = [
  string,
  { name: string; id: string; desc?: string }[],
];

@Component({
  selector: 'pdz-grouped-select',
  standalone: true,
  templateUrl: './grouped-select.component.html',
  styleUrl: './grouped-select.component.scss',
})
export class GroupedSelectComponent {
  readonly selectId = `pdz-grouped-select-${nextId++}`;

  @Input() label = '';
  @Input() groups: SelectOptionGroup[] = [];
  @Input() value: string | undefined;
  @Output() valueChange = new EventEmitter<string>();

  handleChange(event: Event): void {
    this.valueChange.emit((event.target as HTMLSelectElement).value);
  }
}
