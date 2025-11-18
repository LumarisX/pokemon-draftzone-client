import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TYPES } from '../../../data';

type Option = {
  name: string;
  value: string;
  operations: ('=' | '≠' | '>=' | '>' | '<' | '<=' | '∈' | '∉')[];
  query:
    | ''
    | 'string'
    | 'boolean'
    | 'type'
    | 'number'
    | 'tier'
    | 'eggs'
    | 'evolves';
};

type Conditional = {
  option: string;
  operation: string | undefined;
  value: string | number | boolean | undefined;
};

@Component({
  selector: 'find-option',
  standalone: true,
  templateUrl: './find-option.component.html',
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
})
export class FindOptionComponent {
  @Output() queryChange = new EventEmitter<Conditional>();

  set selectedOption(option: Option) {
    this.condition.operation = option.operations[0];
    switch (option.query) {
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
        this.queryValue = 'OU';
        break;
      case 'eggs':
        this.queryValue = this.eggGroups[0];
        break;
      case 'evolves':
        this.queryValue = this.evolveOptions[0];
        break;
      case 'boolean':
        this.queryValue = false;
        break;
      default:
        this.queryValue = '';
    }
    this.condition.option = option.value;
    this.queryChange.emit(this.condition);
  }

  get selectedOption() {
    return (
      this.options.find((option) => option.value == this.condition.option) ||
      this.options[0]
    );
  }

  @Input()
  condition!: Conditional;

  set queryValue(value: number | string | undefined | boolean) {
    this.condition.value = value;
    this.queryChange.emit(this.condition);
  }

  get queryValue() {
    return this.condition.value;
  }

  typeOptions = TYPES;
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

  evolveOptions = ['Fully Evolved', 'Unevolved'];

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
      value: 'spa',
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
      name: 'Evolved',
      value: 'evolved',
      operations: ['=', '≠'],
      query: 'evolves',
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

  onOperationChange() {
    this.queryChange.emit(this.condition);
  }
}
