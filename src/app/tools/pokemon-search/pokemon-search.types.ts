type Primitive = string | number | boolean;

export type SearchOperator =
  | 'eq'
  | 'ne'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'contains'
  | 'notContains'
  | 'in'
  | 'nin';

export type SearchLogicalMode = 'and' | 'or';

export type SearchFieldType = 'string' | 'number' | 'boolean';

export type MoveField =
  | 'name'
  | 'type'
  | 'category'
  | 'basePower'
  | 'accuracy'
  | 'pp'
  | 'priority'
  | 'target';

export type SearchField =
  | 'id'
  | 'name'
  | 'fullname'
  | 'baseSpecies'
  | 'num'
  | 'gen'
  | 'tier'
  | 'natDexTier'
  | 'doublesTier'
  | 'isNonstandard'
  | 'types'
  | 'abilities'
  | 'eggGroups'
  | 'weaks'
  | 'resists'
  | 'immunities'
  | 'tags'
  | 'weightkg'
  | 'bst'
  | 'cst'
  | 'hp'
  | 'atk'
  | 'def'
  | 'spa'
  | 'spd'
  | 'spe'
  | 'nfe'
  | 'evolved'
  | 'isMega'
  | 'isPrimal'
  | 'isGigantamax'
  | 'prevo'
  | 'evos'
  | 'requiredAbility'
  | 'requiredItem'
  | 'requiredItems'
  | 'requiredMove'
  | 'learns'
  | 'coverage';

export type MoveFilter = {
  field: MoveField;
  operator: SearchOperator;
  value: Primitive;
};

export type SearchFilter = {
  field: SearchField;
  operator: SearchOperator;
  value?: Primitive;
  moveMode?: SearchLogicalMode;
  moveFilters?: MoveFilter[];
};

export type SearchPokemonRequest = {
  mode: SearchLogicalMode;
  searches: SearchFilter[];
};

export type LegacySearchPokemonRequest = SearchPokemonRequest & {
  sortBy?: SearchField;
  sortDirection?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
};

export type FieldDefinition = {
  key: SearchField;
  label: string;
  type: SearchFieldType;
  operators: SearchOperator[];
};

export type MoveFieldDefinition = {
  key: MoveField;
  label: string;
  type: SearchFieldType;
  operators: SearchOperator[];
};

const STRING_OPERATORS: SearchOperator[] = [
  'eq',
  'ne',
  'contains',
  'notContains',
  'in',
  'nin',
];

const NUMBER_OPERATORS: SearchOperator[] = [
  'eq',
  'ne',
  'gt',
  'gte',
  'lt',
  'lte',
  'in',
  'nin',
];

const BOOLEAN_OPERATORS: SearchOperator[] = ['eq', 'ne'];

