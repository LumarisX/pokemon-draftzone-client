import { OverlayModule } from '@angular/cdk/overlay';
import {
  CdkVirtualScrollViewport,
  ScrollingModule,
} from '@angular/cdk/scrolling';
import {
  booleanAttribute,
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
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
import { BehaviorSubject, combineLatest, Observable, of, Subject } from 'rxjs';
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
  private blurTimeout?: ReturnType<typeof setTimeout>;
  readonly options$ = input<BehaviorSubject<DraftPokemon[]>>();
  readonly placeholder = input('Search Pokémon...');
  readonly takenIds = input<(string | null | undefined)[]>([]);

  readonly mode = input<'search' | 'select'>('search');
  readonly density = input<'comfortable' | 'compact'>('comfortable');
  readonly locked = input(false, { transform: booleanAttribute });

  readonly ruleset = input<string | null>(null);

  private readonly ruleset$ = toObservable(this.ruleset);
  @Output() pokemonSelected = new EventEmitter<DraftPokemon>();
  @Output() selectionCleared = new EventEmitter<void>();

  query = new FormControl<string>('', { nonNullable: true });
  filteredOptions = new BehaviorSubject<DraftPokemon[]>([]);
  highlightedIndex = 0;
  isOpen = false;
  isEditing = false;
  disabled = false;
  value: DraftPokemon | null = null;

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
    return this.mode() === 'select' && !!this.value && !this.isEditing;
  }

  get listHeight(): string {
    const count = Math.max(this.filteredOptions.value.length, 1);
    return `${Math.min(count * ITEM_SIZE, MAX_LIST_HEIGHT)}px`;
  }

  isTaken(option: DraftPokemon): boolean {
    return this.takenIds().includes(option.id);
  }

  costOf(option: DraftPokemon): number | undefined {
    return (option as PokemonSearchOption).cost;
  }

  tierOf(option: DraftPokemon): string | undefined {
    return (option as PokemonSearchOption).tier;
  }

  setOpen(value: boolean): void {
    if (value && this.locked()) return;
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
    if (this.disabled || this.locked()) return;
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
      this.options$() ??
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
