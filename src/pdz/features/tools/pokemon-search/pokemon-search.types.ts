type Primitive = string | number | boolean;

export type SearchLogicalMode = 'and' | 'or';

export type SearchFieldType = 'string' | 'number' | 'boolean';

// ─── Operators ────────────────────────────────────────────────────────────────

export const OPERATOR_DEFINITIONS = [
  { key: 'eq', symbol: '=', label: 'Equals' },
  { key: 'ne', symbol: '≠', label: 'Not Equals' },
  { key: 'gt', symbol: '>', label: 'Greater Than' },
  { key: 'gte', symbol: '≥', label: 'At Least' },
  { key: 'lt', symbol: '<', label: 'Less Than' },
  { key: 'lte', symbol: '≤', label: 'At Most' },
  { key: 'contains', symbol: '∈', label: 'Contains' },
  { key: 'notContains', symbol: '∉', label: 'Does Not Contain' },
  { key: 'in', symbol: '∈', label: 'In' },
  { key: 'nin', symbol: '∉', label: 'Not In' },
] as const;

export type OperatorDefinition = (typeof OPERATOR_DEFINITIONS)[number];
export type SearchOperator = OperatorDefinition['key'];

export const OPERATOR_MAP: Record<SearchOperator, OperatorDefinition> =
  Object.fromEntries(OPERATOR_DEFINITIONS.map((op) => [op.key, op])) as Record<
    SearchOperator,
    OperatorDefinition
  >;

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
  | 'mythical'
  | 'restrictedLegendary'
  | 'subLegendary'
  | 'ultraBeast'
  | 'paradox'
  | 'prevo'
  | 'evos'
  | 'requiredAbility'
  | 'requiredItem'
  | 'requiredItems'
  | 'requiredMove'
  | 'learns'
  | 'coverage';

// ─── Operator groups ──────────────────────────────────────────────────────────

// Text search: partial match
const CONTAINS_OPERATORS: readonly SearchOperator[] = [
  'contains',
  'notContains',
];
// Categorical: exact match
const EXACT_OPERATORS: readonly SearchOperator[] = ['eq', 'ne'];
// Numeric: full comparison range (no multi-value in/nin — no UI for it)
const NUMERIC_OPERATORS: readonly SearchOperator[] = [
  'eq',
  'ne',
  'gt',
  'gte',
  'lt',
  'lte',
];
// Boolean: yes/no chips already cover both states via eq
const BOOLEAN_OPERATORS: readonly SearchOperator[] = ['eq'];

// ─── Field categories ─────────────────────────────────────────────────────────

export const FIELD_CATEGORIES = [
  'Identity',
  'Typing',
  'Stats',
  'Abilities',
  'Moves',
  'Tier / Meta',
  'Evolution',
  'Tags',
] as const;

export type FieldCategory = (typeof FIELD_CATEGORIES)[number];

export type FieldDefinition = {
  key: SearchField;
  label: string;
  type: SearchFieldType;
  operators: readonly SearchOperator[];
  category?: FieldCategory;
  valueType?: 'type';
};

