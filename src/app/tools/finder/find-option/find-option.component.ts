import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

type Option = {
  name: string;
  value: string;
  operations: ('=' | '≠' | '>=' | '>' | '<' | '<=' | '∈' | '∉')[];
  query: '' | 'string' | 'boolean' | 'type' | 'number' | 'tier' | 'eggs';
};

@Component({
  selector: 'find-option',
  standalone: true,
  templateUrl: './find-option.component.html',
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
})
export class FindOptionComponent implements OnInit {
  @Output() queryChange = new EventEmitter<{
    option: string;
    operation: string | undefined;
    value: string | number | boolean | undefined;
  }>();
  selectedOption: Option = {
    name: 'Select',
    value: '',
    operations: [],
    query: '',
  };

  _queryValue: number | string | undefined | boolean;

  set queryValue(value: number | string | undefined | boolean) {
    this._queryValue = value;
    this.onQueryChange();
  }

  get queryValue() {
    return this._queryValue;
  }

  ngOnInit(): void {
    this.selectedOption = this.options[0]; // Default to the first option
    this.selectedOperation = this.selectedOption.operations[0]; // Default to the first operation, if any

    // Set default queryValue based on the selectedOption.query type
    this.setDefaultQueryValue();
  }

  setDefaultQueryValue() {
    switch (this.selectedOption.query) {
      case 'string':
        this.queryValue = '';
        break;
      case 'number':
        this.queryValue = 0;
        break;
      case 'type':
        this.queryValue = this.typeOptions[0];
        break;
      case 'tier':
        this.queryValue = this.tiers[0];
        break;
      case 'eggs':
        this.queryValue = this.eggGroups[0];
        break;
      case 'boolean':
        this.queryValue = false;
        break;
      default:
        this.queryValue = undefined;
    }
  }

  selectedOperation: string | undefined;
  typeOptions = [
    'Normal',
    'Fighting',
    'Flying',
    'Poison',
    'Ground',
    'Rock',
    'Bug',
    'Ghost',
    'Steel',
    'Fire',
    'Water',
    'Grass',
    'Electric',
    'Psychic',
    'Ice',
    'Dragon',
    'Dark',
    'Fairy',
  ];
  tiers = [
    'AG',
    'UBER',
    'OU',
    'UUBL',
    'UU',
    'RUBL',
    'RU',
    'NUBL',
    'NU',
    'PUBL',
    'PU',
    'ZUBL',
    'ZU',
  ];

  eggGroups = [
    'Monster',
    'Water 1',
    'Bug',
    'Flying',
    'Field',
    'Fairy',
    'Grass',
    'Human-Like',
    'Water 3',
    'Mineral',
    'Amorphous',
    'Water 2',
    'Ditto',
    'Dragon',
    'Undiscovered',
  ];
  options: Option[] = [
    {
      name: 'Select',
      value: '',
      operations: [],
      query: '',
    },
    {
      name: 'Ability',
      value: 'abilities',
      operations: ['∈', '∉'],
      query: 'string',
    },
    {
      name: 'Type',
      value: 'types',
      operations: ['∈', '∉'],
      query: 'type',
    },
    {
      name: 'Name',
      value: 'name',
      operations: ['=', '≠', '∈', '∉'],
      query: 'string',
    },
    {
      name: 'BST',
      value: 'bst',
      operations: ['=', '≠', '>=', '>', '<', '<='],
      query: 'number',
    },
    {
      name: 'HP',
      value: 'hp',
      operations: ['=', '≠', '>=', '>', '<', '<='],
      query: 'number',
    },
    {
      name: 'Attack',
      value: 'atk',
      operations: ['=', '≠', '>=', '>', '<', '<='],
      query: 'number',
    },
    {
      name: 'Defense',
      value: 'def',
      operations: ['=', '≠', '>=', '>', '<', '<='],
      query: 'number',
    },
    {
      name: 'Special Attack',
      value: 'def',
      operations: ['=', '≠', '>=', '>', '<', '<='],
      query: 'number',
    },
    {
      name: 'Special Defense',
      value: 'spd',
      operations: ['=', '≠', '>=', '>', '<', '<='],
      query: 'number',
    },
    {
      name: 'Speed',
      value: 'spe',
      operations: ['=', '≠', '>=', '>', '<', '<='],
      query: 'number',
    },
    {
      name: 'Weaknesses',
      value: 'weaks',
      operations: ['∈', '∉'],
      query: 'type',
    },
    {
      name: 'Resistances',
      value: 'resists',
      operations: ['∈', '∉'],
      query: 'type',
    },
    {
      name: 'Immunities',
      value: 'immunities',
      operations: ['∈', '∉'],
      query: 'type',
    },
    {
      name: 'Coverage',
      value: 'coverage',
      operations: ['∈', '∉'],
      query: 'string',
    },
    {
      name: 'Moveset',
      value: 'learns',
      operations: ['∈', '∉'],
      query: 'string',
    },
    {
      name: 'Not Fully Evolved',
      value: 'nfe',
      operations: ['='],
      query: 'boolean',
    },
    {
      name: 'Tier',
      value: 'tier',
      operations: ['=', '≠', '>=', '<='],
      query: 'tier',
    },
    {
      name: 'Doubles Tier',
      value: 'doubletier',
      operations: ['=', '≠', '>=', '<='],
      query: 'tier',
    },
    {
      name: 'National Dex #',
      value: 'dexnum',
      operations: ['=', '≠', '>=', '>', '<', '<='],
      query: 'number',
    },
    {
      name: 'Egg Group',
      value: 'dexnum',
      operations: ['∈', '∉'],
      query: 'eggs',
    },
    {
      name: 'Weight (kg)',
      value: 'weight',
      operations: ['=', '≠', '>=', '>', '<', '<='],
      query: 'number',
    },
    {
      name: 'Tags',
      value: 'tags',
      operations: ['∈', '∉'],
      query: 'string',
    },
  ];

  onQueryChange() {
    this.queryChange.emit({
      option: this.selectedOption.value,
      operation: this.selectedOperation,
      value: this.queryValue,
    });
  }

  onOptionChange() {
    this.selectedOperation = this.selectedOption.operations[0];
    if (this.selectedOption.query == 'boolean') {
      this.queryValue = false;
    } else {
      this.queryValue = undefined;
    }
  }

  onOperationChange() {
    this.onQueryChange();
  }
}
