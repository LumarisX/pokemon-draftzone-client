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
  category?: string;
  valueType?: 'type';
};

export type DraftMoveFilter = {
  id: string;
  field: MoveField;
  operator: SearchOperator;
  value: string | number | boolean | undefined;
};

export type DraftFilter = {
  field: SearchField;
  operator: SearchOperator;
  value: string | number | boolean | undefined;
  moveMode: SearchLogicalMode;
  moveFilters: DraftMoveFilter[];
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
  {
    key: 'name',
    label: 'Name',
    type: 'string',
    operators: STRING_OPERATORS,
    category: 'Identity',
  },
  {
    key: 'baseSpecies',
    label: 'Base Species',
    type: 'string',
    operators: STRING_OPERATORS,
    category: 'Identity',
  },
  {
    key: 'num',
    label: 'Dex Number',
    type: 'number',
    operators: NUMBER_OPERATORS,
    category: 'Identity',
  },
  {
    key: 'gen',
    label: 'Generation',
    type: 'number',
    operators: NUMBER_OPERATORS,
    category: 'Identity',
  },
  {
    key: 'tier',
    label: 'Tier',
    type: 'string',
    operators: STRING_OPERATORS,
    category: 'Tier / Meta',
  },
  {
    key: 'natDexTier',
    label: 'NatDex Tier',
    type: 'string',
    operators: STRING_OPERATORS,
    category: 'Tier / Meta',
  },
  {
    key: 'doublesTier',
    label: 'Doubles Tier',
    type: 'string',
    operators: STRING_OPERATORS,
    category: 'Tier / Meta',
  },
  {
    key: 'isNonstandard',
    label: 'Nonstandard',
    type: 'string',
    operators: STRING_OPERATORS,
    category: 'Tier / Meta',
  },
  {
    key: 'types',
    label: 'Types',
    type: 'string',
    operators: STRING_OPERATORS,
    category: 'Typing',
    valueType: 'type',
  },
  {
    key: 'weaks',
    label: 'Weaknesses',
    type: 'string',
    operators: STRING_OPERATORS,
    category: 'Typing',
    valueType: 'type',
  },
  {
    key: 'resists',
    label: 'Resistances',
    type: 'string',
    operators: STRING_OPERATORS,
    category: 'Typing',
    valueType: 'type',
  },
  {
    key: 'immunities',
    label: 'Immunities',
    type: 'string',
    operators: STRING_OPERATORS,
    category: 'Typing',
    valueType: 'type',
  },
  {
    key: 'abilities',
    label: 'Abilities',
    type: 'string',
    operators: STRING_OPERATORS,
    category: 'Abilities',
  },
  {
    key: 'requiredAbility',
    label: 'Required Ability',
    type: 'string',
    operators: STRING_OPERATORS,
    category: 'Abilities',
  },
  {
    key: 'hp',
    label: 'HP',
    type: 'number',
    operators: NUMBER_OPERATORS,
    category: 'Stats',
  },
  {
    key: 'atk',
    label: 'Attack',
    type: 'number',
    operators: NUMBER_OPERATORS,
    category: 'Stats',
  },
  {
    key: 'def',
    label: 'Defense',
    type: 'number',
    operators: NUMBER_OPERATORS,
    category: 'Stats',
  },
  {
    key: 'spa',
    label: 'Special Attack',
    type: 'number',
    operators: NUMBER_OPERATORS,
    category: 'Stats',
  },
  {
    key: 'spd',
    label: 'Special Defense',
    type: 'number',
    operators: NUMBER_OPERATORS,
    category: 'Stats',
  },
  {
    key: 'spe',
    label: 'Speed',
    type: 'number',
    operators: NUMBER_OPERATORS,
    category: 'Stats',
  },
  {
    key: 'bst',
    label: 'BST',
    type: 'number',
    operators: NUMBER_OPERATORS,
    category: 'Stats',
  },
  {
    key: 'cst',
    label: 'CST',
    type: 'number',
    operators: NUMBER_OPERATORS,
    category: 'Stats',
  },
  {
    key: 'weightkg',
    label: 'Weight (kg)',
    type: 'number',
    operators: NUMBER_OPERATORS,
    category: 'Stats',
  },
  {
    key: 'nfe',
    label: 'Not Fully Evolved',
    type: 'boolean',
    operators: BOOLEAN_OPERATORS,
    category: 'Flags',
  },
  {
    key: 'evolved',
    label: 'Fully Evolved',
    type: 'boolean',
    operators: BOOLEAN_OPERATORS,
    category: 'Flags',
  },
  {
    key: 'isMega',
    label: 'Is Mega',
    type: 'boolean',
    operators: BOOLEAN_OPERATORS,
    category: 'Flags',
  },
  {
    key: 'isPrimal',
    label: 'Is Primal',
    type: 'boolean',
    operators: BOOLEAN_OPERATORS,
    category: 'Flags',
  },
  {
    key: 'isGigantamax',
    label: 'Is Gigantamax',
    type: 'boolean',
    operators: BOOLEAN_OPERATORS,
    category: 'Flags',
  },
  {
    key: 'eggGroups',
    label: 'Egg Groups',
    type: 'string',
    operators: STRING_OPERATORS,
    category: 'Evolution',
  },
  {
    key: 'prevo',
    label: 'Pre-evolution',
    type: 'string',
    operators: STRING_OPERATORS,
    category: 'Evolution',
  },
  {
    key: 'evos',
    label: 'Evolutions',
    type: 'string',
    operators: STRING_OPERATORS,
    category: 'Evolution',
  },
  {
    key: 'requiredItem',
    label: 'Required Item',
    type: 'string',
    operators: STRING_OPERATORS,
    category: 'Evolution',
  },
  {
    key: 'requiredMove',
    label: 'Required Move',
    type: 'string',
    operators: STRING_OPERATORS,
    category: 'Evolution',
  },
  {
    key: 'tags',
    label: 'Tags',
    type: 'string',
    operators: STRING_OPERATORS,
    category: 'Tier / Meta',
  },
  {
    key: 'learns',
    label: 'Learnset',
    type: 'string',
    operators: ['contains'],
    category: 'Moves',
  },
  {
    key: 'coverage',
    label: 'Coverage',
    type: 'string',
    operators: STRING_OPERATORS,
    category: 'Moves',
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
