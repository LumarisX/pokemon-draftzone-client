# Dropdown Mixins# Dropdown Mixins

Comprehensive SCSS mixins for creating consistent dropdown components including custom select inputs, autocomplete, and searchable dropdowns with full keyboard navigation and accessibility support.Reusable SCSS mixins for creating consistent dropdown components throughout the application.

## Table of Contents## Quick Start

- [Quick Start](#quick-start)```scss

- [Available Mixins](#available-mixins)@use "path/to/mixins/dropdown" as dropdown;

- [Complete Implementation](#complete-implementation)

- [HTML Structure](#html-structure).my-custom-dropdown {

- [TypeScript Patterns](#typescript-patterns) @include dropdown.autocomplete-dropdown(20rem, 1.5rem);

- [Customization](#customization)}

- [Best Practices](#best-practices)```

- [Advanced Features](#advanced-features)

- [Accessibility](#accessibility)## Available Mixins

- [Troubleshooting](#troubleshooting)

### `dropdown-container`

## Quick Start

Base container for all dropdown components.

````scss

@use "path/to/mixins/dropdown" as dropdown;```scss

.my-dropdown {

// Quick implementation with all features  @include dropdown.dropdown-container;

.my-autocomplete {}

  @include dropdown.autocomplete-dropdown(20rem, 1.5rem);```

}

### `dropdown-control`

// Or build custom dropdown with individual mixins

.custom-dropdown {Styles for the main dropdown button/control that users click to open the dropdown.

  @include dropdown.dropdown-container;

  ```scss

  .control {.dropdown-control {

    @include dropdown.dropdown-control;  @include dropdown.dropdown-control;

  }}

````

.list {

    @include dropdown.dropdown-list(18rem);**Features:**

}

- Flexbox layout with gap spacing

.item {- Hover and focus states

    @include dropdown.dropdown-item;- Consistent padding and borders

}- Transitions for smooth interactions

}

```### `dropdown-icon($size: 1.25rem)`

## Available MixinsStyles for icons within dropdowns (both in control and items).

### Core Mixins**Parameters:**

#### `dropdown-container`- `$size`: Size of the icon (default: `1.25rem`)

Base container for all dropdown components. Provides positioning context.```scss

.dropdown-icon {

````scss @include dropdown.dropdown-icon(1.5rem);

.my-dropdown {}

  @include dropdown.dropdown-container;```

}

```### `dropdown-label`



**Output:**Text label styling within the dropdown control.

```scss

position: relative;```scss

display: inline-block;.dropdown-label {

padding: 0;  @include dropdown.dropdown-label;

min-width: 10rem;}

cursor: pointer;```

overflow: visible;

```**Features:**



**Use Cases:**- Flexible width

- Wrapper for any dropdown component- Text overflow handling with ellipsis

- Establishes positioning context for absolute children- Consistent font weight

- Sets minimum width for dropdowns

### `dropdown-arrow`

---

Animated arrow indicator for dropdown state.

#### `dropdown-control`

```scss

Main dropdown button/control that users click to open the dropdown..dropdown-arrow {

  @include dropdown.dropdown-arrow;

```scss}

.dropdown-control {```

  @include dropdown.dropdown-control;

}**Features:**

````

- Automatic rotation when `.open` class is on parent

**Features:**- Smooth transition animation

- Flexbox layout with gap spacing

- Border and background styling### `dropdown-list($max-height: 16rem)`

- Hover state with primary color border

- Focus-within outline for accessibilityThe dropdown menu/list that appears when opened.

- Smooth transitions

**Parameters:**

**States:**

- `:hover` - Primary color border- `$max-height`: Maximum height before scrolling (default: `16rem`)

- `:focus-within` - Outline for keyboard navigation

````scss

**Use Cases:**.dropdown-list {

- Main trigger button for dropdowns  @include dropdown.dropdown-list(20rem);

- Custom select controls}

- Autocomplete input wrappers```



---**Features:**



#### `dropdown-icon($size: 1.25rem)`- Fixed/absolute positioning

- Shadow and border radius

Styles for icons within dropdowns (both in control and items).- Scrollable when content exceeds max-height

- High z-index for overlay behavior

**Parameters:**

- `$size` (Length, default: `1.25rem`) - Icon dimensions### `dropdown-item`



```scssIndividual items within the dropdown list.

.dropdown-icon {

  @include dropdown.dropdown-icon(1.5rem);```scss

}.dropdown-item {

```  @include dropdown.dropdown-item;

}

**Output:**```

```scss

width: $size;**Features:**

height: $size;

min-width: $size;- Hover and active states

min-height: $size;- Optional `.selected` class for highlighting current selection

max-width: none;- Flexbox layout for icon + text

max-height: none;

object-fit: contain;### `dropdown-search-input`

display: block;

```Search input field for autocomplete dropdowns.



**Use Cases:**```scss

- Leading icons in dropdown control.dropdown-search {

- Icons beside dropdown items  @include dropdown.dropdown-search-input;

- Image sprites or Material icons}

````

---

**Features:**

#### `dropdown-label`

- Full width

Text label styling within the dropdown control for displaying selected value.- Bottom border only (integrates with dropdown list)

- Focus state with primary color

````scss- Placeholder styling

.dropdown-label {

  @include dropdown.dropdown-label;### `dropdown-empty-state`

}

```Message displayed when no items are found (e.g., after filtering).



**Features:**```scss

- Flexible width (grows to fill space).dropdown-empty {

- Medium font weight (500)  @include dropdown.dropdown-empty-state;

- Text overflow handling with ellipsis}

- Single-line display```



**Use Cases:**### `autocomplete-dropdown($max-height: 16rem, $icon-size: 1.25rem)`

- Selected value display

- Placeholder textComplete dropdown setup with all features included. Use this for quick implementation.

- Current selection indicator

**Parameters:**

---

- `$max-height`: Maximum height of dropdown list (default: `16rem`)

#### `dropdown-arrow`- `$icon-size`: Size of icons (default: `1.25rem`)



Animated arrow indicator that rotates when dropdown opens.```scss

.my-autocomplete {

```scss  @include dropdown.autocomplete-dropdown(20rem, 1.5rem);

.dropdown-arrow {}

  @include dropdown.dropdown-arrow;```

}

```**Includes:**



**Features:**- All dropdown component styles

- Automatic 180° rotation when parent has `.open` class- Proper nesting structure

- Smooth transition animation (0.12s)- Consistent naming convention

- Secondary text color by default

- Inline-block display with margin## HTML Structure



**States:**### Basic Dropdown

- `.open &` - Rotates 180 degrees

```html

**Use Cases:**<div class="dropdown" [class.open]="isOpen" (click)="toggle($event)">

- Visual indicator of dropdown state  <div class="dropdown-control">

- Directional chevron/arrow    <img src="icon.png" class="dropdown-icon" />

- Any rotating icon indicator    <span class="dropdown-label">{{ selectedValue || 'Select' }}</span>

    <span class="dropdown-arrow">▾</span>

---  </div>



#### `dropdown-list($max-height: 16rem)`  @if (isOpen) {

  <ul class="dropdown-list">

The dropdown menu/list that appears when opened.    @for (option of options; track option.id) {

    <li class="dropdown-item" (click)="select(option, $event)">

**Parameters:**      <img [src]="option.icon" class="dropdown-item-icon" />

- `$max-height` (Length, default: `16rem`) - Maximum height before scrolling      <span>{{ option.name }}</span>

    </li>

```scss    }

.dropdown-list {  </ul>

  @include dropdown.dropdown-list(20rem);  }

}</div>

````

**Features:**### Autocomplete Dropdown

- Absolute positioning below control

- Surface background with elevation shadow```html

- Scrollable when content exceeds max-height<div class="dropdown" [class.open]="isOpen" (click)="toggle($event)">

- High z-index (9999) for overlay behavior <div class="dropdown-control">

- Rounded corners matching design system <img src="icon.png" class="dropdown-icon" />

- Vertical padding for spacing <span class="dropdown-label">{{ selectedValue || 'Select' }}</span>

  <span class="dropdown-arrow">▾</span>

**Output:** </div>

````scss

position: absolute;  @if (isOpen) {

left: 0;  <div class="dropdown-list">

top: calc(100% + 0.35rem);    <input type="text" class="dropdown-search" placeholder="Search..." [(ngModel)]="searchQuery" (ngModelChange)="filter()" (click)="$event.stopPropagation()" />

background: var(--pdz-color-surface);

border-radius: var(--pdz-shape-corner-sm);    @if (filteredOptions.length === 0) {

box-shadow: var(--pdz-level-3);    <div class="dropdown-empty">No results found</div>

z-index: 9999;    } @else {

max-height: $max-height;    <ul class="dropdown-items-list">

overflow: auto;      @for (option of filteredOptions; track option.id) {

padding: 0.25rem 0;      <li class="dropdown-item" [class.selected]="option.id === selectedId" (click)="select(option, $event)">

min-width: 12rem;        <img [src]="option.icon" class="dropdown-item-icon" />

```        <span>{{ option.name }}</span>

      </li>

**Use Cases:**      }

- Dropdown menu containers    </ul>

- Option lists    }

- Autocomplete results  </div>

  }

---</div>

````

#### `dropdown-item`

## TypeScript Implementation Pattern

Individual selectable items within the dropdown list.

````typescript

```scssexport class MyComponent {

.dropdown-item {  isOpen = false;

  @include dropdown.dropdown-item;  searchQuery = "";

}  selectedValue: string | null = null;

```  options: Option[] = [];

  filteredOptions: Option[] = [];

**Features:**

- Flexbox layout for icon + text  private _docClickHandler = (e: MouseEvent) => this._onDocumentClick(e);

- Hover and active states

- Selected state highlighting  ngOnInit() {

- Disabled state support    this.filteredOptions = this.options;

- Smooth background transitions    document.addEventListener("click", this._docClickHandler);

- No-wrap text  }



**States:**  ngOnDestroy() {

- `:hover` - Light background (4% black)    document.removeEventListener("click", this._docClickHandler);

- `:active` - Darker background (8% black)  }

- `.selected` - Primary color tinted background

- `:disabled`, `.disabled` - Reduced opacity, no pointer events  toggle(event?: MouseEvent) {

    if (event) {

**Use Cases:**      event.stopPropagation();

- Selectable options    }

- Menu items    this.isOpen = !this.isOpen;

- Autocomplete suggestions

    if (this.isOpen) {

---      this.searchQuery = "";

      this.filteredOptions = this.options;

#### `dropdown-search-input`

      // Focus search input after dropdown opens

Search input field for filtering dropdown items in autocomplete.      setTimeout(() => {

        const input = document.querySelector(".dropdown-search") as HTMLInputElement;

```scss        input?.focus();

.dropdown-search {      }, 0);

  @include dropdown.dropdown-search-input;    }

}  }

````

filter() {

**Features:** const query = this.searchQuery.toLowerCase().trim();

- Full width if (!query) {

- Bottom border only (integrates with dropdown list) this.filteredOptions = this.options;

- Focus state with primary color } else {

- Transparent background this.filteredOptions = this.options.filter((option) => option.name.toLowerCase().includes(query));

- Placeholder styling }

- Inherits font settings }

**States:** select(option: Option, event?: MouseEvent) {

- `:focus` - Primary color border if (event) {

- `::placeholder` - Secondary text color event.stopPropagation();

  }

**Use Cases:** this.selectedValue = option.name;

- Autocomplete search this.isOpen = false;

- Filtering dropdown options this.searchQuery = "";

- Searchable selects }

--- private \_onDocumentClick(e: MouseEvent) {

    const target = e.target as HTMLElement | null;

#### `dropdown-empty-state` if (!target?.closest?.(".dropdown")) {

      this.isOpen = false;

Message displayed when no items are found (e.g., after filtering). }

}

````scss}

.dropdown-empty {```

  @include dropdown.dropdown-empty-state;

}## Customization

````

You can override mixin styles by adding custom CSS after including the mixin:

**Features:**

- Centered text```scss

- Secondary text color.my-dropdown {

- Italic styling @include dropdown.autocomplete-dropdown;

- Adequate padding

  // Custom overrides

**Use Cases:** .dropdown-control {

- "No results found" messages background: var(--my-custom-bg);

- Empty state indicators border-radius: 8px;

- Search result feedback }

--- .dropdown-item {

    padding: 1rem;

### `autocomplete-dropdown($max-height: 16rem, $icon-size: 1.25rem)`

    &:hover {

Complete dropdown setup with all features included. **Use this for quick implementation.** background: var(--my-hover-color);

    }

**Parameters:** }

- `$max-height` (Length, default: `16rem`) - Maximum list height before scrolling}

- `$icon-size` (Length, default: `1.25rem`) - Size of icons throughout```

````scss## Best Practices

.my-autocomplete {

  @include dropdown.autocomplete-dropdown(20rem, 1.5rem);1. **Always stop propagation** on item clicks to prevent dropdown from closing/reopening

}2. **Use document click handler** for closing dropdowns when clicking outside

```3. **Initialize filtered items** with all options when opening the dropdown

4. **Focus the search input** after opening for better UX

**Includes:**5. **Clean up event listeners** in `ngOnDestroy` to prevent memory leaks

- All dropdown component styles6. **Use fixed positioning** for dropdown lists that might be clipped by `overflow: hidden` containers

- Proper nesting structure7. **Track by unique ID** in Angular `@for` loops for better performance

- Consistent class naming convention8. **Prevent double scrollbars** - When using autocomplete with a nested list, disable overflow on `.dropdown-list` and only enable it on the inner list container (e.g., `.dropdown-items-list`)

- Complete feature set

## Preventing Double Scrollbars

**Class Structure:**

- `.dropdown-control` - Main trigger buttonWhen creating autocomplete dropdowns with a search input + scrollable list, you may encounter double scrollbars. To fix this:

- `.dropdown-icon`, `.dropdown-item-icon` - Icons

- `.dropdown-label` - Selected value text```scss

- `.dropdown-arrow` - State indicator.my-autocomplete {

- `.dropdown-list` - Menu container  @include dropdown.autocomplete-dropdown(20rem, 1.5rem);

- `.dropdown-search` - Search input

- `.dropdown-item` - Selectable items  // Disable overflow on the outer container

- `.dropdown-empty` - Empty state message  .dropdown-list {

    overflow: visible;

## Complete Implementation    max-height: none;

  }

### Basic Dropdown

  // Only the inner list should scroll

#### HTML  .dropdown-items-list {

```html    max-height: 18rem;

<div class="dropdown" [class.open]="isOpen" (click)="toggle($event)">    overflow-y: auto;

  <div class="dropdown-control">  }

    <img [src]="selectedIcon" class="dropdown-icon" *ngIf="selectedIcon" />}

    <span class="dropdown-label">{{ selectedValue || 'Select' }}</span>```

    <span class="dropdown-arrow">▾</span>

  </div>## CSS Variables Used



  @if (isOpen) {The mixins use these CSS variables from your design system:

    <ul class="dropdown-list">

      @for (option of options; track option.id) {- `--pdz-shape-corner-sm`: Border radius for small corners

        <li class="dropdown-item" - `--pdz-shape-corner-md`: Border radius for medium corners

            [class.selected]="option.id === selectedId"- `--pdz-shape-corner-lg`: Border radius for large corners

            (click)="select(option, $event)">- `--pdz-color-border`: Default border color

          <img [src]="option.icon" class="dropdown-item-icon" *ngIf="option.icon" />- `--pdz-color-input-bg`: Background for input fields

          <span>{{ option.name }}</span>- `--pdz-color-primary`: Primary theme color

        </li>- `--pdz-color-surface`: Surface/card background color

      }- `--pdz-color-text-secondary`: Secondary text color

    </ul>- `--pdz-level-3`: Box shadow elevation level 3

  }

</div>Make sure these variables are defined in your theme/variables file.

````

#### SCSS

```scss
.dropdown {
  @include autocomplete-dropdown();
}
```

#### TypeScript

```typescript
export class DropdownComponent {
  isOpen = false;
  selectedValue: string | null = null;
  selectedId: string | null = null;
  selectedIcon: string | null = null;
  options: Option[] = [];

  private _docClickHandler = (e: MouseEvent) => this._onDocumentClick(e);

  ngOnInit() {
    document.addEventListener("click", this._docClickHandler);
  }

  ngOnDestroy() {
    document.removeEventListener("click", this._docClickHandler);
  }

  toggle(event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    this.isOpen = !this.isOpen;
  }

  select(option: Option, event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    this.selectedValue = option.name;
    this.selectedId = option.id;
    this.selectedIcon = option.icon;
    this.isOpen = false;
  }

  private _onDocumentClick(e: MouseEvent) {
    const target = e.target as HTMLElement | null;
    if (!target?.closest?.(".dropdown")) {
      this.isOpen = false;
    }
  }
}
```

### Autocomplete Dropdown with Search

#### HTML

```html
<div class="autocomplete" [class.open]="isOpen" (click)="toggle($event)">
  <div class="dropdown-control">
    <img [src]="selectedIcon" class="dropdown-icon" *ngIf="selectedIcon" />
    <span class="dropdown-label">{{ selectedValue || 'Search...' }}</span>
    <span class="dropdown-arrow">▾</span>
  </div>

  @if (isOpen) {
  <div class="dropdown-list">
    <input type="text" class="dropdown-search" placeholder="Search..." [(ngModel)]="searchQuery" (ngModelChange)="filter()" (click)="$event.stopPropagation()" #searchInput />

    @if (filteredOptions.length === 0) {
    <div class="dropdown-empty">No results found</div>
    } @else {
    <ul class="dropdown-items-list">
      @for (option of filteredOptions; track option.id) {
      <li class="dropdown-item" [class.selected]="option.id === selectedId" (click)="select(option, $event)">
        <img [src]="option.icon" class="dropdown-item-icon" *ngIf="option.icon" />
        <span>{{ option.name }}</span>
      </li>
      }
    </ul>
    }
  </div>
  }
</div>
```

#### SCSS

```scss
.autocomplete {
  @include autocomplete-dropdown(20rem, 1.5rem);

  // Fix double scrollbar issue
  .dropdown-list {
    overflow: visible;
    max-height: none;
  }

  .dropdown-items-list {
    max-height: 18rem;
    overflow-y: auto;
    list-style: none;
    padding: 0;
    margin: 0;
  }
}
```

#### TypeScript

```typescript
export class AutocompleteComponent {
  @ViewChild("searchInput") searchInput!: ElementRef<HTMLInputElement>;

  isOpen = false;
  searchQuery = "";
  selectedValue: string | null = null;
  selectedId: string | null = null;
  selectedIcon: string | null = null;
  options: Option[] = [];
  filteredOptions: Option[] = [];

  private _docClickHandler = (e: MouseEvent) => this._onDocumentClick(e);

  ngOnInit() {
    this.filteredOptions = this.options;
    document.addEventListener("click", this._docClickHandler);
  }

  ngOnDestroy() {
    document.removeEventListener("click", this._docClickHandler);
  }

  toggle(event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    this.isOpen = !this.isOpen;

    if (this.isOpen) {
      this.searchQuery = "";
      this.filteredOptions = this.options;

      // Focus search input after dropdown opens
      setTimeout(() => {
        this.searchInput?.nativeElement.focus();
      }, 0);
    }
  }

  filter() {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) {
      this.filteredOptions = this.options;
    } else {
      this.filteredOptions = this.options.filter((option) => option.name.toLowerCase().includes(query));
    }
  }

  select(option: Option, event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    this.selectedValue = option.name;
    this.selectedId = option.id;
    this.selectedIcon = option.icon;
    this.isOpen = false;
    this.searchQuery = "";
  }

  private _onDocumentClick(e: MouseEvent) {
    const target = e.target as HTMLElement | null;
    if (!target?.closest?.(".autocomplete")) {
      this.isOpen = false;
    }
  }
}
```

## HTML Structure

### Basic Dropdown Structure

```html
<div class="dropdown" [class.open]="isOpen">
  <!-- Control -->
  <div class="dropdown-control">
    <img class="dropdown-icon" />
    <span class="dropdown-label">Selected Value</span>
    <span class="dropdown-arrow">▾</span>
  </div>

  <!-- List -->
  <ul class="dropdown-list">
    <li class="dropdown-item">
      <img class="dropdown-item-icon" />
      <span>Option 1</span>
    </li>
  </ul>
</div>
```

### Autocomplete Structure

```html
<div class="dropdown" [class.open]="isOpen">
  <div class="dropdown-control">...</div>

  <div class="dropdown-list">
    <!-- Search -->
    <input type="text" class="dropdown-search" />

    <!-- Empty State -->
    <div class="dropdown-empty">No results</div>

    <!-- Items -->
    <ul class="dropdown-items-list">
      <li class="dropdown-item">...</li>
    </ul>
  </div>
</div>
```

## TypeScript Patterns

### Reusable Component

```typescript
@Component({
  selector: "app-dropdown",
  templateUrl: "./dropdown.component.html",
  styleUrls: ["./dropdown.component.scss"],
})
export class DropdownComponent<T> implements OnInit, OnDestroy {
  @Input() options: T[] = [];
  @Input() displayFn: (item: T) => string = (item) => String(item);
  @Input() iconFn: (item: T) => string | null = () => null;
  @Input() trackByFn: (item: T) => any = (item) => item;
  @Input() placeholder = "Select...";
  @Input() searchable = false;

  @Output() selectionChange = new EventEmitter<T>();

  @ViewChild("searchInput") searchInput?: ElementRef<HTMLInputElement>;

  isOpen = false;
  searchQuery = "";
  selectedItem: T | null = null;
  filteredOptions: T[] = [];

  private _destroy$ = new Subject<void>();

  ngOnInit() {
    this.filteredOptions = this.options;
    fromEvent<MouseEvent>(document, "click")
      .pipe(takeUntil(this._destroy$))
      .subscribe((e) => this._onDocumentClick(e));
  }

  ngOnDestroy() {
    this._destroy$.next();
    this._destroy$.complete();
  }

  toggle(event?: MouseEvent): void {
    event?.stopPropagation();
    this.isOpen = !this.isOpen;

    if (this.isOpen && this.searchable) {
      this.searchQuery = "";
      this.filteredOptions = this.options;
      setTimeout(() => this.searchInput?.nativeElement.focus(), 0);
    }
  }

  filter(): void {
    const query = this.searchQuery.toLowerCase().trim();
    this.filteredOptions = query ? this.options.filter((opt) => this.displayFn(opt).toLowerCase().includes(query)) : this.options;
  }

  select(item: T, event?: MouseEvent): void {
    event?.stopPropagation();
    this.selectedItem = item;
    this.selectionChange.emit(item);
    this.isOpen = false;
  }

  get selectedDisplay(): string {
    return this.selectedItem ? this.displayFn(this.selectedItem) : this.placeholder;
  }

  get selectedIcon(): string | null {
    return this.selectedItem ? this.iconFn(this.selectedItem) : null;
  }

  private _onDocumentClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (!target.closest("app-dropdown")) {
      this.isOpen = false;
    }
  }
}
```

### Usage of Reusable Component

```typescript
// In parent component
interface Pokemon {
  id: string;
  name: string;
  sprite: string;
}

pokemonList: Pokemon[] = [...];
selectedPokemon: Pokemon | null = null;

onPokemonSelect(pokemon: Pokemon) {
  this.selectedPokemon = pokemon;
  console.log('Selected:', pokemon);
}

displayPokemon(p: Pokemon): string {
  return p.name;
}

getPokemonIcon(p: Pokemon): string {
  return p.sprite;
}
```

```html
<app-dropdown [options]="pokemonList" [displayFn]="displayPokemon" [iconFn]="getPokemonIcon" [trackByFn]="trackById" [searchable]="true" placeholder="Select a Pokémon" (selectionChange)="onPokemonSelect($event)"> </app-dropdown>
```

## Customization

### Overriding Styles

```scss
.custom-dropdown {
  @include autocomplete-dropdown;

  // Custom overrides
  .dropdown-control {
    background: var(--my-custom-bg);
    border-radius: 12px;
    padding: 1rem;
  }

  .dropdown-item {
    padding: 1rem;
    font-size: 1.1rem;

    &:hover {
      background: var(--my-hover-color);
    }

    &.selected {
      background: var(--my-selected-color);
      font-weight: 600;
    }
  }

  .dropdown-list {
    border: 2px solid var(--my-border-color);
    max-height: 25rem;
  }
}
```

### Theming

```scss
// Light theme
.dropdown-light {
  @include autocomplete-dropdown;

  --pdz-color-border: #e0e0e0;
  --pdz-color-input-bg: #ffffff;
  --pdz-color-surface: #ffffff;
  --pdz-color-primary: #1976d2;
  --pdz-color-text-secondary: #666;
}

// Dark theme
.dropdown-dark {
  @include autocomplete-dropdown;

  --pdz-color-border: #424242;
  --pdz-color-input-bg: #303030;
  --pdz-color-surface: #424242;
  --pdz-color-primary: #90caf9;
  --pdz-color-text-secondary: #aaa;
}
```

### Size Variants

```scss
// Compact dropdown
.dropdown-compact {
  @include autocomplete-dropdown(12rem, 1rem);

  .dropdown-control {
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
  }

  .dropdown-item {
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
  }
}

// Large dropdown
.dropdown-large {
  @include autocomplete-dropdown(24rem, 1.75rem);

  .dropdown-control {
    padding: 0.75rem 1rem;
    font-size: 1.125rem;
  }

  .dropdown-item {
    padding: 0.5rem 1rem;
    font-size: 1.125rem;
  }
}
```

## Best Practices

### 1. Always Stop Propagation on Item Clicks

Prevent dropdown from closing and reopening:

```typescript
select(option: Option, event?: MouseEvent): void {
  event?.stopPropagation(); // CRITICAL
  this.selectedItem = option;
  this.isOpen = false;
}
```

### 2. Use Document Click Handler for Outside Clicks

```typescript
private _onDocumentClick(e: MouseEvent): void {
  const target = e.target as HTMLElement;
  if (!target.closest('.dropdown')) {
    this.isOpen = false;
  }
}
```

### 3. Focus Search Input on Open

Improve UX by auto-focusing search:

```typescript
setTimeout(() => {
  this.searchInput?.nativeElement.focus();
}, 0);
```

### 4. Track Items Properly in Angular

Use `trackBy` for performance:

```typescript
trackById(index: number, item: any): any {
  return item.id;
}
```

```html
@for (option of filteredOptions; track option.id) {
<li class="dropdown-item">{{ option.name }}</li>
}
```

### 5. Prevent Double Scrollbars

When using autocomplete with nested lists:

```scss
.dropdown-list {
  overflow: visible;
  max-height: none;
}

.dropdown-items-list {
  max-height: 18rem;
  overflow-y: auto;
}
```

### 6. Clean Up Event Listeners

Prevent memory leaks:

```typescript
ngOnDestroy() {
  document.removeEventListener('click', this._docClickHandler);
  // Or use RxJS:
  this._destroy$.next();
  this._destroy$.complete();
}
```

### 7. Handle Empty States

Provide feedback when no results:

```html
@if (filteredOptions.length === 0) {
<div class="dropdown-empty">No results found</div>
}
```

### 8. Use Semantic HTML

```html
<!-- ✅ Good -->
<button type="button" class="dropdown-control">...</button>

<!-- ❌ Avoid -->
<div class="dropdown-control">...</div>
```

### 9. Add Loading States

```html
@if (isLoading) {
<div class="dropdown-loading">
  <mat-spinner diameter="24"></mat-spinner>
</div>
}
```

```scss
.dropdown-loading {
  padding: 1rem;
  display: flex;
  justify-content: center;
}
```

### 10. Implement Keyboard Navigation

See [Accessibility](#accessibility) section.

## Advanced Features

### Multi-Select Dropdown

```typescript
selectedItems: Set<string> = new Set();

toggleItem(item: Option, event?: MouseEvent): void {
  event?.stopPropagation();

  if (this.selectedItems.has(item.id)) {
    this.selectedItems.delete(item.id);
  } else {
    this.selectedItems.add(item.id);
  }
}

isSelected(item: Option): boolean {
  return this.selectedItems.has(item.id);
}
```

```html
<li class="dropdown-item" [class.selected]="isSelected(option)" (click)="toggleItem(option, $event)">
  <input type="checkbox" [checked]="isSelected(option)" />
  <span>{{ option.name }}</span>
</li>
```

### Grouped Options

```html
@for (group of groupedOptions; track group.name) {
<div class="dropdown-group">
  <div class="group-header">{{ group.name }}</div>
  @for (option of group.items; track option.id) {
  <li class="dropdown-item">{{ option.name }}</li>
  }
</div>
}
```

```scss
.dropdown-group {
  .group-header {
    padding: 0.5rem 0.75rem;
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--pdz-color-text-secondary);
    background: rgba(0, 0, 0, 0.02);
  }
}
```

### Virtual Scrolling

For large lists, use CDK Virtual Scroll:

```typescript
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';

@ViewChild(CdkVirtualScrollViewport) viewport!: CdkVirtualScrollViewport;
```

```html
<cdk-virtual-scroll-viewport itemSize="40" class="dropdown-list">
  <li *cdkVirtualFor="let option of filteredOptions; trackBy: trackById" class="dropdown-item" (click)="select(option, $event)">{{ option.name }}</li>
</cdk-virtual-scroll-viewport>
```

### Async Data Loading

```typescript
options$ = new BehaviorSubject<Option[]>([]);
isLoading = false;

loadOptions(query: string): void {
  this.isLoading = true;

  this.apiService.search(query)
    .pipe(finalize(() => this.isLoading = false))
    .subscribe(results => {
      this.options$.next(results);
    });
}

filter(): void {
  if (this.searchQuery.length >= 3) {
    this.loadOptions(this.searchQuery);
  }
}
```

## Accessibility

### ARIA Attributes

```html
<div class="dropdown" role="combobox" [attr.aria-expanded]="isOpen" [attr.aria-controls]="listId" [attr.aria-haspopup]="'listbox'">
  <button type="button" class="dropdown-control" [attr.aria-label]="selectedValue || placeholder" (keydown)="onKeyDown($event)">
    <span class="dropdown-label">{{ selectedValue || placeholder }}</span>
    <span class="dropdown-arrow" aria-hidden="true">▾</span>
  </button>

  <ul class="dropdown-list" [id]="listId" role="listbox" *ngIf="isOpen">
    <li *ngFor="let option of filteredOptions; trackBy: trackById" class="dropdown-item" role="option" [attr.aria-selected]="option.id === selectedId" [attr.aria-label]="option.name" (click)="select(option, $event)">{{ option.name }}</li>
  </ul>
</div>
```

### Keyboard Navigation

```typescript
@HostListener('keydown', ['$event'])
onKeyDown(event: KeyboardEvent): void {
  switch (event.key) {
    case 'Enter':
    case ' ':
      if (!this.isOpen) {
        this.toggle();
        event.preventDefault();
      }
      break;

    case 'Escape':
      if (this.isOpen) {
        this.isOpen = false;
        event.preventDefault();
      }
      break;

    case 'ArrowDown':
      if (this.isOpen) {
        this.focusNextItem();
      } else {
        this.toggle();
      }
      event.preventDefault();
      break;

    case 'ArrowUp':
      if (this.isOpen) {
        this.focusPreviousItem();
      }
      event.preventDefault();
      break;

    case 'Home':
      if (this.isOpen) {
        this.focusFirstItem();
        event.preventDefault();
      }
      break;

    case 'End':
      if (this.isOpen) {
        this.focusLastItem();
        event.preventDefault();
      }
      break;
  }
}

private focusedIndex = -1;

focusNextItem(): void {
  const items = this.getItemElements();
  this.focusedIndex = Math.min(this.focusedIndex + 1, items.length - 1);
  items[this.focusedIndex]?.focus();
}

focusPreviousItem(): void {
  const items = this.getItemElements();
  this.focusedIndex = Math.max(this.focusedIndex - 1, 0);
  items[this.focusedIndex]?.focus();
}

focusFirstItem(): void {
  const items = this.getItemElements();
  this.focusedIndex = 0;
  items[0]?.focus();
}

focusLastItem(): void {
  const items = this.getItemElements();
  this.focusedIndex = items.length - 1;
  items[this.focusedIndex]?.focus();
}

private getItemElements(): HTMLElement[] {
  return Array.from(
    this.el.nativeElement.querySelectorAll('.dropdown-item')
  );
}
```

### Focus Management

```scss
.dropdown-item {
  &:focus {
    outline: 2px solid var(--pdz-color-primary);
    outline-offset: -2px;
  }

  &:focus:not(:focus-visible) {
    outline: none;
  }
}
```

## Troubleshooting

### Issue: Dropdown Clipped by Parent

**Problem:** Dropdown list cut off by `overflow: hidden` parent.

**Solution:** Use fixed positioning or portal/overlay:

```scss
.dropdown-list {
  position: fixed; // Instead of absolute
  // Calculate position with JS
}
```

Or use Angular CDK Overlay:

```typescript
import { Overlay } from "@angular/cdk/overlay";
```

### Issue: Double Scrollbars

**Problem:** Scrollbar on both `.dropdown-list` and inner list.

**Solution:** Remove overflow from outer container:

```scss
.dropdown-list {
  overflow: visible;
  max-height: none;
}

.dropdown-items-list {
  max-height: 18rem;
  overflow-y: auto;
}
```

### Issue: Dropdown Reopens After Selection

**Problem:** Clicking item closes and immediately reopens dropdown.

**Solution:** Stop propagation on item clicks:

```typescript
select(option: Option, event?: MouseEvent): void {
  event?.stopPropagation();  // REQUIRED
  // ...
}
```

### Issue: Poor Performance with Large Lists

**Problem:** Lag when rendering thousands of items.

**Solution:** Use virtual scrolling:

```html
<cdk-virtual-scroll-viewport itemSize="40">
  <li *cdkVirtualFor="let item of items">{{ item.name }}</li>
</cdk-virtual-scroll-viewport>
```

### Issue: Search Input Loses Focus

**Problem:** Focus lost when clicking inside dropdown.

**Solution:** Stop propagation on input:

```html
<input class="dropdown-search" (click)="$event.stopPropagation()" />
```

### Issue: Z-Index Conflicts

**Problem:** Dropdown appears behind other elements.

**Solution:** Increase z-index or use stacking context:

```scss
.dropdown {
  z-index: 1000;

  .dropdown-list {
    z-index: 9999;
  }
}
```

## CSS Variables Used

The dropdown mixins use these CSS custom properties:

**Colors:**

- `--pdz-color-border` - Border color for controls
- `--pdz-color-input-bg` - Control background
- `--pdz-color-primary` - Primary accent color
- `--pdz-color-primary-rgb` - Primary color as RGB values (for alpha)
- `--pdz-color-surface` - Dropdown list background
- `--pdz-color-text-secondary` - Secondary text and placeholders

**Shape:**

- `--pdz-shape-corner-sm` - Border radius

**Elevation:**

- `--pdz-level-3` - Shadow for dropdown list

Ensure these variables are defined in your design system or provide fallbacks:

```scss
.dropdown {
  --pdz-color-border: #e0e0e0;
  --pdz-color-input-bg: #ffffff;
  --pdz-color-primary: #1976d2;
  --pdz-color-surface: #ffffff;
  --pdz-color-text-secondary: #666;
  --pdz-shape-corner-sm: 4px;
  --pdz-level-3: 0 4px 6px rgba(0, 0, 0, 0.1);

  @include autocomplete-dropdown();
}
```

## Browser Support

The dropdown mixins use modern CSS features:

- Flexbox ✅ All modern browsers
- CSS Variables ✅ All modern browsers (IE11 requires polyfill)
- CSS Transforms ✅ All modern browsers

For IE11 support, consider using a CSS variable polyfill or compile variables to static values.
