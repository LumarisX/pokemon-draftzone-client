# Card Mixins

Flexible card component system with theming support, providing structured layouts for headers, bodies, footers, dropdown menus, score badges, and sprite grids.

## Table of Contents

- [Quick Start](#quick-start)
- [Overview](#overview)
- [Card Structure](#card-structure)
- [Configuration](#configuration)
- [Card Sections](#card-sections)
- [Theming](#theming)
- [Examples](#examples)
- [Best Practices](#best-practices)

## Quick Start

```scss
@use "path/to/mixins/cards" as card;

.my-card {
  @include card.pdz-card("primary");
}

.custom-card {
  @include card.pdz-card(
    "menu",
    (
      border-radius: var(--pdz-shape-corner-lg),
      sprites-columns: 8,
      body-padding: var(--pdz-space-lg),
    )
  );
}
```

## Overview

The `pdz-card()` mixin creates a complete card component with:

- **Themed Styling** - Automatic color coordination based on theme
- **Structured Layout** - Header, body, and footer sections
- **Dropdown Menus** - Built-in menu support with hover states
- **Score Badges** - Positive/negative/neutral score displays
- **Sprite Grids** - Configurable grid layouts for images
- **Button Integration** - Seamless integration with button mixins
- **Flexible Customization** - Override any default property

## Card Structure

### HTML Template

```html
<div class="card">
  <!-- Header Section -->
  <div class="card-header">
    <div class="card-title">
      <span>Card Title</span>
      <small>Subtitle</small>
    </div>

    <div class="card-score pdz-background-pos">+5</div>

    <div class="card-menu">
      <button class="more-btn">
        <mat-icon>more_vert</mat-icon>
      </button>

      @if (showMenu) {
      <div class="menu-dropdown">
        <button class="menu-item" (click)="edit()">
          <mat-icon>edit</mat-icon>
          <span>Edit</span>
        </button>
        <button class="menu-item" (click)="delete()">
          <mat-icon>delete</mat-icon>
          <span>Delete</span>
        </button>
      </div>
      }
    </div>
  </div>

  <!-- Body Section -->
  <div class="card-body">
    <div class="body-header">Pokemon Team</div>

    <div class="sprites">
      @for (pokemon of team; track pokemon.id) {
      <img [src]="pokemon.sprite" [alt]="pokemon.name" />
      }
    </div>
  </div>

  <!-- Footer Section -->
  <div class="card-footer">
    <button class="footer-link">Cancel</button>
    <button class="footer-link">Save</button>
  </div>
</div>
```

### SCSS Usage

```scss
.card {
  @include pdz-card(
    "primary",
    (
      sprites-columns: 6,
      body-padding: var(--pdz-space-md),
    )
  );
}
```

## Configuration

### `pdz-card($style, $overrides)`

Creates a themed card component.

#### Parameters

- **`$style`** (String, default: `'menu'`) - Theme name (menu, primary, secondary, etc.)
- **`$overrides`** (Map, default: `()`) - Properties to override defaults

#### Default Configuration

```scss
$card-defaults: (
  // Colors (dynamically generated from $style)
  background: pdz-color(#{$style}-container),
  color: pdz-color(on-#{$style}-container),
  border-color: pdz-color(#{$style}-border),
  header: pdz-color(#{$style}-container-high),
  menu: pdz-color(#{$style}-subtle),
  on-menu: pdz-color(on-#{$style}-container),
  menu-hover: pdz-color(#{$style}-container-hover),
  // Structure
  border-radius: var(--pdz-shape-corner-md),
  border-width: 1px,
  border-style: solid,

  // Spacing
  header-padding: var(--pdz-space-sm) var(--pdz-space-sm),
  body-padding: var(--pdz-space-sm) var(--pdz-space-md),
  footer-padding: var(--pdz-space-xs) var(--pdz-space-md),
  // Menu
  menu-item-font-size: 1rem,
  menu-item-padding: var(--pdz-space-md),
  menu-width: null,

  // auto width
  // Sprites Grid
  sprites-columns: 6,
  sprites-min-size: 36px,
  sprites-gap: var(--pdz-space-sm)
);
```

#### Available Properties

**Colors:**

- `background` - Card background color
- `color` - Text color
- `border-color` - Border color
- `header` - Header background color
- `menu` - Dropdown menu background
- `on-menu` - Menu text color
- `menu-hover` - Menu item hover background
- `footer-link-hover` - Footer button hover background

**Structure:**

- `border-radius` - Corner rounding
- `border-width` - Border thickness
- `border-style` - Border style (solid, dashed, etc.)

**Spacing:**

- `header-padding` - Header internal spacing
- `body-padding` - Body internal spacing
- `footer-padding` - Footer internal spacing
- `menu-item-padding` - Menu item internal spacing

**Menu:**

- `menu-width` - Dropdown menu width (null = auto)
- `menu-item-font-size` - Menu item text size

**Sprites:**

- `sprites-columns` - Number of columns in sprite grid
- `sprites-min-size` - Minimum size for each sprite cell
- `sprites-gap` - Gap between sprite items

## Card Sections

### Card Header

The header section contains the title, optional score badge, and menu button.

#### Structure

```html
<div class="card-header">
  <div class="card-title">Title</div>
  <div class="card-score">Score</div>
  <div class="card-menu">...</div>
</div>
```

#### Features

- **Flexbox Layout** - Automatically spaces elements
- **Bold Title** - Title is bold by default
- **Multi-line Support** - Use nested elements for title/subtitle
- **Integrated Buttons** - `.more-btn` uses `icon-button()` mixin
- **Rounded Top** - Inherits card border radius on top corners

#### Card Title

```html
<!-- Simple title -->
<div class="card-title">
  <span>Pokemon Team</span>
</div>

<!-- Title with subtitle -->
<div class="card-title">
  <span>Pokemon Team</span>
  <small>6 Pokemon</small>
</div>
```

#### Card Score

Score badges with semantic styling:

```html
<!-- Positive score -->
<div class="card-score pdz-background-pos">+5</div>

<!-- Negative score -->
<div class="card-score pdz-background-neg">-3</div>

<!-- Neutral score -->
<div class="card-score pdz-background-neut">0</div>
```

**Styling:**

- `.pdz-background-pos` - Green background for positive values
- `.pdz-background-neg` - Red background for negative values
- `.pdz-background-neut` - Neutral gray background

**Features:**

- Compact padding
- Bold text
- Elevated with shadow
- Vertically stretched to fill header height
- Centered text

### Card Menu

Dropdown menu for card actions.

#### Structure

```html
<div class="card-menu">
  <button class="more-btn">
    <mat-icon>more_vert</mat-icon>
  </button>

  <div class="menu-dropdown" *ngIf="isMenuOpen">
    <button class="menu-item" (click)="action1()">
      <mat-icon>edit</mat-icon>
      <span>Edit</span>
    </button>
    <button class="menu-item" (click)="action2()">
      <mat-icon>delete</mat-icon>
      <span>Delete</span>
    </button>
  </div>
</div>
```

#### Features

- **Positioned Dropdown** - Absolutely positioned below trigger
- **Right-aligned** - Aligned to right edge of card
- **Elevated** - Box shadow for depth
- **Hover States** - Background change on hover
- **Icon Support** - Space for leading icons
- **Disabled States** - Opacity and cursor changes

#### Menu Button

The `.more-btn` automatically uses the `icon-button()` mixin with no additional configuration needed.

#### Menu Items

```scss
.menu-item {
  display: flex;
  align-items: center;
  gap: var(--pdz-space-md);
  padding: configurable;
  background: none;
  border: none;
  width: 100%;
  cursor: pointer;
  font-size: configurable;
  text-wrap: nowrap;

  &:hover {
    /* hover state */
  }
  &:disabled {
    /* disabled state */
  }
}
```

#### TypeScript Pattern

```typescript
export class CardComponent {
  showMenu = false;

  toggleMenu(): void {
    this.showMenu = !this.showMenu;
  }

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest(".card-menu")) {
      this.showMenu = false;
    }
  }

  edit(): void {
    console.log("Edit action");
    this.showMenu = false;
  }

  delete(): void {
    console.log("Delete action");
    this.showMenu = false;
  }
}
```

### Card Body

The main content area with flexible content support.

#### Structure

```html
<div class="card-body">
  <div class="body-header">Section Title</div>

  <!-- Custom content -->
  <div class="content">...</div>

  <!-- Or sprite grid -->
  <div class="sprites">
    <img src="sprite1.png" />
    <img src="sprite2.png" />
    <!-- ... -->
  </div>
</div>
```

#### Features

- **Flex Grow** - Expands to fill available space
- **Scrollable** - Overflow auto for long content
- **Configurable Padding** - Adjustable internal spacing

#### Body Header

Optional section header within the body:

```scss
.body-header {
  font-size: var(--pdz-font-size-sm);
  color: pdz-color(on-primary-container);
  margin-bottom: var(--pdz-space-xs);
}
```

#### Sprites Grid

Responsive grid for displaying sprites/images:

```html
<div class="sprites">
  @for (item of items; track item.id) {
  <img [src]="item.sprite" [alt]="item.name" />
  }
</div>
```

**Configuration:**

- `sprites-columns` - Number of columns (default: 6)
- `sprites-min-size` - Minimum cell size (default: 36px)
- `sprites-gap` - Gap between items (default: `--pdz-space-sm`)

**Behavior:**

- Responsive columns using CSS Grid
- `minmax()` ensures minimum size while allowing growth
- Automatically wraps to new rows
- Equal-width columns

### Card Footer

Action buttons and links at the bottom of the card.

#### Structure

```html
<div class="card-footer">
  <button class="footer-link">Cancel</button>
  <button class="footer-link">Confirm</button>
</div>
```

#### Features

- **Right-aligned** - Actions aligned to the right
- **Flexbox Layout** - Horizontal button arrangement
- **Top Border** - Visual separation from body
- **Flex Shrink 0** - Prevents height collapse
- **Integrated Buttons** - `.footer-link` uses `flat-button()` mixin

#### Footer Links

Footer buttons are styled with the `flat-button()` mixin:

```scss
.footer-link {
  @include flat-button(
    (
      padding: var(--pdz-space-xs) var(--pdz-space-md),
      border-radius: var(--pdz-shape-corner-sm),
      background-hover: configurable,
      border: none,
    )
  );
}
```

## Theming

### Available Themes

The `$style` parameter determines the color scheme:

```scss
// Menu theme (default)
.card-menu {
  @include pdz-card("menu");
}

// Primary theme
.card-primary {
  @include pdz-card("primary");
}

// Secondary theme
.card-secondary {
  @include pdz-card("secondary");
}

// Custom theme (if defined in your system)
.card-custom {
  @include pdz-card("custom");
}
```

### Theme Colors Generated

For each theme, the following colors are derived:

- `{theme}-container` - Card background
- `on-{theme}-container` - Text color
- `{theme}-border` - Border color
- `{theme}-container-high` - Header background (elevated variant)
- `{theme}-subtle` - Menu background
- `{theme}-container-hover` - Hover state background

### Custom Theme Colors

Override specific colors while maintaining theme structure:

```scss
.themed-card {
  @include pdz-card(
    "primary",
    (
      background: #custom-bg,
      header: #custom-header,
      border-color: #custom-border,
    )
  );
}
```

## Examples

### Basic Card

```html
<div class="basic-card">
  <div class="card-header">
    <div class="card-title">My Card</div>
  </div>
  <div class="card-body">
    <p>Card content goes here.</p>
  </div>
</div>
```

```scss
.basic-card {
  @include pdz-card("menu");
}
```

### Pokemon Team Card

```html
<div class="team-card">
  <div class="card-header">
    <div class="card-title">
      <span>Team Rocket</span>
      <small>6 Pokemon</small>
    </div>
    <div class="card-score pdz-background-pos">+12</div>
  </div>

  <div class="card-body">
    <div class="body-header">Active Team</div>
    <div class="sprites">
      @for (pokemon of team; track pokemon.id) {
      <img [src]="pokemon.sprite" [alt]="pokemon.name" />
      }
    </div>
  </div>

  <div class="card-footer">
    <button class="footer-link" (click)="viewDetails()">View Details</button>
  </div>
</div>
```

```scss
.team-card {
  @include pdz-card(
    "primary",
    (
      sprites-columns: 3,
      sprites-min-size: 48px,
      body-padding: var(--pdz-space-lg),
    )
  );
}
```

### Card with Actions Menu

```typescript
@Component({
  selector: "app-action-card",
  template: `
    <div class="action-card">
      <div class="card-header">
        <div class="card-title">{{ title }}</div>
        <div class="card-menu">
          <button class="more-btn" (click)="toggleMenu($event)">
            <mat-icon>more_vert</mat-icon>
          </button>

          @if (showMenu) {
            <div class="menu-dropdown">
              <button class="menu-item" (click)="edit()">
                <mat-icon>edit</mat-icon>
                <span>Edit</span>
              </button>
              <button class="menu-item" (click)="duplicate()">
                <mat-icon>content_copy</mat-icon>
                <span>Duplicate</span>
              </button>
              <button class="menu-item" (click)="delete()" [disabled]="!canDelete">
                <mat-icon>delete</mat-icon>
                <span>Delete</span>
              </button>
            </div>
          }
        </div>
      </div>

      <div class="card-body">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styleUrls: ["./action-card.component.scss"],
})
export class ActionCardComponent {
  @Input() title = "";
  @Input() canDelete = true;
  @Output() onEdit = new EventEmitter<void>();
  @Output() onDuplicate = new EventEmitter<void>();
  @Output() onDelete = new EventEmitter<void>();

  showMenu = false;

  toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.showMenu = !this.showMenu;
  }

  @HostListener("document:click")
  closeMenu(): void {
    this.showMenu = false;
  }

  edit(): void {
    this.onEdit.emit();
    this.showMenu = false;
  }

  duplicate(): void {
    this.onDuplicate.emit();
    this.showMenu = false;
  }

  delete(): void {
    this.onDelete.emit();
    this.showMenu = false;
  }
}
```

```scss
.action-card {
  @include pdz-card(
    "menu",
    (
      menu-width: 200px,
      menu-item-padding: var(--pdz-space-sm) var(--pdz-space-md),
    )
  );
}
```

### Responsive Card Grid

```html
<div class="card-grid">
  @for (item of items; track item.id) {
  <div class="grid-card">
    <div class="card-header">
      <div class="card-title">{{ item.title }}</div>
      <div
        class="card-score"
        [ngClass]="{
          'pdz-background-pos': item.score > 0,
          'pdz-background-neg': item.score < 0,
          'pdz-background-neut': item.score === 0
        }"
      >
        {{ item.score > 0 ? '+' : '' }}{{ item.score }}
      </div>
    </div>

    <div class="card-body">
      <div class="sprites">
        @for (sprite of item.sprites; track $index) {
        <img [src]="sprite" />
        }
      </div>
    </div>
  </div>
  }
</div>
```

```scss
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--pdz-space-md);
  padding: var(--pdz-space-md);

  .grid-card {
    @include pdz-card(
      "secondary",
      (
        sprites-columns: 4,
        sprites-min-size: 32px,
      )
    );
  }
}
```

### Compact Card

```scss
.compact-card {
  @include pdz-card(
    "menu",
    (
      header-padding: var(--pdz-space-2xs) var(--pdz-space-xs),
      body-padding: var(--pdz-space-xs) var(--pdz-space-sm),
      footer-padding: var(--pdz-space-2xs) var(--pdz-space-sm),
      border-radius: var(--pdz-shape-corner-sm),
    )
  );
}
```

### Expanded Card

```scss
.expanded-card {
  @include pdz-card(
    "primary",
    (
      header-padding: var(--pdz-space-md) var(--pdz-space-lg),
      body-padding: var(--pdz-space-lg) var(--pdz-space-xl),
      footer-padding: var(--pdz-space-md) var(--pdz-space-lg),
      border-radius: var(--pdz-shape-corner-lg),
      sprites-columns: 8,
      sprites-gap: var(--pdz-space-md),
    )
  );
}
```

## Best Practices

### 1. Use Semantic Themes

```scss
// ✅ Good - Clear purpose
.profile-card {
  @include pdz-card("primary");
}
.settings-card {
  @include pdz-card("secondary");
}
.menu-card {
  @include pdz-card("menu");
}

// ❌ Avoid - Unclear purpose
.card1 {
  @include pdz-card("primary");
}
```

### 2. Maintain Consistent Spacing

```scss
// ✅ Good - Use design tokens
.my-card {
  @include pdz-card(
    "menu",
    (
      body-padding: var(--pdz-space-md),
    )
  );
}

// ❌ Avoid - Magic numbers
.my-card {
  @include pdz-card(
    "menu",
    (
      body-padding: 17px,
    )
  );
}
```

### 3. Close Menus on Outside Click

Always implement document click handlers to close dropdown menus:

```typescript
@HostListener('document:click', ['$event'])
onDocumentClick(event: MouseEvent): void {
  const target = event.target as HTMLElement;
  if (!target.closest('.card-menu')) {
    this.showMenu = false;
  }
}
```

### 4. Limit Sprite Columns

Adjust sprite columns based on viewport:

```scss
.responsive-card {
  @include pdz-card(
    "menu",
    (
      sprites-columns: 6,
    )
  );

  @media (max-width: 768px) {
    --sprites-cols: 4;

    .sprites {
      grid-template-columns: repeat(var(--sprites-cols), 1fr);
    }
  }

  @media (max-width: 480px) {
    --sprites-cols: 3;
  }
}
```

### 5. Use Score Badges Appropriately

Only use score badges when they provide meaningful information:

```html
<!-- ✅ Good - Meaningful scores -->
<div class="card-score pdz-background-pos">Win Rate: 75%</div>
<div class="card-score pdz-background-neg">-5 HP</div>

<!-- ❌ Avoid - Redundant information -->
<div class="card-score pdz-background-neut">Status: Active</div>
```

### 6. Provide Menu Keyboard Navigation

Enhance accessibility with keyboard support:

```typescript
@HostListener('keydown', ['$event'])
onKeyDown(event: KeyboardEvent): void {
  if (this.showMenu) {
    switch (event.key) {
      case 'Escape':
        this.showMenu = false;
        break;
      case 'ArrowDown':
        // Focus next menu item
        break;
      case 'ArrowUp':
        // Focus previous menu item
        break;
    }
  }
}
```

### 7. Handle Empty States

Provide feedback when card body is empty:

```html
<div class="card-body">
  @if (items.length > 0) {
  <div class="sprites">
    @for (item of items; track item.id) {
    <img [src]="item.sprite" />
    }
  </div>
  } @else {
  <div class="empty-state">
    <p>No items to display</p>
  </div>
  }
</div>
```

### 8. Optimize Card Performance

Use `trackBy` in `@for` loops:

```typescript
trackByPokemon(index: number, pokemon: Pokemon): string {
  return pokemon.id;
}
```

```html
@for (pokemon of team; track trackByPokemon($index, pokemon)) {
<img [src]="pokemon.sprite" [alt]="pokemon.name" />
}
```

### 9. Make Cards Accessible

Add proper ARIA attributes:

```html
<div class="card" role="article" [attr.aria-labelledby]="titleId">
  <div class="card-header">
    <div class="card-title" [id]="titleId">{{ title }}</div>

    <div class="card-menu">
      <button class="more-btn" aria-label="Open actions menu" [attr.aria-expanded]="showMenu">
        <mat-icon>more_vert</mat-icon>
      </button>
    </div>
  </div>
</div>
```

### 10. Test Card Overflow

Ensure long content is handled gracefully:

```scss
.safe-card {
  @include pdz-card("menu");

  .card-body {
    overflow: auto;
    max-height: 400px; // Prevent cards from becoming too tall
  }

  .card-title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
```

## CSS Variables Used

The card mixins use these CSS custom properties:

**Spacing:**

- `--pdz-space-2xs`, `--pdz-space-xs`, `--pdz-space-sm`
- `--pdz-space-md`, `--pdz-space-lg`, `--pdz-space-xl`

**Shape:**

- `--pdz-shape-corner-sm` - Small border radius
- `--pdz-shape-corner-md` - Medium border radius
- `--pdz-shape-corner-lg` - Large border radius

**Typography:**

- `--pdz-font-size-sm` - Small font size for body headers

**Elevation:**

- `--pdz-level-1` - Score badge shadow
- `--pdz-level-2` - Menu dropdown shadow

**Colors** (via `pdz-color()` function):

- `{theme}-container` - Card background
- `on-{theme}-container` - Card text color
- `{theme}-border` - Border color
- `{theme}-container-high` - Header background
- `{theme}-subtle` - Menu background
- `{theme}-container-hover` - Hover states
- `positive`, `on-positive` - Positive score colors
- `negative`, `on-negative` - Negative score colors
- `menu-container`, `on-menu-container` - Neutral score colors
- `on-primary-container` - Body header color

## Integration with Button Mixins

The card mixin automatically integrates with button mixins:

```scss
// Automatically applied
.more-btn {
  @include icon-button(());
}

.footer-link {
  @include flat-button(
    (
      padding: var(--pdz-space-xs) var(--pdz-space-md),
      border-radius: var(--pdz-shape-corner-sm),
      background-hover: map.get($config, "footer-link-hover"),
      border: none,
    )
  );
}
```

No additional configuration needed - buttons inherit appropriate theming.

## Migration Guide

### From Custom Cards

**Before:**

```scss
.my-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;

  .header {
    background: #f5f5f5;
    padding: 1rem;
    font-weight: bold;
  }

  .body {
    padding: 1rem;
  }

  .footer {
    border-top: 1px solid #ddd;
    padding: 0.5rem 1rem;
  }
}
```

**After:**

```scss
.my-card {
  @include pdz-card("menu");
}
```

### Benefits

✅ Consistent styling across application  
✅ Automatic theme integration  
✅ Built-in component structure  
✅ Reduced code duplication  
✅ Flexible customization  
✅ Integrated button styling  
✅ Accessible by default