export const FIELD_DEFINITIONS: FieldDefinition[] = [
  // Identity
  {
    key: 'name',
    label: 'Name',
    type: 'string',
    operators: CONTAINS_OPERATORS,
    category: 'Identity',
  },
  // {
  //   key: 'baseSpecies',
  //   label: 'Base Species',
  //   type: 'string',
  //   operators: CONTAINS_OPERATORS,
  //   category: 'Identity',
  // },
  {
    key: 'num',
    label: 'Dex Number',
    type: 'number',
    operators: NUMERIC_OPERATORS,
    category: 'Identity',
  },
  {
    key: 'gen',
    label: 'Generation',
    type: 'number',
    operators: NUMERIC_OPERATORS,
    category: 'Identity',
  },
  // Typing
  {
    key: 'types',
    label: 'Types',
    type: 'string',
    operators: CONTAINS_OPERATORS,
    category: 'Typing',
    valueType: 'type',
  },
  {
    key: 'weaks',
    label: 'Weaknesses',
    type: 'string',
    operators: CONTAINS_OPERATORS,
    category: 'Typing',
    valueType: 'type',
  },
  {
    key: 'resists',
    label: 'Resistances',
    type: 'string',
    operators: CONTAINS_OPERATORS,
    category: 'Typing',
    valueType: 'type',
  },
  {
    key: 'immunities',
    label: 'Immunities',
    type: 'string',
    operators: CONTAINS_OPERATORS,
    category: 'Typing',
    valueType: 'type',
  },
  // Stats
  {
    key: 'hp',
    label: 'HP',
    type: 'number',
    operators: NUMERIC_OPERATORS,
    category: 'Stats',
  },
  {
    key: 'atk',
    label: 'Attack',
    type: 'number',
    operators: NUMERIC_OPERATORS,
    category: 'Stats',
  },
  {
    key: 'def',
    label: 'Defense',
    type: 'number',
    operators: NUMERIC_OPERATORS,
    category: 'Stats',
  },
  {
    key: 'spa',
    label: 'Sp. Attack',
    type: 'number',
    operators: NUMERIC_OPERATORS,
    category: 'Stats',
  },
  {
    key: 'spd',
    label: 'Sp. Defense',
    type: 'number',
    operators: NUMERIC_OPERATORS,
    category: 'Stats',
  },
  {
    key: 'spe',
    label: 'Speed',
    type: 'number',
    operators: NUMERIC_OPERATORS,
    category: 'Stats',
  },
  {
    key: 'bst',
    label: 'BST',
    type: 'number',
    operators: NUMERIC_OPERATORS,
    category: 'Stats',
  },
  {
    key: 'cst',
    label: 'CST',
    type: 'number',
    operators: NUMERIC_OPERATORS,
    category: 'Stats',
  },
  {
    key: 'weightkg',
    label: 'Weight (kg)',
    type: 'number',
    operators: NUMERIC_OPERATORS,
    category: 'Stats',
  },
  // Abilities
  {
    key: 'abilities',
    label: 'Abilities',
    type: 'string',
    operators: CONTAINS_OPERATORS,
    category: 'Abilities',
  },
  // {
  //   key: 'requiredAbility',
  //   label: 'Required Ability',
  //   type: 'string',
  //   operators: CONTAINS_OPERATORS,
  //   category: 'Abilities',
  // },
  // Tier / Meta
  {
    key: 'tier',
    label: 'Tier',
    type: 'string',
    operators: EXACT_OPERATORS,
    category: 'Tier / Meta',
  },
  {
    key: 'natDexTier',
    label: 'NatDex Tier',
    type: 'string',
    operators: EXACT_OPERATORS,
    category: 'Tier / Meta',
  },
  {
    key: 'doublesTier',
    label: 'Doubles Tier',
    type: 'string',
    operators: EXACT_OPERATORS,
    category: 'Tier / Meta',
  },
  // {
  //   key: 'isNonstandard',
  //   label: 'Nonstandard',
  //   type: 'string',
  //   operators: EXACT_OPERATORS,
  //   category: 'Tier / Meta',
  // },
  // {
  //   key: 'nfe',
  //   label: 'Not Fully Evolved',
  //   type: 'boolean',
  //   operators: BOOLEAN_OPERATORS,
  //   category: 'Tags',
  // },
  {
    key: 'evolved',
    label: 'Fully Evolved',
    type: 'boolean',
    operators: BOOLEAN_OPERATORS,
    category: 'Tags',
  },
  {
    key: 'isMega',
    label: 'Mega',
    type: 'boolean',
    operators: BOOLEAN_OPERATORS,
    category: 'Tags',
  },
  {
    key: 'isPrimal',
    label: 'Primal',
    type: 'boolean',
    operators: BOOLEAN_OPERATORS,
    category: 'Tags',
  },
  {
    key: 'isGigantamax',
    label: 'Gigantamax',
    type: 'boolean',
    operators: BOOLEAN_OPERATORS,
    category: 'Tags',
  },
  {
    key: 'mythical',
    label: 'Mythical',
    type: 'boolean',
    operators: BOOLEAN_OPERATORS,
    category: 'Tags',
  },
  {
    key: 'restrictedLegendary',
    label: 'Restricted Legendary',
    type: 'boolean',
    operators: BOOLEAN_OPERATORS,
    category: 'Tags',
  },
  {
    key: 'subLegendary',
    label: 'Sub-Legendary',
    type: 'boolean',
    operators: BOOLEAN_OPERATORS,
    category: 'Tags',
  },
  {
    key: 'ultraBeast',
    label: 'Ultra Beast',
    type: 'boolean',
    operators: BOOLEAN_OPERATORS,
    category: 'Tags',
  },
  {
    key: 'paradox',
    label: 'Paradox',
    type: 'boolean',
    operators: BOOLEAN_OPERATORS,
    category: 'Tags',
  },
  {
    key: 'eggGroups',
    label: 'Egg Groups',
    type: 'string',
    operators: CONTAINS_OPERATORS,
    category: 'Evolution',
  },
  {
    key: 'prevo',
    label: 'Pre-evolution',
    type: 'string',
    operators: CONTAINS_OPERATORS,
    category: 'Evolution',
  },
  {
    key: 'evos',
    label: 'Evolutions',
    type: 'string',
    operators: CONTAINS_OPERATORS,
    category: 'Evolution',
  },
  // {
  //   key: 'requiredItem',
  //   label: 'Required Item',
  //   type: 'string',
  //   operators: CONTAINS_OPERATORS,
  //   category: 'Evolution',
  // },
  // {
  //   key: 'requiredMove',
  //   label: 'Required Move',
  //   type: 'string',
  //   operators: CONTAINS_OPERATORS,
  //   category: 'Evolution',
  // },
  {
    key: 'learns',
    label: 'Learnset',
    type: 'string',
    operators: CONTAINS_OPERATORS,
    category: 'Moves',
  },
  {
    key: 'coverage',
    label: 'Offensive Coverage',
    type: 'string',
    operators: CONTAINS_OPERATORS,
    valueType: 'type',
    category: 'Moves',
  },
];

