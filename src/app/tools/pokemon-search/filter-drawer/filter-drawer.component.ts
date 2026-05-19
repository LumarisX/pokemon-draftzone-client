import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TYPES } from '../../../data';
import { PokemonTypeComponent } from '../../../components/pokemon-type/pokemon-type.component';
import {
  DraftFilter,
  DraftMoveFilter,
  FieldDefinition,
  MoveFieldDefinition,
  SearchFilter,
  SearchOperator,
} from '../pokemon-search.types';

@Component({
  selector: 'pdz-filter-drawer',
  standalone: true,
  imports: [FormsModule, PokemonTypeComponent],
  templateUrl: './filter-drawer.component.html',
  styleUrl: './filter-drawer.component.scss',
})
export class FilterDrawerComponent implements OnChanges {
  @Input() fields: FieldDefinition[] = [];
  @Input() moveFields: MoveFieldDefinition[] = [];
  @Input() operatorLabels: Record<SearchOperator, string> = {} as Record<
    SearchOperator,
    string
  >;
  @Input() initialFilter: DraftFilter | null = null;
  @Input() isEditing = false;
  @Output() apply = new EventEmitter<SearchFilter>();
  @Output() cancel = new EventEmitter<void>();

  readonly allTypes = TYPES;

  draft: DraftFilter = this.buildDefaultDraft();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialFilter']) {
      this.draft = this.initialFilter
        ? structuredClone(this.initialFilter)
        : this.buildDefaultDraft();
    }
  }

  get currentFieldDef(): FieldDefinition {
    return (
      this.fields.find((f) => f.key === this.draft.field) ?? this.fields[0]
    );
  }

  get isTypeField(): boolean {
    return this.currentFieldDef?.valueType === 'type';
  }

  get fieldCategories(): string[] {
    const seen = new Set<string>();
    const cats: string[] = [];
    for (const f of this.fields) {
      const cat = f.category ?? 'Other';
      if (!seen.has(cat)) {
        seen.add(cat);
        cats.push(cat);
      }
    }
    return cats;
  }

  get isApplyEnabled(): boolean {
    if (this.draft.field === 'learns') {
      return this.draft.moveFilters.some((mf) =>
        this.hasPrimitiveValue(mf.value),
      );
    }
    return this.hasPrimitiveValue(this.draft.value);
  }

  fieldsInCategory(category: string): FieldDefinition[] {
    return this.fields.filter((f) => (f.category ?? 'Other') === category);
  }

  getMoveFieldDef(mf: DraftMoveFilter): MoveFieldDefinition {
    return (
      this.moveFields.find((f) => f.key === mf.field) ?? this.moveFields[0]
    );
  }

  onFieldChange(): void {
    const def = this.currentFieldDef;
    this.draft.operator = def.operators[0];
    if (this.draft.field === 'learns') {
      this.draft.value = undefined;
      if (!this.draft.moveFilters.length) {
        this.draft.moveFilters = [this.createDefaultMoveFilter()];
      }
    } else {
      this.draft.moveFilters = [];
      this.draft.value = this.defaultValueForType(def.type);
    }
  }

  setOperator(op: SearchOperator): void {
    this.draft.operator = op;
  }

  addMoveFilter(): void {
    this.draft.moveFilters.push(this.createDefaultMoveFilter());
  }

  removeMoveFilter(index: number): void {
    this.draft.moveFilters.splice(index, 1);
    if (!this.draft.moveFilters.length) {
      this.draft.moveFilters.push(this.createDefaultMoveFilter());
    }
  }

  onMoveFieldChange(mf: DraftMoveFilter): void {
    const def = this.getMoveFieldDef(mf);
    mf.operator = def.operators[0];
    mf.value = this.defaultValueForType(def.type);
  }

  setMoveOperator(mf: DraftMoveFilter, op: SearchOperator): void {
    mf.operator = op;
  }

  applyFilter(): void {
    if (!this.isApplyEnabled) return;
    const committed = this.buildCommittedFilter();
    if (committed) {
      this.apply.emit(committed);
    }
  }

  cancelFilter(): void {
    this.cancel.emit();
  }

  private buildCommittedFilter(): SearchFilter | null {
    if (this.draft.field === 'learns') {
      const moveFilters = this.draft.moveFilters
        .filter((mf) => this.hasPrimitiveValue(mf.value))
        .map((mf) => ({
          field: mf.field,
          operator: mf.operator,
          value: mf.value as string | number | boolean,
        }));
      if (!moveFilters.length) return null;
      return {
        field: 'learns',
        operator: 'contains',
        moveMode: this.draft.moveMode,
        moveFilters,
      };
    }

    if (!this.hasPrimitiveValue(this.draft.value)) return null;

    const def = this.currentFieldDef;
    const value =
      def.type === 'number' ? Number(this.draft.value) : this.draft.value;

    return {
      field: this.draft.field,
      operator: this.draft.operator,
      value: value as string | number | boolean,
    };
  }

  private buildDefaultDraft(): DraftFilter {
    if (!this.fields.length) {
      return {
        field: 'name',
        operator: 'contains',
        value: '',
        moveMode: 'and',
        moveFilters: [],
      };
    }
    const field = this.fields[0];
    return {
      field: field.key,
      operator: field.operators[0],
      value: this.defaultValueForType(field.type),
      moveMode: 'and',
      moveFilters: [],
    };
  }

  private createDefaultMoveFilter(): DraftMoveFilter {
    if (!this.moveFields.length) {
      return {
        id: crypto.randomUUID(),
        field: 'name',
        operator: 'contains',
        value: '',
      };
    }
    const field = this.moveFields[0];
    return {
      id: crypto.randomUUID(),
      field: field.key,
      operator: field.operators[0],
      value: this.defaultValueForType(field.type),
    };
  }

  private defaultValueForType(type: string): string | number | boolean {
    if (type === 'number') return 0;
    if (type === 'boolean') return true;
    return '';
  }

  private hasPrimitiveValue(
    value: string | number | boolean | undefined,
  ): value is string | number | boolean {
    if (typeof value === 'boolean' || typeof value === 'number') return true;
    if (typeof value === 'string') return value.trim().length > 0;
    return false;
  }
}
