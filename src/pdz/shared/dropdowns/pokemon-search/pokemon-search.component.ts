import { OverlayModule } from '@angular/cdk/overlay';
import {
  CdkVirtualScrollViewport,
  ScrollingModule,
} from '@angular/cdk/scrolling';
import {
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  inject,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { DataService } from '@pdz/core/services/data.service';
import { DraftPokemon } from '@pdz/features/drafts/draft.model';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { BehaviorSubject, Observable, Subject, combineLatest, of } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  startWith,
  switchMap,
  takeUntil,
} from 'rxjs/operators';

const ITEM_SIZE = 44;
const MAX_LIST_HEIGHT = 308;

/** Options may carry draft pricing; the row shows it when they do. */
export type PokemonSearchOption = DraftPokemon & {
  cost?: number;
  tier?: string;
};

@Component({
  selector: 'pdz-pokemon-search',
  imports: [
    OverlayModule,
    ScrollingModule,
    ReactiveFormsModule,
    IconComponent,
    SpriteComponent,
  ],
  templateUrl: './pokemon-search.component.html',
  styleUrl: './pokemon-search.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PokemonSearchComponent),
      multi: true,
    },
  ],
})
export class PokemonSearchComponent
  implements ControlValueAccessor, OnInit, OnDestroy
{
  private readonly dataService = inject(DataService);
  private readonly destroy$ = new Subject<void>();
  private readonly ruleset$ = new BehaviorSubject<string | null>(null);
  private blurTimeout?: ReturnType<typeof setTimeout>;

  /** Supply either an explicit option stream or a `ruleset` to load one from. */
  @Input() options$?: BehaviorSubject<DraftPokemon[]>;
  @Input() set ruleset(value: string | null) {
    this.ruleset$.next(value);
  }

  /**
   * `search` clears the field after every pick, for repeated adds.
   * `select` keeps the pick visible as the field's value, for form controls.
   */
  @Input() mode: 'search' | 'select' = 'search';
  @Input() placeholder = 'Search Pokémon...';
  @Input() takenIds: (string | null | undefined)[] = [];

  @Output() pokemonSelected = new EventEmitter<DraftPokemon>();
  @Output() selectionCleared = new EventEmitter<void>();

  query = new FormControl<string>('', { nonNullable: true });
  filteredOptions = new BehaviorSubject<DraftPokemon[]>([]);
  highlightedIndex = 0;
  isOpen = false;
  isEditing = false;
  disabled = false;
  value: DraftPokemon | null = null;

  /**
   * Field width captured when the panel opens. Measured on open rather than
   * bound to `offsetWidth` directly, so a field rendered into a layout that is
   * still settling doesn't report two different widths across change-detection
   * passes (NG0100).
   */
  panelWidth = 0;

  readonly itemSize = ITEM_SIZE;

  @ViewChild('fieldEl', { static: true })
  fieldEl?: ElementRef<HTMLElement>;

  @ViewChild('inputEl')
  inputEl?: ElementRef<HTMLInputElement>;

  @ViewChild('virtualScroll', { static: false })
  virtualScroll?: CdkVirtualScrollViewport;

  private onChange: (value: DraftPokemon | null) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit(): void {
    combineLatest([
      this.optionSource(),
      this.query.valueChanges.pipe(
        startWith(''),
        debounceTime(100),
        distinctUntilChanged(),
      ),
    ])
      .pipe(
        map(([options, value]) => this.filter(options, value)),
        takeUntil(this.destroy$),
      )
      .subscribe((filtered) => {
        this.filteredOptions.next(filtered);
        this.highlightedIndex = 0;
        this.virtualScroll?.scrollToIndex(0, 'instant');
      });
  }

  ngOnDestroy(): void {
    clearTimeout(this.blurTimeout);
    this.destroy$.next();
    this.destroy$.complete();
  }

  writeValue(value: DraftPokemon | null): void {
    this.value = value;
    this.isEditing = false;
  }

  registerOnChange(fn: (value: DraftPokemon | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (isDisabled) this.query.disable({ emitEvent: false });
    else this.query.enable({ emitEvent: false });
  }

  get showsSelection(): boolean {
    return this.mode === 'select' && !!this.value && !this.isEditing;
  }

  get listHeight(): string {
    const count = Math.max(this.filteredOptions.value.length, 1);
    return `${Math.min(count * ITEM_SIZE, MAX_LIST_HEIGHT)}px`;
  }

  isTaken(option: DraftPokemon): boolean {
    return this.takenIds.includes(option.id);
  }

  costOf(option: DraftPokemon): number | undefined {
    return (option as PokemonSearchOption).cost;
  }

  tierOf(option: DraftPokemon): string | undefined {
    return (option as PokemonSearchOption).tier;
  }

  setOpen(value: boolean): void {
    if (value && this.fieldEl)
      this.panelWidth = this.fieldEl.nativeElement.offsetWidth;
    this.isOpen = value;
  }

  onBlur(): void {
    this.blurTimeout = setTimeout(() => {
      this.setOpen(false);
      this.isEditing = false;
      this.onTouched();
    }, 200);
  }

  beginEdit(): void {
    if (this.disabled) return;
    this.isEditing = true;
    this.query.setValue('');
    setTimeout(() => {
      this.inputEl?.nativeElement.focus();
      this.setOpen(true);
    });
  }

  clear(): void {
    this.query.setValue('');
    this.inputEl?.nativeElement.focus();
  }

  clearSelection(event?: Event): void {
    event?.stopPropagation();
    clearTimeout(this.blurTimeout);
    this.value = null;
    this.isEditing = false;
    this.query.setValue('');
    this.onChange(null);
    this.onTouched();
    this.selectionCleared.emit();
  }

  selectOption(option: DraftPokemon): void {
    if (this.isTaken(option)) return;
    clearTimeout(this.blurTimeout);
    this.value = option;
    this.isEditing = false;
    this.isOpen = false;
    this.query.setValue('');
    this.onChange(option);
    this.onTouched();
    this.pokemonSelected.emit(option);
  }

  handleKeydown(event: KeyboardEvent): void {
    if (!this.isOpen) {
      if (event.key === 'ArrowDown' || event.key === 'Enter') {
        this.setOpen(true);
      }
      return;
    }

    if (event.key === 'Escape') {
      this.setOpen(false);
      this.isEditing = false;
      return;
    }

    const options = this.filteredOptions.value;
    if (!options.length) return;

    switch (event.key) {
      case 'ArrowDown':
        this.highlightedIndex = (this.highlightedIndex + 1) % options.length;
        this.scrollToHighlighted();
        event.preventDefault();
        break;
      case 'ArrowUp':
        this.highlightedIndex =
          (this.highlightedIndex - 1 + options.length) % options.length;
        this.scrollToHighlighted();
        event.preventDefault();
        break;
      case 'Enter':
        this.selectOption(options[this.highlightedIndex]);
        event.preventDefault();
        break;
    }
  }

  trackByFn(index: number, item: DraftPokemon): string {
    return item.id;
  }

  private optionSource(): Observable<DraftPokemon[]> {
    return (
      this.options$ ??
      this.ruleset$.pipe(
        switchMap((ruleset) =>
          ruleset ? this.dataService.getPokemonList(ruleset) : of([]),
        ),
      )
    );
  }

  private filter(options: DraftPokemon[], value: string): DraftPokemon[] {
    const filterValue = value.trim().toLowerCase();
    if (!filterValue) return options;
    return options
      .filter((option) => option.name.toLowerCase().includes(filterValue))
      .sort((a, b) => {
        const aStartsWith = a.name.toLowerCase().startsWith(filterValue);
        const bStartsWith = b.name.toLowerCase().startsWith(filterValue);
        return aStartsWith === bStartsWith ? 0 : aStartsWith ? -1 : 1;
      });
  }

  private scrollToHighlighted(): void {
    if (!this.virtualScroll) return;

    const viewport = this.virtualScroll;
    const viewportOffset = viewport.measureScrollOffset();
    const visibleCount = Math.floor(viewport.getViewportSize() / ITEM_SIZE);
    const startIndex = Math.floor(viewportOffset / ITEM_SIZE);
    const endIndex = startIndex + visibleCount - 1;

    if (this.highlightedIndex < startIndex) {
      viewport.scrollToIndex(this.highlightedIndex, 'instant');
    } else if (this.highlightedIndex > endIndex) {
      viewport.scrollToIndex(
        this.highlightedIndex - visibleCount + 1,
        'instant',
      );
    }
  }
}
