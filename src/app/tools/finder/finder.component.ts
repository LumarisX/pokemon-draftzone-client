import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DataService } from '../../api/data.service';
import { SpriteComponent } from '../../images/sprite.component';
import { Pokemon } from '../../interfaces/draft';
import { FindOptionComponent } from './find-option/find-option.component';

@Component({
  selector: 'finder',
  standalone: true,
  templateUrl: './finder.component.html',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    SpriteComponent,
    FindOptionComponent,
  ],
})
export class FinderComponent implements OnInit {
  results: Pokemon[] = [];
  queries: {
    option: string;
    operation: string | undefined;
    value: string | number | boolean | undefined;
  }[] = [];
  finalQuery: string = '';

  advancedMode: boolean = false;

  constructor(private dataApi: DataService) {}

  ngOnInit() {
    this.addFindOption();
  }

  addFindOption() {
    this.queries.push({
      option: 'select',
      operation: undefined,
      value: undefined,
    });
  }

  removeFindOption(index: number) {
    this.queries.splice(index, 1);
    this.updateFinalQuery();
  }

  onQueryChange(
    index: number,
    event: {
      option: string;
      operation: string | undefined;
      value: string | number | boolean | undefined;
    }
  ) {
    this.queries[index].option = event.option;
    this.queries[index].operation = event.operation;
    this.queries[index].value = event.value;
    this.updateFinalQuery();
  }

  updateFinalQuery() {
    this.finalQuery = this.queries
      .filter((query) => query.value !== undefined && query.value !== '')
      .flatMap((query) => `${query.option} ${query.operation} ${query.value}`)
      .join(' && ');
  }

  find() {
    this.dataApi
      .advancesearch([this.finalQuery], 'Gen9 NatDex')
      .subscribe((data) => (this.results = data));
  }
}
