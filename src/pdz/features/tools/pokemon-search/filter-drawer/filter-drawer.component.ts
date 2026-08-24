import {
  Component,
  EventEmitter,
  HostListener,
  OnChanges,
  Output,
  SimpleChanges,
  input,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TYPES } from '@pdz/shared/data';
import { PokemonTypeComponent } from '@pdz/shared/data/pokemon-type/pokemon-type.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import {
  DraftFilter,
  FieldDefinition,
  OPERATOR_MAP,
  SearchFilter,
  SearchOperator,
} from '../pokemon-search.types';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { SegmentedOptionComponent } from '@pdz/shared/inputs/segmented/segmented-option.component';
import { SegmentedComponent } from '@pdz/shared/inputs/segmented/segmented.component';

@Component({
  selector: 'pdz-filter-drawer',
  imports: [FormsModule, IconComponent, PokemonTypeComponent,
    ButtonComponent,
    SegmentedComponent,
    SegmentedOptionComponent,
  ],
  templateUrl: './filter-drawer.component.html',
  styleUrl: './filter-drawer.component.scss',
})
export class FilterDrawerComponent implements OnChanges {
  readonly fields = input<FieldDefinition[]>([]);
  readonly initialFilter = input<DraftFilter | null>(null);
  readonly isEditing = input(false);
  @Output() apply = new EventEmitter<SearchFilter>();
  @Output() cancel = new EventEmitter<void>();

  readonly operatorMap = OPERATOR_MAP;

  readonly allTypes = TYPES;

  draft: DraftFilter = this.buildDefaultDraft();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialFilter']) {
      const initialFilter = this.initialFilter();
      this.draft = initialFilter
        ? structuredClone(initialFilter)
        : this.buildDefaultDraft();
    }
  }

  get currentFieldDef(): FieldDefinition {
    const fields = this.fields();
    return fields.find((f) => f.key === this.draft.field) ?? fields[0];
  }

  get isTypeField(): boolean {
    return this.currentFieldDef?.valueType === 'type';
  }

  get fieldCategories(): string[] {
    const seen = new Set<string>();
    const cats: string[] = [];
    for (const f of this.fields()) {
      const cat = f.category ?? 'Other';
      if (!seen.has(cat)) {
        seen.add(cat);
        cats.push(cat);
      }
    }
    return cats;
  }

  get isApplyEnabled(): boolean {
    return this.hasPrimitiveValue(this.draft.value);
  }

  fieldsInCategory(category: string): FieldDefinition[] {
    return this.fields().filter((f) => (f.category ?? 'Other') === category);
  }

  onFieldChange(): void {
    const def = this.currentFieldDef;
    this.draft.operator = def.operators[0];
    this.draft.moveFilters = [];
    this.draft.value = this.defaultValueForType(def.type);
  }

  setOperator(op: SearchOperator): void {
    this.draft.operator = op;
  }

  applyFilter(): void {
    if (!this.isApplyEnabled) return;
    const committed = this.buildCommittedFilter();
    if (committed) {
      this.apply.emit(committed);
    }
  }

  @HostListener('keyup.enter', ['$event'])
  onEnterKey(event: Event): void {
    const target = event.target as HTMLElement;
    // Selects use Enter to open/close; cancel button should not also apply
    if (target.tagName === 'SELECT') return;
    if (target.classList.contains('filter-drawer__close')) return;
    this.applyFilter();
  }

  cancelFilter(): void {
    this.cancel.emit();
  }

  private buildCommittedFilter(): SearchFilter | null {
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
    const fields = this.fields();
    if (!fields.length) {
      return {
        field: 'name',
        operator: 'contains',
        value: '',
        moveMode: 'and',
        moveFilters: [],
      };
    }
    const field = fields[0];
    return {
      field: field.key,
      operator: field.operators[0],
      value: this.defaultValueForType(field.type),
      moveMode: 'and',
      moveFilters: [],
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
