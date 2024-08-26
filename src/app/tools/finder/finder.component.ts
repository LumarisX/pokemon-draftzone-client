import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DataService } from '../../api/data.service';
import { SpriteComponent } from '../../images/sprite.component';
import { Pokemon } from '../../interfaces/draft';
import { FindOptionComponent } from './find-option/find-option.component';

type QueryGroup = {
  queries: QueryBuilder[];
  conjunction: ' && ' | ' || ';
};

type QueryBuilder = {
  option: string;
  operation: string | undefined;
  value: string | number | boolean | undefined;
};

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
  queryGroups: QueryGroup[] = [];
  finalQuery: string = '';

  advancedMode: boolean = false;

  constructor(private dataApi: DataService) {}

  ngOnInit() {
    this.addQueryGroup();
    console.log('group init');
  }

  addQueryGroup() {
    let group: QueryGroup = {
      queries: [],
      conjunction: ' && ',
    };
    this.addQueryBuilder(group);
    this.queryGroups.push(group);
  }

  addQueryBuilder(group: QueryGroup) {
    group.queries.push({
      option: 'select',
      operation: undefined,
      value: undefined,
    });
  }

  removeQueryBuilder(group: QueryGroup, index: number) {
    group.queries.splice(index, 1);
    this.updateFinalQuery();
  }

  removeQueryGroup(index: number) {
    this.queryGroups.splice(index, 1);
    this.updateFinalQuery();
  }

  onQueryChange(
    query: QueryBuilder,
    event: {
      option: string;
      operation: string | undefined;
      value: string | number | boolean | undefined;
    }
  ) {
    query.option = event.option;
    query.operation = event.operation;
    query.value = event.value;
    this.updateFinalQuery();
  }

  updateFinalQuery() {
    this.finalQuery = this.queryGroups
      .map(
        (group) =>
          `(${group.queries
            .filter((query) => query.value !== undefined && query.value !== '')
            .flatMap(
              (query) => `${query.option} ${query.operation} ${query.value}`
            )
            .join(group.conjunction)})`
      )
      .join(' && ');
  }

  find() {
    this.dataApi
      .advancesearch([this.finalQuery], 'Gen9 NatDex')
      .subscribe((data) => (this.results = data));
  }
}