export const FIELD_DEFINITIONS: FieldDefinition[] = [
  { key: 'name', label: 'Name', type: 'string', operators: STRING_OPERATORS },
  {
    key: 'baseSpecies',
    label: 'Base Species',
    type: 'string',
    operators: STRING_OPERATORS,
  },
  {
    key: 'num',
    label: 'Dex Number',
    type: 'number',
    operators: NUMBER_OPERATORS,
  },
  {
    key: 'gen',
    label: 'Generation',
    type: 'number',
    operators: NUMBER_OPERATORS,
  },
  { key: 'tier', label: 'Tier', type: 'string', operators: STRING_OPERATORS },
  {
    key: 'natDexTier',
    label: 'NatDex Tier',
    type: 'string',
    operators: STRING_OPERATORS,
  },
  {
    key: 'doublesTier',
    label: 'Doubles Tier',
    type: 'string',
    operators: STRING_OPERATORS,
  },
  {
    key: 'isNonstandard',
    label: 'Nonstandard',
    type: 'string',
    operators: STRING_OPERATORS,
  },
  { key: 'types', label: 'Types', type: 'string', operators: STRING_OPERATORS },
  {
    key: 'abilities',
    label: 'Abilities',
    type: 'string',
    operators: STRING_OPERATORS,
  },
  {
    key: 'eggGroups',
    label: 'Egg Groups',
    type: 'string',
    operators: STRING_OPERATORS,
  },
  {
    key: 'weaks',
    label: 'Weaknesses',
    type: 'string',
    operators: STRING_OPERATORS,
  },
  {
    key: 'resists',
    label: 'Resistances',
    type: 'string',
    operators: STRING_OPERATORS,
  },
  {
    key: 'immunities',
    label: 'Immunities',
    type: 'string',
    operators: STRING_OPERATORS,
  },
  { key: 'tags', label: 'Tags', type: 'string', operators: STRING_OPERATORS },
  {
    key: 'weightkg',
    label: 'Weight (kg)',
    type: 'number',
    operators: NUMBER_OPERATORS,
  },
  { key: 'bst', label: 'BST', type: 'number', operators: NUMBER_OPERATORS },
  { key: 'cst', label: 'CST', type: 'number', operators: NUMBER_OPERATORS },
  { key: 'hp', label: 'HP', type: 'number', operators: NUMBER_OPERATORS },
  { key: 'atk', label: 'Attack', type: 'number', operators: NUMBER_OPERATORS },
  { key: 'def', label: 'Defense', type: 'number', operators: NUMBER_OPERATORS },
  {
    key: 'spa',
    label: 'Special Attack',
    type: 'number',
    operators: NUMBER_OPERATORS,
  },
  {
    key: 'spd',
    label: 'Special Defense',
    type: 'number',
    operators: NUMBER_OPERATORS,
  },
  { key: 'spe', label: 'Speed', type: 'number', operators: NUMBER_OPERATORS },
  {
    key: 'nfe',
    label: 'Not Fully Evolved',
    type: 'boolean',
    operators: BOOLEAN_OPERATORS,
  },
  {
    key: 'evolved',
    label: 'Fully Evolved',
    type: 'boolean',
    operators: BOOLEAN_OPERATORS,
  },
  {
    key: 'isMega',
    label: 'Is Mega',
    type: 'boolean',
    operators: BOOLEAN_OPERATORS,
  },
  {
    key: 'isPrimal',
    label: 'Is Primal',
    type: 'boolean',
    operators: BOOLEAN_OPERATORS,
  },
  {
    key: 'isGigantamax',
    label: 'Is Gigantamax',
    type: 'boolean',
    operators: BOOLEAN_OPERATORS,
  },
  {
    key: 'prevo',
    label: 'Pre-evolution',
    type: 'string',
    operators: STRING_OPERATORS,
  },
  {
    key: 'evos',
    label: 'Evolutions',
    type: 'string',
    operators: STRING_OPERATORS,
  },
  {
    key: 'requiredAbility',
    label: 'Required Ability',
    type: 'string',
    operators: STRING_OPERATORS,
  },
  {
    key: 'requiredItem',
    label: 'Required Item',
    type: 'string',
    operators: STRING_OPERATORS,
  },
  {
    key: 'requiredMove',
    label: 'Required Move',
    type: 'string',
    operators: STRING_OPERATORS,
  },
  {
    key: 'learns',
    label: 'Learnset (with move filters)',
    type: 'string',
    operators: ['contains'],
  },
  {
    key: 'coverage',
    label: 'Coverage',
    type: 'string',
    operators: STRING_OPERATORS,
  },
];

export const MOVE_FIELD_DEFINITIONS: MoveFieldDefinition[] = [
  {
    key: 'name',
    label: 'Move Name',
    type: 'string',
    operators: STRING_OPERATORS,
  },
  {
    key: 'type',
    label: 'Move Type',
    type: 'string',
    operators: STRING_OPERATORS,
  },
  {
    key: 'category',
    label: 'Category',
    type: 'string',
    operators: ['eq', 'ne', 'in', 'nin'],
  },
  {
    key: 'basePower',
    label: 'Base Power',
    type: 'number',
    operators: NUMBER_OPERATORS,
  },
  {
    key: 'accuracy',
    label: 'Accuracy',
    type: 'number',
    operators: NUMBER_OPERATORS,
  },
  { key: 'pp', label: 'PP', type: 'number', operators: NUMBER_OPERATORS },
  {
    key: 'priority',
    label: 'Priority',
    type: 'number',
    operators: NUMBER_OPERATORS,
  },
  {
    key: 'target',
    label: 'Target',
    type: 'string',
    operators: STRING_OPERATORS,
  },
];

export const DEFAULT_PAGE_SIZE = 50;
