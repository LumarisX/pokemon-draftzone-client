import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CoreModule } from '../../sprite/sprite.module';
import { ApiService } from '../../api/api.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'filter',
  standalone: true,
  imports: [CommonModule, FormsModule, CoreModule],
  templateUrl: 'filter.component.html',
})
export class FilterComponent implements OnChanges {
  @Input() query: string = '';
  @Output() querySelected: EventEmitter<string> = new EventEmitter<string>();
  enabled = false;
  results: string[] = [];
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
      this.apiService
        .get(`test/search?q=${this.query}`)
        .subscribe((results) => {
          console.log(results);
          this.results = <string[]>results;
        });
    } else {
      this.results = [];
    }
  }

  select(value: string) {
    this.results = [];
    this.enabled = false;
    this.querySelected.emit(value);
  }
}
