import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CoreModule } from '../sprite/sprite.module';
import { ApiService } from '../api/api.service';
import { FormsModule } from '@angular/forms';
import { Pokemon } from '../interfaces/draft';
import { HttpParams } from '@angular/common/http';
@Component({
  selector: 'filter',
  standalone: true,
  imports: [CommonModule, FormsModule, CoreModule],
  templateUrl: 'filter.component.html',
})
export class FilterComponent implements OnChanges {
  @Input() query: string = '';
  @Output() querySelected: EventEmitter<Pokemon> = new EventEmitter<Pokemon>();
  enabled = false;
  results: Pokemon[] = [];
  constructor(private apiService: ApiService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (this.enabled) {
      this.sendQuery();
    } else {
      this.enabled = true;
    }
  }

  sendQuery() {
    if (this.query != '') {
      let params = new HttpParams()
        .set('query', this.query)
        .set('ruleset', 'Paldea Dex');
      this.apiService
        .getDataWithParams(`data/search`, params)
        .subscribe((results) => {
          this.results = <Pokemon[]>results;
        });
    } else {
      this.results = [];
    }
  }

  select(value: Pokemon) {
    this.results = [];
    this.enabled = false;
    this.querySelected.emit(value);
  }
}
