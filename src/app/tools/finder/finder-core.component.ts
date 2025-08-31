import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DataService } from '../../services/data.service';
import { StatsTable, Type } from '../../data';
import { SpriteComponent } from '../../images/sprite/sprite.component';
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
  selector: 'finder-core',
  standalone: true,
  templateUrl: './finder-core.component.html',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    SpriteComponent,
    FindOptionComponent,
  ],
})
export class FinderCoreComponent implements OnInit {
  private dataApi = inject(DataService);

  @Input()
  rulesetId?: string;
  @Input()
  formatId?: string;
  @Input()
  set startQuery(value: string | null) {
    if (!value) return;
    this.finalQuery = value;
    this.find();
  }

  @Output() UpdatedQuery = new EventEmitter<string>();

  results: {
    id: string;
    name: string;
    types: Type[];
    abilities: string[];
    baseStats: StatsTable;
    weightkg: number;
    tier: string;
    doublesTier: string;
    eggGroups: string[];
    nfe: boolean;
    num: number;
    tags: string[];
    bst: number;
  }[] = [];
  queryGroups: QueryGroup[] = [];
  finalQuery: string = '';
  sortedColumn: string = 'num';
  reversed = false;
  lastFind = '';
  advancedMode: boolean = false;

  ngOnInit() {
    this.addQueryGroup();
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
    },
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
              (query) => `${query.option} ${query.operation} "${query.value}"`,
            )
            .join(group.conjunction)})`,
      )
      .join(' && ');
  }

  find() {
    if (this.lastFind != this.finalQuery + this.rulesetId + this.formatId) {
      this.UpdatedQuery.emit(this.finalQuery);
      this.dataApi
        .advancesearch([this.finalQuery], this.rulesetId, this.formatId)
        .subscribe((data) => (this.results = data));
      this.lastFind = this.finalQuery + this.rulesetId + this.formatId;
    }
  }

  sortBy(column: string): void {
    if (this.sortedColumn === column) {
      this.reversed = !this.reversed;
    } else {
      this.sortedColumn = column;
      this.reversed = false;
    }
    switch (column) {
      case 'hp':
      case 'atk':
      case 'def':
      case 'spa':
      case 'spd':
      case 'spe':
        this.results.sort((a, b) => {
          const valueA = a.baseStats[column];
          const valueB = b.baseStats[column];

          if (valueA > valueB) return this.reversed ? 1 : -1;
          if (valueA < valueB) return this.reversed ? -1 : 1;
          return 0;
        });
        break;
      case 'name':
      case 'num':
      case 'weightkg':
        this.results.sort((a, b) => {
          const valueA = a[column];
          const valueB = b[column];
          if (valueA < valueB) return this.reversed ? 1 : -1;
          if (valueA > valueB) return this.reversed ? -1 : 1;
          return 0;
        });
        break;
      case 'bst':
        this.results.sort((a, b) => {
          const valueA = a[column];
          const valueB = b[column];
          if (valueA > valueB) return this.reversed ? 1 : -1;
          if (valueA < valueB) return this.reversed ? -1 : 1;
          return 0;
        });
        break;
    }
  }
}
