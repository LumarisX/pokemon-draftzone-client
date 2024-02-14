import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CoreModule } from '../../sprite/sprite.module';
import { ApiService } from '../../api/api.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'filter',
  standalone: true,
  imports: [CommonModule, FormsModule, CoreModule],
  templateUrl: 'filter.component.html',
})
export class FilterComponent {
  query: string = '';
  results: string[] = [];
  constructor(private apiService: ApiService) {}

  sendQuery(value: string) {
    if (value != '') {
      this.apiService.get(`test/search?q=${value}`).subscribe((results) => {
        this.results = <string[]>results;
      });
    } else {
      this.results = [];
    }
  }

  select(value: string) {
    this.results = [];
    this.query = value;
  }
}