// ─── Move fields ──────────────────────────────────────────────────────────────

export const MOVE_FIELD_DEFINITIONS = [
  {
    key: 'name',
    label: 'Move Name',
    type: 'string',
    operators: CONTAINS_OPERATORS,
  },
  {
    key: 'type',
    label: 'Move Type',
    type: 'string',
    operators: EXACT_OPERATORS,
  },
  {
    key: 'category',
    label: 'Category',
    type: 'string',
    operators: EXACT_OPERATORS,
  },
  {
    key: 'basePower',
    label: 'Base Power',
    type: 'number',
    operators: NUMERIC_OPERATORS,
  },
  {
    key: 'accuracy',
    label: 'Accuracy',
    type: 'number',
    operators: NUMERIC_OPERATORS,
  },
  { key: 'pp', label: 'PP', type: 'number', operators: NUMERIC_OPERATORS },
  {
    key: 'priority',
    label: 'Priority',
    type: 'number',
    operators: NUMERIC_OPERATORS,
  },
  {
    key: 'target',
    label: 'Target',
    type: 'string',
    operators: EXACT_OPERATORS,
  },
] as const;

export type MoveField = (typeof MOVE_FIELD_DEFINITIONS)[number]['key'];

export type MoveFieldDefinition = {
  key: MoveField;
  label: string;
  type: SearchFieldType;
  operators: readonly SearchOperator[];
};

// ─── Filter types ─────────────────────────────────────────────────────────────

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

export const DEFAULT_PAGE_SIZE = 50;
