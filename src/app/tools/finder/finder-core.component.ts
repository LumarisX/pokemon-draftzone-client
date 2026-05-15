import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import {
  DataService,
  PokemonFullData,
  PokemonSearchMoveData,
} from '../../services/data.service';
import { SpriteComponent } from '../../images/sprite/sprite.component';
import { FindOptionComponent } from './find-option/find-option.component';
import { typeColor } from '../../util/styling';
import {
  PokemonDialogComponent,
  PokemonDialogData,
} from '../../components/pokemon-dialog/pokemon-dialog.component';

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
  selector: 'pdz-finder-core',
  templateUrl: './finder-core.component.html',
  imports: [
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    SpriteComponent,
    FindOptionComponent,
  ],
})
export class FinderCoreComponent implements OnInit {
  private dataApi = inject(DataService);
  private dialog = inject(MatDialog);

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

  results: PokemonFullData[] = [];
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

  typeColor = typeColor;

  openPokemonDialog(pokemon: PokemonFullData): void {
    const dataList = this.results.map((p) => this.buildDialogData(p));
    dataList.forEach((d, i) => {
      if (i > 0) d.prev = dataList[i - 1];
      if (i < dataList.length - 1) d.next = dataList[i + 1];
    });

    const idx = this.results.indexOf(pokemon);
    const data = idx >= 0 ? dataList[idx] : this.buildDialogData(pokemon);

    this.dialog.open(PokemonDialogComponent, {
      data,
      maxWidth: '420px',
      width: '92vw',
      panelClass: 'pokemon-detail-panel',
    });
  }

  private buildDialogData(pokemon: PokemonFullData): PokemonDialogData {
    const learns = pokemon.learns;
    const moves =
      Array.isArray(learns) &&
      learns.length > 0 &&
      typeof learns[0] !== 'string'
        ? (learns as PokemonSearchMoveData[])
        : undefined;
    return {
      pokemon: {
        id: pokemon.id,
        name: pokemon.name,
        types: pokemon.types,
        abilities: pokemon.abilities,
        stats: pokemon.baseStats,
        bst: pokemon.bst,
        cst: pokemon.cst,
        moves,
      },
    };
  }
}
