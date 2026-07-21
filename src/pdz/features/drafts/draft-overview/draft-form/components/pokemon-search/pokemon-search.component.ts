import { OverlayModule } from '@angular/cdk/overlay';
import {
  CdkVirtualScrollViewport,
  ScrollingModule,
} from '@angular/cdk/scrolling';
import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject, Subject, combineLatest } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  startWith,
  takeUntil,
} from 'rxjs/operators';
import { DraftPokemon } from '@pdz/features/drafts/draft.model';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';

const ITEM_SIZE = 44;
const MAX_LIST_HEIGHT = 308;

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
})
export class PokemonSearchComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private blurTimeout?: ReturnType<typeof setTimeout>;

  @Input({ required: true }) options$!: BehaviorSubject<DraftPokemon[]>;
  @Input() placeholder = 'Search Pokémon...';
  @Input() takenIds: (string | null | undefined)[] = [];

  @Output() pokemonSelected = new EventEmitter<DraftPokemon>();

  query = new FormControl<string>('', { nonNullable: true });
  filteredOptions = new BehaviorSubject<DraftPokemon[]>([]);
  highlightedIndex = 0;
  isOpen = false;

  readonly itemSize = ITEM_SIZE;

  @ViewChild('virtualScroll', { static: false })
  virtualScroll?: CdkVirtualScrollViewport;

  ngOnInit(): void {
    combineLatest([
      this.options$,
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

  get listHeight(): string {
    const count = Math.max(this.filteredOptions.value.length, 1);
    return `${Math.min(count * ITEM_SIZE, MAX_LIST_HEIGHT)}px`;
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

  isTaken(option: DraftPokemon): boolean {
    return this.takenIds.includes(option.id);
  }

  setOpen(value: boolean): void {
    this.isOpen = value;
  }

  onBlur(): void {
    this.blurTimeout = setTimeout(() => this.setOpen(false), 200);
  }

  clear(): void {
    this.query.setValue('');
  }

  selectOption(option: DraftPokemon): void {
    if (this.isTaken(option)) return;
    clearTimeout(this.blurTimeout);
    this.pokemonSelected.emit(option);
    this.query.setValue('');
  }

  handleKeydown(event: KeyboardEvent): void {
    if (!this.isOpen) {
      if (event.key === 'ArrowDown' || event.key === 'Enter') {
        this.setOpen(true);
      }
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
      case 'Escape':
        this.setOpen(false);
        break;
    }
  }

  trackByFn(index: number, item: DraftPokemon): string {
    return item.id;
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
