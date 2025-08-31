import { OverlayModule } from '@angular/cdk/overlay';
import {
  CdkVirtualScrollViewport,
  ScrollingModule,
} from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, forwardRef, input, Input, OnDestroy, OnInit, Output, ViewChild, inject } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  ValidatorFn,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { BehaviorSubject, combineLatest, fromEvent, of, Subject } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  startWith,
  switchMap,
  takeUntil,
} from 'rxjs/operators';
import { DataService } from '../../services/data.service';
import { SpriteComponent } from '../../images/sprite/sprite.component';
import { Pokemon } from '../../interfaces/draft';

@Component({
  selector: 'pokemon-select',
  imports: [
    CommonModule,
    MatFormFieldModule,
    OverlayModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    ScrollingModule,
    MatIconModule,
    SpriteComponent,
  ],
  templateUrl: './pokemon-select.component.html',
  styleUrl: './pokemon-select.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PokemonSelectComponent),
      multi: true,
    },
  ],
})
export class PokemonSelectComponent implements OnInit, OnDestroy {
  private dataService = inject(DataService);

  private destroy$ = new Subject<void>();

  private isLegal: ValidatorFn = (
    control: AbstractControl,
  ): { [key: string]: any } | null => {
    if (control.value === null || typeof control.value === 'string')
      return null;
    return this.options.value.some((pokemon) => pokemon.id === control.value.id)
      ? null
      : { illegal: { value: control.value } };
  };

  highlightedIndex!: number;

  selectedForm = new FormControl<string | null>(null, [this.isLegal]);
  options = new BehaviorSubject<Pokemon[]>([]);
  filteredOptions = new BehaviorSubject<Pokemon[]>([]);

  @Output() pokemonSelected = new EventEmitter<Pokemon | null>();
  @Output() selectionCleared = new EventEmitter();

  private ruleset$ = new BehaviorSubject<string | null>(null);

  @Input()
  label: string = 'Pokémon';

  @Input() appearance: 'fill' | 'outline' = 'fill';
  @Input()
  showSprite: string | null = null;

  @Input()
  class: string | string[] = '';

  @Input()
  set ruleset(value: string | null) {
    this.ruleset$.next(value);
  }

  get setPokemon(): Pokemon | null {
    const value = this.selectedForm.value;
    return typeof value === 'string' || !value ? null : value;
  }

  ngOnInit() {
    this.ruleset$
      .pipe(
        switchMap((value) =>
          value ? this.dataService.getPokemonList(value) : of([]),
        ),
        takeUntil(this.destroy$),
      )
      .subscribe((pokemonList) => {
        this.options.next(pokemonList);
        this.selectedForm.updateValueAndValidity();
      });

    combineLatest([
      this.options,
      this.selectedForm.valueChanges.pipe(
        startWith(null),
        debounceTime(150),
        distinctUntilChanged(),
      ),
    ])
      .pipe(
        map(([names, value]) => this._filter(value)),
        takeUntil(this.destroy$),
      )
      .subscribe((filteredList) => {
        this.filteredOptions.next(filteredList);
      });

    fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => this.handleKeydown(event));

    this.selectedForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        if (value) {
          this.setHighlightedIndex();
          this.scrollToHighlighted();
        }
      });

    this.setHighlightedIndex();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private _filter(value: string | Pokemon | null): Pokemon[] {
    const names = this.options.value;
    if (!value) return this.options.value;
    if (typeof value !== 'string') value = value.name;
    const filterValue = value.toLowerCase();
    return names
      .filter((option) => option.name.toLowerCase().includes(filterValue))
      .sort((a, b) => {
        const aStartsWith = a.name.toLowerCase().startsWith(filterValue);
        const bStartsWith = b.name.toLowerCase().startsWith(filterValue);
        return aStartsWith === bStartsWith ? 0 : aStartsWith ? -1 : 1;
      });
  }

  clearSelection($event: Event | undefined = undefined) {
    this.selectedForm.setValue(null);
    this.selectOption(null);
    this.selectionCleared.emit();
    $event?.stopPropagation();
  }

  isDisabled = false;

  displayFn(pokemon: Pokemon | string | null): string {
    if (typeof pokemon === 'string') return pokemon;
    return pokemon ? pokemon.name : '';
  }

  private onChange: (value: Pokemon | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: Pokemon | null): void {
    this.selectedForm.setValue(value?.name || null);
    this.onChange(value);
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  selectOption(option: Pokemon | null): void {
    clearTimeout(this.blurTimeout);
    this.selectedForm.setValue(option?.name || null);
    this.onChange(option);
    if (option) this.pokemonSelected.emit(option);
    this.onTouched();
    this.isOpen = false;
  }

  trackByFn(index: number, item: Pokemon) {
    return item.id;
  }

  @ViewChild('virtualScroll', { static: false })
  virtualScroll!: CdkVirtualScrollViewport;

  handleKeydown(event: KeyboardEvent) {
    if (!this.isOpen) return;

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
        if (this.highlightedIndex !== -1) {
          this.selectOption(options[this.highlightedIndex]);
        }
        event.preventDefault();
        break;
    }
  }

  scrollToHighlighted() {
    if (!this.virtualScroll || this.highlightedIndex === -1) return;

    const viewport = this.virtualScroll;
    const totalItems = this.filteredOptions.value.length;

    const viewportOffset = viewport.measureScrollOffset();
    const viewportSize = viewport.getViewportSize();
    const itemSize = 48;

    const startIndex = Math.floor(viewportOffset / itemSize);
    const endIndex = Math.min(
      startIndex + Math.floor(viewportSize / itemSize),
      totalItems - 1,
    );

    if (this.highlightedIndex < startIndex) {
      viewport.scrollToIndex(this.highlightedIndex, 'instant');
    } else if (this.highlightedIndex >= endIndex) {
      viewport.scrollToIndex(this.highlightedIndex - 4, 'instant');
    }
  }

  setHighlightedIndex() {
    this.highlightedIndex = this.selectedForm.value
      ? this.filteredOptions.value.findIndex(
          (pokemon) => pokemon.name === this.selectedForm.value,
        )
      : 0;
  }

  isOpen = false;

  setOpen(value: boolean) {
    if (this.isOpen !== value && this.isOpen) {
      this.setHighlightedIndex();
    }

    this.isOpen = value;
  }

  private blurTimeout: any; //timeout | undefined

  onBlur() {
    this.blurTimeout = setTimeout(() => {
      this.setOpen(false);
    }, 300);
  }
}
