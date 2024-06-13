import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Pokemon } from '../interfaces/draft';
import { FilterService } from './filter.service';
@Component({
  selector: 'filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: 'filter.component.html',
})
export class FilterComponent implements OnChanges {
  @Input() query: string = '';
  enabled = false;
  @Output() querySelected: EventEmitter<Pokemon> = new EventEmitter<Pokemon>();
  results: Pokemon[] = [];
  constructor(private filterService: FilterService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (this.enabled) {
      this.results = this.filterService.getResults(this.query);
    } else {
      this.enabled = true;
    }
  }

  select(value: Pokemon) {
    this.results = [];
    this.enabled = false;
    this.querySelected.emit(value);
  }
}
