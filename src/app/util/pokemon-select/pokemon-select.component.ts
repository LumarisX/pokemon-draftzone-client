import { OverlayModule } from '@angular/cdk/overlay';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  forwardRef,
  input,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  ValidatorFn,
} from '@angular/forms';
import {
  MAT_AUTOCOMPLETE_DEFAULT_OPTIONS,
  MatAutocompleteModule,
} from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { BehaviorSubject, combineLatest, of } from 'rxjs';
import { Observable } from 'rxjs/internal/Observable';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  startWith,
  switchMap,
} from 'rxjs/operators';
import { DataService } from '../../api/data.service';
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
    MatAutocompleteModule,
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
    {
      provide: MAT_AUTOCOMPLETE_DEFAULT_OPTIONS,
      useValue: { overlayPanelClass: 'panel-full-screen-on-mobile' },
    },
  ],
})
export class PokemonSelectComponent implements OnInit {
  private isLegal: ValidatorFn = (
    control: AbstractControl,
  ): { [key: string]: any } | null => {
    if (control.value === null || typeof control.value === 'string')
      return null;
    return this.options.value.some((pokemon) => pokemon.id === control.value.id)
      ? null
      : { illegal: { value: control.value } };
  };

  selectedForm = new FormControl<Pokemon | string | null>(null, [this.isLegal]);
  options = new BehaviorSubject<Pokemon[]>([]);
  filteredOptions!: Observable<Pokemon[]>;

  @Output() pokemonSelected = new EventEmitter<Pokemon | null>();

  constructor(private dataService: DataService) {}

  private ruleset$ = new BehaviorSubject<string | null>(null);

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
      )
      .subscribe((pokemonList) => {
        this.options.next(pokemonList);
        this.selectedForm.updateValueAndValidity();
      });
    this.filteredOptions = combineLatest([
      this.options,
      this.selectedForm.valueChanges.pipe(
        startWith(null),
        debounceTime(150),
        distinctUntilChanged(),
      ),
    ]).pipe(map(([names, value]) => this._filter(value)));
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
    $event?.stopPropagation();
  }

  isDisabled = false;

  displayName(value: any) {
    return value?.name ?? '';
  }

  onBlur() {
    if (typeof this.selectedForm.value === 'string') {
      this.selectedForm.setValue(null);
    }
  }

  private onChange: (value: Pokemon | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: Pokemon | null): void {
    this.selectedForm.setValue(value);
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
    this.onChange(option);
    this.pokemonSelected.emit(option);
    this.onTouched();
  }

  onAutocompleteOpened() {
    requestAnimationFrame(() => {
      const overlay = document.querySelector(
        '.mat-mdc-autocomplete-panel',
      ) as HTMLElement;
      if (!overlay) return;
      const y = overlay.getBoundingClientRect().top;
      document.documentElement.style.setProperty('--overlay-top', `${y}px`);
    });
  }
}
