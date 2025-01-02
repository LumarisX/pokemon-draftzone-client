import { OverlayModule } from '@angular/cdk/overlay';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { Component, forwardRef, OnInit } from '@angular/core';
import {
  FormControl,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Observable } from 'rxjs/internal/Observable';
import { map, startWith } from 'rxjs/operators';
import { nameList } from '../../data/namedex';
import { Pokemon } from '../../interfaces/draft';
import { SpriteComponent } from '../../images/sprite/sprite.component';

@Component({
  selector: 'pokemon-select',

  standalone: true,
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
  ],
})
export class PokemonSelectComponent implements OnInit {
  selectedForm = new FormControl();
  names: Pokemon[] = nameList();
  filteredOptions!: Observable<Pokemon[]>;
  selected: Pokemon | null = null;

  ngOnInit() {
    this.filteredOptions = this.selectedForm.valueChanges.pipe(
      startWith(''),
      map((value) => this._filter(value)),
    );
  }

  private _filter(value: string | Pokemon | null): Pokemon[] {
    if (!value) return this.names;
    if (typeof value !== 'string') value = value.name;
    console.log(value);
    const filterValue = value.toLowerCase();
    const filteredNames = this.names
      .filter((option) => option.name.toLowerCase().includes(filterValue))
      .sort((a, b) => {
        const aStartsWith = a.name.toLowerCase().startsWith(filterValue);
        const bStartsWith = b.name.toLowerCase().startsWith(filterValue);
        return aStartsWith === bStartsWith ? 0 : aStartsWith ? -1 : 1;
      });

    return filteredNames;
  }

  clearSelection($event: Event | undefined = undefined) {
    this.selected = null;
    this.selectOption(null);
    $event?.stopPropagation();
  }

  isDisabled = false;

  displayName(value: any) {
    return value?.name ?? '';
  }

  private onChange: (value: Pokemon | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: Pokemon | null): void {
    this.selected = value;
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
    console.log('here');
    this.onChange(option);
    this.onTouched();
  }
}
