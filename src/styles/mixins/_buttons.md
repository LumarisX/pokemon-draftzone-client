# Button Mixins

Comprehensive button system with theme support, consistent styling, and multiple variants including flat, icon, and floating action buttons with radial menu support.

## Table of Contents

- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Base Button](#base-button)
- [Flat Buttons](#flat-buttons)
- [Icon Buttons](#icon-buttons)
- [Floating Action Buttons](#floating-action-buttons)
- [Radial Menu FABs](#radial-menu-fabs)
- [Customization](#customization)
- [Best Practices](#best-practices)
- [Examples](#examples)

## Quick Start

```scss
@use "path/to/mixins/buttons" as btn;

.my-button {
  @include btn.flat-button-primary();
}

.my-icon-btn {
  @include btn.icon-button-secondary();
}

.my-fab {
  @include btn.float-button();
}
```

## Architecture

### Theme System

The button system uses a theme-based color configuration through the `create-themed-button-map()` function:

```scss
@function create-themed-button-map($theme-color: "primary");
```

**Pre-configured Theme Maps:**

- `$button-primary-defaults` - Primary theme colors
- `$button-secondary-defaults` - Secondary theme colors
- `$button-menu-defaults` - Menu theme colors

**Generated Properties:**

- `background` - Default background color
- `background-hover` - Hover state background
- `background-selected` - Selected state background
- `border-width` - Border thickness (1px)
- `border-color` - Border color
- `color` - Text color

### Configuration Maps

All button mixins accept an `$overrides` map parameter that merges with default configurations:

```scss
@include base-button(
  (
    padding: 1rem 2rem,
    background: blue,
    border-radius: 8px,
    font-weight: 600,
  )
);
```

## Base Button

### `base-button($overrides: ())`

Foundation mixin that provides core button styling. All specialized button mixins build on this.

#### Default Configuration

```scss
$base-button-defaults: (
  padding: 0,
  font-size: 1rem,
  gap: var(--pdz-space-xs),
  background: transparent,
  border-width: 0px,
  border-style: solid,
  border-color: pdz-color(outline),
  box-shadow-hover: var(--pdz-level-1),
  opacity-disabled: 0.6,
  cursor-disabled: not-allowed,
  cursor: pointer,
  transition: all 0.2s ease-in-out,
);
```

#### Available Properties

**Layout:**

- `display` - Always `inline-flex`
- `align-items` - Always `center`
- `justify-content` - Always `center`

**Dimensions:**

- `height`, `width`
- `min-width`, `max-width`
- `min-height`, `max-height`

**Spacing:**

- `padding` - Internal spacing
- `gap` - Space between child elements

**Typography:**

- `font-size`, `font-family`, `font-weight`
- `text-decoration` - Always `none`
- `white-space` - Always `nowrap`

**Appearance:**

- `background`, `background-hover`, `background-active`, `background-selected`
- `color`, `color-hover`, `color-active`
- `border-radius`
- `border` (shorthand) or `border-width`, `border-style`, `border-color`
- `box-shadow-hover`

**States:**

- `opacity-disabled` - Opacity when disabled (default: 0.6)
- `cursor`, `cursor-disabled`
- `transition` - Animation timing

#### State Selectors

```scss
&.selected {
  /* Selected state */
}
&:not(:disabled):not(.disabled):hover {
  /* Hover state */
}
&:active {
  /* Active/pressed state */
}
&:disabled,
&.disabled {
  /* Disabled state */
}
```

#### Usage Example

```scss
.custom-button {
  @include base-button(
    (
      padding: 0.75rem 1.5rem,
      background: #007bff,
      color: white,
      border-radius: 8px,
      font-weight: 600,
      background-hover: #0056b3,
    )
  );
}
```

## Flat Buttons

Minimal styling with subtle hover effects. Best for secondary actions or toolbar buttons.

### `flat-button($overrides: ())`

Base flat button without theme colors.

#### Default Configuration

```scss
$flat-button-defaults: (
  padding: var(--pdz-space-xs) var(--pdz-space-xl),
  border-radius: var(--pdz-shape-corner-sm),
  background: transparent,
  background-hover: none,
  border-color: transparent,
);
```

### `flat-button-primary($overrides: ())`

Flat button with primary theme colors.

```scss
.action-btn {
  @include flat-button-primary();
}
```

### `flat-button-secondary($overrides: ())`

Flat button with secondary theme colors.

```scss
.secondary-action {
  @include flat-button-secondary(
    (
      padding: var(--pdz-space-sm) var(--pdz-space-lg),
    )
  );
}
```

### `flat-button-menu($overrides: ())`

Flat button with menu theme colors.

```scss
.menu-item {
  @include flat-button-menu();
}
```

#### Use Cases

- Toolbar actions
- Menu items
- Secondary actions
- Text buttons
- Dialog actions

## Icon Buttons

Square buttons optimized for single icons without text.

### `icon-button($overrides: ())`

Base icon button without theme colors.

#### Default Configuration

```scss
$icon-button-defaults: (
  padding: var(--pdz-space-xs),
  border-radius: var(--pdz-shape-corner-sm),
  width: 2.5rem,
  height: 2.5rem,
  background: transparent,
  background-hover: none,
  border-color: transparent,
);
```

### `icon-button-primary($overrides: ())`

Icon button with primary theme colors.

```scss
.close-btn {
  @include icon-button-primary();
}
```

### `icon-button-secondary($overrides: ())`

Icon button with secondary theme colors.

```scss
.settings-btn {
  @include icon-button-secondary(
    (
      width: 3rem,
      height: 3rem,
    )
  );
}
```

### `icon-button-menu($overrides: ())`

Icon button with menu theme colors.

```scss
.more-btn {
  @include icon-button-menu();
}
```

#### HTML Structure

```html
<button class="icon-btn">
  <mat-icon>close</mat-icon>
</button>
```

#### Use Cases

- Close buttons
- More actions (⋮)
- Navigation controls
- Toolbar icons
- Compact controls

## Floating Action Buttons

Circular elevated buttons for primary screen actions.

### `float-button($overrides: ())`

Creates a floating action button with elevation and circular shape.

#### Default Configuration

```scss
$float-button-defaults: (
  background: pdz-color(menu-container),
  background-hover: pdz-color(menu-container-hover),
  background-disabled: pdz-color(surface-disabled),
  padding: var(--pdz-space-md),
  border-radius: var(--pdz-shape-corner-full),
  box-shadow: var(--pdz-level-3),
  box-shadow-hover: var(--pdz-level-4),
  border: 1px solid pdz-color(menu-border),
  color: pdz-color(on-menu-container),
  color-disabled: pdz-color(on-surface-disabled),
  transition: all 0.2s ease-in-out,
  icon-size: 2rem,
);
```

#### Features

- Circular shape (`border-radius: full`)
- Elevated with shadow (`--pdz-level-3`)
- Hover elevation increase (`--pdz-level-4`)
- Material icon support with configurable size
- Disabled state styling

#### Usage

```scss
.add-fab {
  @include float-button(
    (
      background: #4caf50,
      icon-size: 2.5rem,
    )
  );
}
```

#### HTML Structure

```html
<button class="fab">
  <mat-icon>add</mat-icon>
</button>
```

## Radial Menu FABs

Advanced floating button container that expands into a radial menu of actions.

### `float-buttons($overrides: ())`

Creates a container with a main FAB that opens to reveal additional action buttons arranged radially.

#### Default Configuration

```scss
$float-buttons-defaults: (
  position: sticky,
  bottom: var(--pdz-space-lg),
  margin-right: var(--pdz-space-lg),
  z-index: 10000,
  radial-radius: 6rem,
  icon-size: 2rem,
  transition-base: 220ms ease,
  transition-opacity: 180ms ease,
  button-scale: 0.85,
  stagger-delay: 40ms,
);
```

#### Configurable Properties

- `position` - Positioning context (default: sticky)
- `bottom` - Distance from bottom edge
- `margin-right` - Right margin for alignment
- `z-index` - Layer priority
- `radial-radius` - Distance of expanded buttons from center
- `icon-size` - Size of Material icons
- `transition-base` - Main animation duration
- `transition-opacity` - Opacity fade timing
- `button-scale` - Scale of collapsed buttons
- `stagger-delay` - Delay between button animations

#### HTML Structure

```html
<div class="fab-container">
  <div class="radial-stack" [class.open]="isOpen">
    <!-- Main toggle button -->
    <button class="open-tools-button" (click)="toggleMenu()">
      <mat-icon>{{ isOpen ? 'close' : 'menu' }}</mat-icon>
    </button>

    <!-- Radial action buttons (hidden by default) -->
    <button class="tool-button" (click)="action1()">
      <mat-icon>edit</mat-icon>
    </button>

    <button class="tool-button" (click)="action2()">
      <mat-icon>delete</mat-icon>
    </button>

    <button class="tool-button" (click)="action3()">
      <mat-icon>share</mat-icon>
    </button>
  </div>
</div>
```

#### SCSS Usage

```scss
.fab-container {
  @include float-buttons(
    (
      radial-radius: 8rem,
      stagger-delay: 50ms,
      icon-size: 2.25rem,
    )
  );
}
```

#### Angular Component

```typescript
export class MyComponent {
  isOpen = false;

  toggleMenu(): void {
    this.isOpen = !this.isOpen;
  }

  action1(): void {
    console.log("Action 1");
    this.isOpen = false;
  }
}
```

#### Button Positioning

Buttons are positioned using CSS custom properties with the `--angle` variable:

```scss
.radial-stack > button:nth-of-type(2).tool-button {
  --angle: -90deg; // Top
}
.radial-stack > button:nth-of-type(3).tool-button {
  --angle: -135deg; // Top-left
}
.radial-stack > button:nth-of-type(4).tool-button {
  --angle: -180deg; // Left
}
```

**Custom Angles:**

```scss
.fab-container {
  @include float-buttons();

  // Override angles for 5 buttons in a semicircle
  .radial-stack > button:nth-of-type(2).tool-button {
    --angle: -45deg;
  }
  .radial-stack > button:nth-of-type(3).tool-button {
    --angle: -90deg;
  }
  .radial-stack > button:nth-of-type(4).tool-button {
    --angle: -135deg;
  }
  .radial-stack > button:nth-of-type(5).tool-button {
    --angle: -180deg;
  }
}
```

#### Animation Details

- **Collapsed State**: Buttons scale down to 0.85 and fade to opacity 0
- **Expanded State**: Buttons translate along their angle, scale to 1, and fade to opacity 1
- **Stagger Effect**: Each button has an incremental delay (40ms by default)
- **Transform Origin**: Center point maintained during rotation

## Customization

### Overriding Defaults

All default configurations can be overridden globally:

```scss
@use "path/to/mixins/buttons" as btn with (
  $base-button-defaults: (
    font-size: 1.125rem,
    transition: all 0.3s ease,
  )
);
```

### Theme Integration

Create custom themed buttons:

```scss
@use "sass:map";

$custom-theme: btn.create-themed-button-map("custom");

.themed-button {
  @include btn.flat-button(
    map.merge(
      $custom-theme,
      (
        padding: 1rem 2rem,
      )
    )
  );
}
```

### Combining Mixins

Stack multiple mixins for complex buttons:

```scss
.advanced-button {
  @include btn.base-button(
    (
      padding: 0.5rem 1rem,
    )
  );

  // Add custom styles
  text-transform: uppercase;
  letter-spacing: 0.05em;

  &:focus {
    outline: 2px solid var(--focus-color);
    outline-offset: 2px;
  }
}
```

## Best Practices

### 1. Use Semantic Button Types

```scss
// ✅ Good - Clear purpose
.submit-btn {
  @include flat-button-primary();
}
.cancel-btn {
  @include flat-button-secondary();
}

// ❌ Avoid - Generic naming
.btn1 {
  @include flat-button-primary();
}
```

### 2. Maintain Consistent Sizing

```scss
// ✅ Good - Use design system tokens
.action-btn {
  @include flat-button(
    (
      padding: var(--pdz-space-sm) var(--pdz-space-lg),
      border-radius: var(--pdz-shape-corner-sm),
    )
  );
}

// ❌ Avoid - Magic numbers
.action-btn {
  @include flat-button(
    (
      padding: 7px 19px,
      border-radius: 4.5px,
    )
  );
}
```

### 3. Limit FAB Usage

Use floating action buttons sparingly for primary screen actions only:

```scss
// ✅ Good - Single primary action
.page-container {
  .add-item-fab {
    @include float-button();
  }
}

// ❌ Avoid - Multiple competing FABs
.page-container {
  .fab-1,
  .fab-2,
  .fab-3 {
    @include float-button();
  }
}
```

### 4. Provide Adequate Touch Targets

Ensure buttons are at least 44x44px for touch interfaces:

```scss
// ✅ Good - Accessible touch target
.mobile-btn {
  @include icon-button(
    (
      width: 2.75rem,
      // 44px
      height: 2.75rem,
    )
  );
}
```

### 5. Handle Disabled States

Always style disabled states clearly:

```scss
.submit-btn {
  @include flat-button-primary(
    (
      opacity-disabled: 0.5,
      cursor-disabled: not-allowed,
    )
  );
}
```

### 6. Optimize Radial Menus

- Limit to 3-5 actions
- Use clear, recognizable icons
- Provide visual feedback
- Consider mobile viewport constraints

```scss
@media (max-width: 768px) {
  .fab-container {
    @include float-buttons(
      (
        radial-radius: 5rem,
        // Smaller radius on mobile
        bottom: var(--pdz-space-md),
      )
    );
  }
}
```

### 7. Maintain Focus Styles

Ensure keyboard navigation is visible:

```scss
.button {
  @include base-button();

  &:focus-visible {
    outline: 2px solid var(--pdz-color-primary);
    outline-offset: 2px;
  }
}
```

## Examples

### Basic Button Group

```html
<div class="button-group">
  <button class="btn-primary">Save</button>
  <button class="btn-secondary">Cancel</button>
</div>
```

```scss
.button-group {
  display: flex;
  gap: var(--pdz-space-sm);

  .btn-primary {
    @include flat-button-primary(
      (
        padding: var(--pdz-space-sm) var(--pdz-space-xl),
      )
    );
  }

  .btn-secondary {
    @include flat-button-secondary(
      (
        padding: var(--pdz-space-sm) var(--pdz-space-xl),
      )
    );
  }
}
```

### Icon Button Toolbar

```html
<div class="toolbar">
  <button class="tool-btn" aria-label="Edit">
    <mat-icon>edit</mat-icon>
  </button>
  <button class="tool-btn" aria-label="Delete">
    <mat-icon>delete</mat-icon>
  </button>
  <button class="tool-btn" aria-label="Share">
    <mat-icon>share</mat-icon>
  </button>
</div>
```

```scss
.toolbar {
  display: flex;
  gap: var(--pdz-space-2xs);
  padding: var(--pdz-space-xs);

  .tool-btn {
    @include icon-button-menu();
  }
}
```

### Loading Button

```typescript
export class LoadingButtonComponent {
  isLoading = false;

  async handleClick() {
    this.isLoading = true;
    try {
      await this.performAction();
    } finally {
      this.isLoading = false;
    }
  }
}
```

```html
<button class="loading-btn" [disabled]="isLoading" (click)="handleClick()">
  @if (isLoading) {
  <mat-spinner diameter="20"></mat-spinner>
  } @else {
  <span>Submit</span>
  }
</button>
```

```scss
.loading-btn {
  @include flat-button-primary(
    (
      min-width: 120px,
      padding: var(--pdz-space-sm) var(--pdz-space-lg),
    )
  );

  position: relative;

  mat-spinner {
    margin: 0 auto;
  }
}
```

### Responsive FAB Menu

```scss
.fab-container {
  @include float-buttons();

  // Adjust for tablet
  @media (max-width: 1024px) {
    margin-right: var(--pdz-space-md);
    --radial-radius: 5rem;
  }

  // Adjust for mobile
  @media (max-width: 640px) {
    margin-right: var(--pdz-space-sm);
    bottom: var(--pdz-space-md);
    --radial-radius: 4rem;

    button {
      padding: var(--pdz-space-sm);

      mat-icon {
        font-size: 1.5rem;
      }
    }
  }
}
```

## CSS Variables Used

The button mixins rely on these CSS custom properties:

**Spacing:**

- `--pdz-space-2xs`, `--pdz-space-xs`, `--pdz-space-sm`
- `--pdz-space-md`, `--pdz-space-lg`, `--pdz-space-xl`

**Shape:**

- `--pdz-shape-corner-sm` - Small border radius
- `--pdz-shape-corner-md` - Medium border radius
- `--pdz-shape-corner-full` - Fully rounded (pills/circles)

**Elevation:**

- `--pdz-level-1` - Subtle elevation
- `--pdz-level-3` - Medium elevation (FABs)
- `--pdz-level-4` - High elevation (FAB hover)

**Colors** (via `pdz-color()` function):

- Theme containers: `primary-container`, `secondary-container`, `menu-container`
- Hover states: `*-container-hover`
- Selected states: `*-container-high`
- Borders: `*-border`, `outline`
- Text: `on-*-container`, `on-surface`
- Disabled: `surface-disabled`, `on-surface-disabled`

Ensure these variables are defined in your design system.

## Migration Guide

### From Custom Buttons

**Before:**

```scss
.my-button {
  display: inline-flex;
  padding: 0.5rem 1rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background: #0056b3;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
```

**After:**

```scss
.my-button {
  @include flat-button-primary(
    (
      padding: var(--pdz-space-sm) var(--pdz-space-lg),
    )
  );
}
```

### Benefits

✅ Consistent styling across application  
✅ Theme integration automatic  
✅ Reduced code duplication  
✅ Built-in state management  
✅ Accessible by default  
✅ Easy customization  
✅ Responsive-ready
