# Scale Mixins

Color scale system for visualizing graduated positive, negative, and neutral values through background color utilities. Perfect for stats visualization, matchup advantages, performance indicators, and any data requiring visual magnitude representation.

## Table of Contents

- [Quick Start](#quick-start)
- [Overview](#overview)
- [Scale Maps](#scale-maps)
- [Generate Mixin](#generate-mixin)
- [Usage Examples](#usage-examples)
- [Customization](#customization)
- [Best Practices](#best-practices)
- [Integration Patterns](#integration-patterns)
- [Accessibility](#accessibility)

## Quick Start

```scss
@use "path/to/mixins/scales" as scales;

// Generate scale utility classes with default prefix
@include scales.generate-bg-scale();

// Or with custom prefix
@include scales.generate-bg-scale("matchup");
```

```html
<!-- Use generated classes -->
<div class="pdz-scale-positive-5">Strong advantage</div>
<div class="pdz-scale-negative-3">Moderate disadvantage</div>
<div class="pdz-scale-neutral">No effect</div>
```

## Overview

The scale system provides a **7-level graduated color scale** for both positive and negative values, plus a neutral state. This creates a consistent visual language for representing:

- **Positive values** (1-7): Light to dark greens (or theme color)
- **Negative values** (1-7): Light to dark reds (or theme color)
- **Neutral**: Gray or neutral theme color

### Scale Range

```
Positive Scale:
1 ═══ Minimal advantage
2 ═══ Slight advantage
3 ═══ Moderate advantage
4 ═══ Good advantage
5 ═══ Strong advantage
6 ═══ Very strong advantage
7 ═══ Maximum advantage

Neutral:
0 ═══ No advantage/disadvantage

Negative Scale:
-1 ═══ Minimal disadvantage
-2 ═══ Slight disadvantage
-3 ═══ Moderate disadvantage
-4 ═══ Significant disadvantage
-5 ═══ Strong disadvantage
-6 ═══ Very strong disadvantage
-7 ═══ Maximum disadvantage
```

## Scale Maps

### `$positive-scale`

Map of positive scale colors from 1 (lightest) to 7 (darkest).

```scss
$positive-scale: (
  1: var(--pdz-color-scale-positive-1),
  2: var(--pdz-color-scale-positive-2),
  3: var(--pdz-color-scale-positive-3),
  4: var(--pdz-color-scale-positive-4),
  5: var(--pdz-color-scale-positive-5),
  6: var(--pdz-color-scale-positive-6),
  7: var(--pdz-color-scale-positive-7),
);
```

**Default Colors (example):**

- Level 1: `#e8f5e9` (lightest green)
- Level 4: `#4caf50` (medium green)
- Level 7: `#1b5e20` (darkest green)

### `$negative-scale`

Map of negative scale colors from 1 (lightest) to 7 (darkest).

```scss
$negative-scale: (
  1: var(--pdz-color-scale-negative-1),
  2: var(--pdz-color-scale-negative-2),
  3: var(--pdz-color-scale-negative-3),
  4: var(--pdz-color-scale-negative-4),
  5: var(--pdz-color-scale-negative-5),
  6: var(--pdz-color-scale-negative-6),
  7: var(--pdz-color-scale-negative-7),
);
```

**Default Colors (example):**

- Level 1: `#ffebee` (lightest red)
- Level 4: `#f44336` (medium red)
- Level 7: `#b71c1c` (darkest red)

### Neutral Color

```scss
var(--pdz-color-scale-neutral)
```

Typically a gray or neutral theme color representing zero/no effect.

## Generate Mixin

### `generate-bg-scale($class-prefix)`

Generates background color utility classes for all scale levels.

#### Parameters

- **`$class-prefix`** (String, default: `'pdz-scale'`) - Prefix for generated class names

#### Generated Classes

```scss
// Default prefix
@include generate-bg-scale();

// Generates:
.pdz-scale-positive-1 through .pdz-scale-positive-7
.pdz-scale-negative-1 through .pdz-scale-negative-7
.pdz-scale-neutral

// Custom prefix
@include generate-bg-scale('score');

// Generates:
.score-positive-1 through .score-positive-7
.score-negative-1 through .score-negative-7
.score-neutral
```

#### Output

Each class sets the `background-color` property:

```scss
.pdz-scale-positive-5 {
  background-color: var(--pdz-color-scale-positive-5);
}

.pdz-scale-negative-3 {
  background-color: var(--pdz-color-scale-negative-3);
}

.pdz-scale-neutral {
  background-color: var(--pdz-color-scale-neutral);
}
```

## Usage Examples

### Basic Usage

```html
<div class="stat-cell pdz-scale-positive-6">2x Effective</div>

<div class="stat-cell pdz-scale-negative-6">0.5x Effective</div>

<div class="stat-cell pdz-scale-neutral">1x Effective</div>
```

```scss
.stat-cell {
  padding: 0.5rem;
  text-align: center;
  border-radius: 4px;
  font-weight: 500;
}

// Generate scale classes
@include generate-bg-scale();
```

### Type Effectiveness Grid

```typescript
interface TypeMatchup {
  attacking: string;
  defending: string;
  effectiveness: number; // 0.25, 0.5, 1, 2, 4
}

getScaleClass(effectiveness: number): string {
  if (effectiveness >= 4) return 'pdz-scale-positive-7';
  if (effectiveness >= 2) return 'pdz-scale-positive-6';
  if (effectiveness > 1) return 'pdz-scale-positive-4';
  if (effectiveness === 1) return 'pdz-scale-neutral';
  if (effectiveness >= 0.5) return 'pdz-scale-negative-4';
  if (effectiveness >= 0.25) return 'pdz-scale-negative-6';
  return 'pdz-scale-negative-7';
}
```

```html
<table class="type-chart">
  <thead>
    <tr>
      <th>Type</th>
      <th *ngFor="let type of types">{{ type }}</th>
    </tr>
  </thead>
  <tbody>
    <tr *ngFor="let attackType of types">
      <th>{{ attackType }}</th>
      <td *ngFor="let defType of types" [class]="getScaleClass(getEffectiveness(attackType, defType))">{{ getEffectiveness(attackType, defType) }}×</td>
    </tr>
  </tbody>
</table>
```

```scss
.type-chart {
  border-collapse: separate;
  border-spacing: 2px;

  th,
  td {
    padding: 0.5rem;
    text-align: center;
    min-width: 3rem;
  }

  @include generate-bg-scale();
}
```

### Stat Comparison

```html
<div class="stat-comparison">
  <div class="stat-row">
    <span class="stat-name">Attack</span>
    <span class="stat-value">120</span>
    <span class="stat-diff pdz-scale-positive-4">+20</span>
  </div>

  <div class="stat-row">
    <span class="stat-name">Defense</span>
    <span class="stat-value">85</span>
    <span class="stat-diff pdz-scale-negative-3">-15</span>
  </div>

  <div class="stat-row">
    <span class="stat-name">Speed</span>
    <span class="stat-value">100</span>
    <span class="stat-diff pdz-scale-neutral">0</span>
  </div>
</div>
```

```scss
.stat-comparison {
  @include generate-bg-scale();

  .stat-row {
    display: flex;
    gap: 1rem;
    padding: 0.5rem;
    align-items: center;
  }

  .stat-diff {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-weight: 600;
    min-width: 3rem;
    text-align: center;
  }
}
```

### Score Badge

```typescript
@Component({
  selector: "app-score-badge",
  template: `
    <span class="score-badge" [class]="getScaleClass()">
      {{ formatScore() }}
    </span>
  `,
})
export class ScoreBadgeComponent {
  @Input() score: number = 0;
  @Input() maxScore: number = 100;

  getScaleClass(): string {
    const normalized = (this.score / this.maxScore) * 7;

    if (normalized > 0) {
      const level = Math.min(Math.ceil(normalized), 7);
      return `pdz-scale-positive-${level}`;
    } else if (normalized < 0) {
      const level = Math.min(Math.ceil(Math.abs(normalized)), 7);
      return `pdz-scale-negative-${level}`;
    }

    return "pdz-scale-neutral";
  }

  formatScore(): string {
    return this.score > 0 ? `+${this.score}` : String(this.score);
  }
}
```

```scss
.score-badge {
  @include generate-bg-scale();

  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-weight: 600;
  font-size: 0.875rem;
  display: inline-block;
}
```

### Heatmap

```html
<div class="heatmap">
  @for (row of heatmapData; track $index) {
  <div class="heatmap-row">
    @for (cell of row; track $index) {
    <div class="heatmap-cell" [class]="getHeatClass(cell.value)">{{ cell.label }}</div>
    }
  </div>
  }
</div>
```

```typescript
getHeatClass(value: number): string {
  // Normalize value to -7 to +7 range
  const normalized = this.normalizeValue(value);

  if (normalized > 0) {
    return `pdz-scale-positive-${normalized}`;
  } else if (normalized < 0) {
    return `pdz-scale-negative-${Math.abs(normalized)}`;
  }
  return 'pdz-scale-neutral';
}

normalizeValue(value: number): number {
  const min = Math.min(...this.allValues);
  const max = Math.max(...this.allValues);
  const range = max - min;

  if (range === 0) return 0;

  const normalized = ((value - min) / range) * 14 - 7;
  return Math.round(normalized);
}
```

```scss
.heatmap {
  @include generate-bg-scale();

  display: inline-block;

  .heatmap-row {
    display: flex;
  }

  .heatmap-cell {
    width: 3rem;
    height: 3rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(0, 0, 0, 0.1);
    font-size: 0.875rem;
    font-weight: 500;
  }
}
```

## Customization

### Custom Class Prefix

Generate multiple scale sets for different purposes:

```scss
// Matchup scales
@include generate-bg-scale("matchup");

// Score scales
@include generate-bg-scale("score");

// Performance scales
@include generate-bg-scale("performance");
```

```html
<div class="matchup-positive-5">Type advantage</div>
<div class="score-negative-3">Below average</div>
<div class="performance-positive-7">Excellent</div>
```

### Custom Scale Colors

Override the CSS variables to customize colors:

```scss
:root {
  // Custom positive scale (blue theme)
  --pdz-color-scale-positive-1: #e3f2fd;
  --pdz-color-scale-positive-2: #bbdefb;
  --pdz-color-scale-positive-3: #90caf9;
  --pdz-color-scale-positive-4: #64b5f6;
  --pdz-color-scale-positive-5: #42a5f5;
  --pdz-color-scale-positive-6: #2196f3;
  --pdz-color-scale-positive-7: #1976d2;

  // Custom negative scale (orange theme)
  --pdz-color-scale-negative-1: #fff3e0;
  --pdz-color-scale-negative-2: #ffe0b2;
  --pdz-color-scale-negative-3: #ffcc80;
  --pdz-color-scale-negative-4: #ffb74d;
  --pdz-color-scale-negative-5: #ffa726;
  --pdz-color-scale-negative-6: #ff9800;
  --pdz-color-scale-negative-7: #f57c00;

  // Custom neutral
  --pdz-color-scale-neutral: #e0e0e0;
}
```

### Dark Theme Scales

```scss
[data-theme="dark"] {
  // Darker positive scale
  --pdz-color-scale-positive-1: #1b5e20;
  --pdz-color-scale-positive-2: #2e7d32;
  --pdz-color-scale-positive-3: #388e3c;
  --pdz-color-scale-positive-4: #43a047;
  --pdz-color-scale-positive-5: #4caf50;
  --pdz-color-scale-positive-6: #66bb6a;
  --pdz-color-scale-positive-7: #81c784;

  // Darker negative scale
  --pdz-color-scale-negative-1: #b71c1c;
  --pdz-color-scale-negative-2: #c62828;
  --pdz-color-scale-negative-3: #d32f2f;
  --pdz-color-scale-negative-4: #e53935;
  --pdz-color-scale-negative-5: #f44336;
  --pdz-color-scale-negative-6: #ef5350;
  --pdz-color-scale-negative-7: #e57373;

  --pdz-color-scale-neutral: #424242;
}
```

### Text Color for Contrast

Ensure readable text on scale backgrounds:

```scss
@include generate-bg-scale();

// Add text color overrides for darker scales
.pdz-scale-positive-5,
.pdz-scale-positive-6,
.pdz-scale-positive-7,
.pdz-scale-negative-5,
.pdz-scale-negative-6,
.pdz-scale-negative-7 {
  color: white;
}

// Or use a mixin
@mixin scale-with-text($prefix: "pdz-scale") {
  @include generate-bg-scale($prefix);

  @for $i from 5 through 7 {
    .#{$prefix}-positive-#{$i},
    .#{$prefix}-negative-#{$i} {
      color: white;
    }
  }

  @for $i from 1 through 4 {
    .#{$prefix}-positive-#{$i},
    .#{$prefix}-negative-#{$i} {
      color: rgba(0, 0, 0, 0.87);
    }
  }

  .#{$prefix}-neutral {
    color: rgba(0, 0, 0, 0.87);
  }
}
```

## Best Practices

### 1. Use Consistent Scales

Map values to scale levels consistently across your application:

```typescript
// ✅ Good - Centralized scaling logic
class ScaleService {
  getScaleLevel(value: number, min: number, max: number): number {
    const normalized = (value - min) / (max - min);
    return Math.round(normalized * 7);
  }

  getScaleClass(level: number, prefix = "pdz-scale"): string {
    if (level > 0) {
      return `${prefix}-positive-${Math.min(level, 7)}`;
    } else if (level < 0) {
      return `${prefix}-negative-${Math.min(Math.abs(level), 7)}`;
    }
    return `${prefix}-neutral`;
  }
}

// ❌ Avoid - Inconsistent scaling per component
// Different components using different scaling logic
```

### 2. Ensure Text Contrast

Always check that text is readable on scale backgrounds:

```scss
// ✅ Good - Adequate contrast
.pdz-scale-positive-7 {
  background-color: #1b5e20;
  color: white; // High contrast
}

// ❌ Avoid - Poor contrast
.pdz-scale-positive-1 {
  background-color: #e8f5e9;
  color: #e0e0e0; // Barely visible
}
```

### 3. Provide Context

Don't rely solely on color - include text or icons:

```html
<!-- ✅ Good - Color + text -->
<div class="pdz-scale-positive-5">
  <mat-icon>trending_up</mat-icon>
  <span>Strong Advantage (+5)</span>
</div>

<!-- ❌ Avoid - Color only -->
<div class="pdz-scale-positive-5"></div>
```

### 4. Use Semantic Level Selection

Choose scale levels that make semantic sense:

```typescript
// ✅ Good - Clear thresholds
function getPerformanceScale(percentage: number): string {
  if (percentage >= 90) return "pdz-scale-positive-7"; // Excellent
  if (percentage >= 75) return "pdz-scale-positive-5"; // Good
  if (percentage >= 60) return "pdz-scale-positive-3"; // Above average
  if (percentage >= 40) return "pdz-scale-neutral"; // Average
  if (percentage >= 25) return "pdz-scale-negative-3"; // Below average
  if (percentage >= 10) return "pdz-scale-negative-5"; // Poor
  return "pdz-scale-negative-7"; // Very poor
}

// ❌ Avoid - Arbitrary mapping
function getScale(value: number): string {
  return `pdz-scale-positive-${(value % 7) + 1}`; // Random
}
```

### 5. Document Scale Meanings

Document what each level represents:

```typescript
/**
 * Type effectiveness scale levels:
 * +7: 4x super effective (double weakness)
 * +6: 2x super effective
 * +4: 1.5x effective
 *  0: 1x neutral
 * -4: 0.5x not very effective
 * -6: 0.25x (double resistance)
 * -7: 0x immune
 */
const TYPE_SCALE_MAP = {
  4.0: 7,
  2.0: 6,
  1.5: 4,
  1.0: 0,
  0.5: -4,
  0.25: -6,
  0: -7,
};
```

### 6. Test Color Blindness

Ensure scales work for colorblind users:

- Don't use green/red exclusively
- Add patterns or icons
- Provide text alternatives
- Test with colorblind simulators

```html
<!-- ✅ Good - Multiple indicators -->
<div class="stat pdz-scale-positive-5" data-value="+5">
  <mat-icon class="trend-icon">arrow_upward</mat-icon>
  <span class="stat-value">+5</span>
  <span class="stat-label">Strong</span>
</div>
```

### 7. Use Appropriate Granularity

Don't use all 7 levels if fewer would suffice:

```typescript
// ✅ Good - 3-level scale for simple comparisons
function getSimpleScale(value: number): string {
  if (value > 0) return "pdz-scale-positive-4";
  if (value < 0) return "pdz-scale-negative-4";
  return "pdz-scale-neutral";
}

// ❌ Avoid - Unnecessary precision
function getOverlyPreciseScale(value: number): string {
  // Using all 7 levels when differences aren't meaningful
  return `pdz-scale-positive-${Math.ceil(value * 7)}`;
}
```

## Integration Patterns

### Angular Directive

Create a directive for easy scale application:

```typescript
@Directive({
  selector: "[appScale]",
})
export class ScaleDirective {
  @Input() set appScale(value: number) {
    this.updateScale(value);
  }

  @Input() appScaleMin = -7;
  @Input() appScaleMax = 7;
  @Input() appScalePrefix = "pdz-scale";

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
  ) {}

  private updateScale(value: number): void {
    // Remove previous scale classes
    this.el.nativeElement.classList.forEach((cls: string) => {
      if (cls.startsWith(this.appScalePrefix)) {
        this.renderer.removeClass(this.el.nativeElement, cls);
      }
    });

    // Add new scale class
    const level = this.normalizeToScale(value);
    const scaleClass = this.getScaleClass(level);
    this.renderer.addClass(this.el.nativeElement, scaleClass);
  }

  private normalizeToScale(value: number): number {
    const range = this.appScaleMax - this.appScaleMin;
    const normalized = ((value - this.appScaleMin) / range) * 14 - 7;
    return Math.round(Math.max(-7, Math.min(7, normalized)));
  }

  private getScaleClass(level: number): string {
    if (level > 0) {
      return `${this.appScalePrefix}-positive-${level}`;
    } else if (level < 0) {
      return `${this.appScalePrefix}-negative-${Math.abs(level)}`;
    }
    return `${this.appScalePrefix}-neutral`;
  }
}
```

Usage:

```html
<div [appScale]="pokemon.attack - opponent.defense">Attack difference</div>

<div [appScale]="effectiveness" [appScaleMin]="0" [appScaleMax]="4">Type effectiveness</div>
```

### Pipe

```typescript
@Pipe({ name: "scaleClass" })
export class ScaleClassPipe implements PipeTransform {
  transform(value: number, min: number = -7, max: number = 7, prefix: string = "pdz-scale"): string {
    const normalized = ((value - min) / (max - min)) * 14 - 7;
    const level = Math.round(Math.max(-7, Math.min(7, normalized)));

    if (level > 0) {
      return `${prefix}-positive-${level}`;
    } else if (level < 0) {
      return `${prefix}-negative-${Math.abs(level)}`;
    }
    return `${prefix}-neutral`;
  }
}
```

Usage:

```html
<div [class]="matchupValue | scaleClass:0:4">{{ matchupValue }}x effective</div>
```

## Accessibility

### Color Contrast

Ensure WCAG AA compliance (4.5:1 for normal text):

```scss
// Test contrast ratios
.pdz-scale-positive-7 {
  background-color: #1b5e20;
  color: white; // Contrast ratio: 7.2:1 ✅
}

.pdz-scale-positive-1 {
  background-color: #e8f5e9;
  color: #1b5e20; // Contrast ratio: 9.1:1 ✅
}
```

### ARIA Labels

Provide text alternatives:

```html
<div class="pdz-scale-positive-5" role="status" aria-label="Strong advantage, level 5 out of 7">+5</div>
```

### Screen Reader Support

```html
<div class="matchup-grid">
  @for (cell of cells; track cell.id) {
  <div [class]="getScaleClass(cell.value)" role="gridcell" [attr.aria-label]="getAriaLabel(cell)">
    {{ cell.displayValue }}
    <span class="sr-only">{{ getDescription(cell.value) }}</span>
  </div>
  }
</div>
```

```typescript
getAriaLabel(cell: Cell): string {
  const effectiveness = cell.value;
  if (effectiveness > 2) return 'Super effective';
  if (effectiveness > 1) return 'Effective';
  if (effectiveness === 1) return 'Neutral';
  if (effectiveness > 0.5) return 'Not very effective';
  return 'Immune';
}
```

### Reduced Motion

Respect user preferences:

```scss
@media (prefers-reduced-motion: reduce) {
  .pdz-scale-positive-1,
  .pdz-scale-negative-1,
  .pdz-scale-neutral {
    transition: none;
  }
}
```

## CSS Variables Used

The scale mixins rely on these CSS custom properties:

**Positive Scale:**

- `--pdz-color-scale-positive-1` through `--pdz-color-scale-positive-7`

**Negative Scale:**

- `--pdz-color-scale-negative-1` through `--pdz-color-scale-negative-7`

**Neutral:**

- `--pdz-color-scale-neutral`

Example definitions:

```css
:root {
  --pdz-color-scale-positive-1: #e8f5e9;
  --pdz-color-scale-positive-2: #c8e6c9;
  --pdz-color-scale-positive-3: #a5d6a7;
  --pdz-color-scale-positive-4: #81c784;
  --pdz-color-scale-positive-5: #66bb6a;
  --pdz-color-scale-positive-6: #4caf50;
  --pdz-color-scale-positive-7: #2e7d32;

  --pdz-color-scale-negative-1: #ffebee;
  --pdz-color-scale-negative-2: #ffcdd2;
  --pdz-color-scale-negative-3: #ef9a9a;
  --pdz-color-scale-negative-4: #e57373;
  --pdz-color-scale-negative-5: #ef5350;
  --pdz-color-scale-negative-6: #f44336;
  --pdz-color-scale-negative-7: #c62828;

  --pdz-color-scale-neutral: #e0e0e0;
}
```
