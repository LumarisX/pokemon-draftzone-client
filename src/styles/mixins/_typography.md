# Typography Mixins

Typography utilities for consistent font sizing and line heights throughout your application. Provides automatic line-height calculation to maintain vertical rhythm and readability.

## Table of Contents

- [Quick Start](#quick-start)
- [Font Size Mixin](#font-size-mixin)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)
- [Typography Scales](#typography-scales)
- [Advanced Patterns](#advanced-patterns)
- [Accessibility](#accessibility)

## Quick Start

```scss
@use "path/to/mixins/typography" as type;

.heading {
  @include type.font-size(2rem, 1.3);
}

.body-text {
  @include type.font-size(1rem); // Uses default multiplier 1.2
}

.small-text {
  @include type.font-size(0.875rem, 1.4);
}
```

## Font Size Mixin

### `font-size($font-size, $multiplier)`

Sets font size with automatically calculated line height based on a multiplier.

#### Parameters

- **`$font-size`** (Length, default: `1rem`) - The font size value
- **`$multiplier`** (Number, default: `1.2`) - Line height multiplier (relative to font size)

#### Output

```scss
font-size: $font-size;
line-height: $font-size * $multiplier;
```

#### How It Works

The mixin calculates line height by multiplying the font size by the multiplier:

```scss
@include font-size(1.5rem, 1.4);

// Generates:
// font-size: 1.5rem;
// line-height: 2.1rem;  (1.5 × 1.4 = 2.1)
```

### Default Multiplier

When the multiplier is omitted, it defaults to `1.2`:

```scss
@include font-size(1rem);

// Generates:
// font-size: 1rem;
// line-height: 1.2rem;  (1 × 1.2)
```

### Why Use a Multiplier?

Line height multipliers provide:

1. **Proportional Spacing** - Line height scales with font size
2. **Consistent Rhythm** - Maintains vertical rhythm across different text sizes
3. **Readability** - Ensures adequate spacing between lines
4. **Flexibility** - Easy to adjust spacing for different contexts

### Recommended Multipliers

```scss
// Tight spacing - headlines, display text
$multiplier-tight: 1.1;

// Normal spacing - body text
$multiplier-normal: 1.2;

// Comfortable spacing - long-form content
$multiplier-comfortable: 1.5;

// Loose spacing - large text, readability
$multiplier-loose: 1.6;
```

## Usage Examples

### Basic Text Styling

```scss
.paragraph {
  @include font-size(1rem, 1.5); // Comfortable reading
}

.heading-1 {
  @include font-size(2.5rem, 1.2); // Tight spacing for large text
}

.caption {
  @include font-size(0.75rem, 1.4); // Smaller with more space
}
```

### Typography Scale

Create a consistent typography system:

```scss
// Typography scale with semantic names
.text-xs {
  @include font-size(0.75rem, 1.4); // 12px → 16.8px line-height
}

.text-sm {
  @include font-size(0.875rem, 1.4); // 14px → 19.6px line-height
}

.text-base {
  @include font-size(1rem, 1.5); // 16px → 24px line-height
}

.text-lg {
  @include font-size(1.125rem, 1.4); // 18px → 25.2px line-height
}

.text-xl {
  @include font-size(1.25rem, 1.3); // 20px → 26px line-height
}

.text-2xl {
  @include font-size(1.5rem, 1.3); // 24px → 31.2px line-height
}

.text-3xl {
  @include font-size(1.875rem, 1.2); // 30px → 36px line-height
}

.text-4xl {
  @include font-size(2.25rem, 1.2); // 36px → 43.2px line-height
}

.text-5xl {
  @include font-size(3rem, 1.1); // 48px → 52.8px line-height
}
```

### Heading Hierarchy

```scss
h1,
.h1 {
  @include font-size(2.5rem, 1.2);
  font-weight: 700;
  margin-bottom: 1rem;
}

h2,
.h2 {
  @include font-size(2rem, 1.25);
  font-weight: 600;
  margin-bottom: 0.875rem;
}

h3,
.h3 {
  @include font-size(1.75rem, 1.3);
  font-weight: 600;
  margin-bottom: 0.75rem;
}

h4,
.h4 {
  @include font-size(1.5rem, 1.3);
  font-weight: 500;
  margin-bottom: 0.625rem;
}

h5,
.h5 {
  @include font-size(1.25rem, 1.4);
  font-weight: 500;
  margin-bottom: 0.5rem;
}

h6,
.h6 {
  @include font-size(1rem, 1.4);
  font-weight: 500;
  margin-bottom: 0.5rem;
}
```

### Body Text Variants

```scss
.body-text {
  @include font-size(1rem, 1.5);

  &--large {
    @include font-size(1.125rem, 1.5);
  }

  &--small {
    @include font-size(0.875rem, 1.5);
  }

  &--tight {
    @include font-size(1rem, 1.2);
  }

  &--loose {
    @include font-size(1rem, 1.8);
  }
}
```

### Display Text

```scss
.display {
  font-weight: 700;
  letter-spacing: -0.02em;

  &--1 {
    @include font-size(4rem, 1.1);
  }

  &--2 {
    @include font-size(3.5rem, 1.1);
  }

  &--3 {
    @include font-size(3rem, 1.15);
  }

  &--4 {
    @include font-size(2.5rem, 1.2);
  }
}
```

### UI Text

```scss
.button-text {
  @include font-size(0.875rem, 1.2);
  font-weight: 500;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.label-text {
  @include font-size(0.75rem, 1.3);
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.caption-text {
  @include font-size(0.75rem, 1.4);
  color: var(--pdz-color-text-secondary);
}

.overline-text {
  @include font-size(0.625rem, 1.6);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
```

### Responsive Typography

```scss
.hero-title {
  @include font-size(2rem, 1.2);

  @media (min-width: 768px) {
    @include font-size(3rem, 1.15);
  }

  @media (min-width: 1024px) {
    @include font-size(4rem, 1.1);
  }
}

.article-body {
  @include font-size(1rem, 1.5);

  @media (min-width: 768px) {
    @include font-size(1.125rem, 1.6);
  }
}
```

## Best Practices

### 1. Use Consistent Multipliers

Define standard multipliers for different text types:

```scss
// ✅ Good - Consistent system
$line-height-tight: 1.1; // Display, hero text
$line-height-normal: 1.2; // Headings
$line-height-base: 1.5; // Body text, paragraphs
$line-height-loose: 1.6; // Long-form content

.heading {
  @include font-size(2rem, $line-height-normal);
}

.paragraph {
  @include font-size(1rem, $line-height-base);
}

// ❌ Avoid - Arbitrary multipliers
.text {
  @include font-size(1rem, 1.73); // Why 1.73?
}
```

### 2. Larger Text = Tighter Line Height

As font size increases, reduce the multiplier:

```scss
// ✅ Good - Proportional adjustment
.display {
  @include font-size(4rem, 1.1); // Large text, tight spacing
}

.heading {
  @include font-size(2rem, 1.2); // Medium text, normal spacing
}

.body {
  @include font-size(1rem, 1.5); // Small text, comfortable spacing
}

// ❌ Avoid - Same multiplier for all sizes
.large-text {
  @include font-size(4rem, 1.5); // Too much space
}
```

### 3. Consider Reading Context

Adjust line height based on how text will be read:

```scss
// ✅ Good - Context-appropriate spacing
.long-form-article {
  @include font-size(1.125rem, 1.6); // Loose for comfortable reading
  max-width: 65ch; // Optimal line length
}

.ui-label {
  @include font-size(0.875rem, 1.2); // Tight for compact UI
}

.table-cell {
  @include font-size(0.875rem, 1.3); // Balanced for data tables
}
```

### 4. Maintain Vertical Rhythm

Align line heights to a baseline grid:

```scss
// ✅ Good - Grid-aligned
$baseline: 0.25rem; // 4px baseline grid

.text-sm {
  @include font-size(0.875rem, 1.43); // 1.25rem line-height (5 × 4px)
}

.text-base {
  @include font-size(1rem, 1.5); // 1.5rem line-height (6 × 4px)
}

.text-lg {
  @include font-size(1.125rem, 1.56); // 1.75rem line-height (7 × 4px)
}
```

### 5. Test on Multiple Screens

Ensure typography scales well:

```scss
// ✅ Good - Responsive scaling
.hero-text {
  @include font-size(clamp(2rem, 5vw, 4rem), 1.1);
}

@media (max-width: 768px) {
  .body-text {
    @include font-size(1rem, 1.6); // More space on mobile
  }
}

@media (min-width: 1200px) {
  .body-text {
    @include font-size(1.125rem, 1.5); // Larger on desktop
  }
}
```

### 6. Account for Font Family

Different fonts need different multipliers:

```scss
// ✅ Good - Font-specific adjustments
.text-serif {
  font-family: Georgia, serif;
  @include font-size(1rem, 1.6); // Serif needs more space
}

.text-sans {
  font-family: "Helvetica Neue", sans-serif;
  @include font-size(1rem, 1.5); // Sans-serif works with less
}

.text-mono {
  font-family: "Fira Code", monospace;
  @include font-size(0.875rem, 1.7); // Monospace needs lots of space
}
```

### 7. Use Unitless for Inheritance

For better inheritance, consider unitless line heights:

```scss
// Alternative approach with unitless values
@mixin font-size-unitless($font-size: 1rem, $line-height: 1.5) {
  font-size: $font-size;
  line-height: $line-height; // Unitless - relative to font-size
}

.parent {
  @include font-size-unitless(1rem, 1.5);
}

.child {
  font-size: 0.875rem; // Inherits parent's 1.5 line-height ratio
}
```

## Typography Scales

### Modular Scale

Create a harmonious scale using ratios:

```scss
// Major Third (1.25 ratio)
$scale-ratio: 1.25;
$base-size: 1rem;

@function scale($level) {
  @return $base-size * pow($scale-ratio, $level);
}

.text-xs {
  @include font-size(scale(-2), 1.5); // 0.64rem
}

.text-sm {
  @include font-size(scale(-1), 1.4); // 0.8rem
}

.text-base {
  @include font-size(scale(0), 1.5); // 1rem
}

.text-lg {
  @include font-size(scale(1), 1.4); // 1.25rem
}

.text-xl {
  @include font-size(scale(2), 1.3); // 1.563rem
}

.text-2xl {
  @include font-size(scale(3), 1.2); // 1.953rem
}

.text-3xl {
  @include font-size(scale(4), 1.2); // 2.441rem
}

.text-4xl {
  @include font-size(scale(5), 1.1); // 3.052rem
}
```

### Perfect Fourth Scale (1.333)

```scss
$scale-4th: 1.333;

.scale-4th-xs {
  @include font-size(0.75rem, 1.5);
}
.scale-4th-sm {
  @include font-size(0.875rem, 1.4);
}
.scale-4th-base {
  @include font-size(1rem, 1.5);
}
.scale-4th-lg {
  @include font-size(1.333rem, 1.4);
}
.scale-4th-xl {
  @include font-size(1.777rem, 1.3);
}
.scale-4th-2xl {
  @include font-size(2.369rem, 1.2);
}
.scale-4th-3xl {
  @include font-size(3.157rem, 1.2);
}
.scale-4th-4xl {
  @include font-size(4.209rem, 1.1);
}
```

### Golden Ratio Scale (1.618)

```scss
$golden-ratio: 1.618;

.scale-golden-xs {
  @include font-size(0.625rem, 1.6);
}
.scale-golden-sm {
  @include font-size(0.75rem, 1.5);
}
.scale-golden-base {
  @include font-size(1rem, 1.5);
}
.scale-golden-lg {
  @include font-size(1.618rem, 1.3);
}
.scale-golden-xl {
  @include font-size(2.618rem, 1.2);
}
.scale-golden-2xl {
  @include font-size(4.236rem, 1.1);
}
```

## Advanced Patterns

### Fluid Typography

Combine with `clamp()` for fluid scaling:

```scss
@mixin fluid-font-size($min-size, $max-size, $min-vw: 320px, $max-vw: 1200px, $multiplier: 1.5) {
  $slope: ($max-size - $min-size) / ($max-vw - $min-vw);
  $y-axis-intersection: $min-size - ($slope * $min-vw);

  font-size: clamp($min-size, $y-axis-intersection + ($slope * 100vw), $max-size);

  line-height: $multiplier; // Unitless for proportional scaling
}

.fluid-heading {
  @include fluid-font-size(1.5rem, 3rem, 320px, 1200px, 1.2);
}

.fluid-body {
  @include fluid-font-size(1rem, 1.25rem, 320px, 1200px, 1.5);
}
```

### Optical Sizing

Adjust font features based on size:

```scss
@mixin optical-font-size($font-size, $multiplier: 1.5) {
  @include font-size($font-size, $multiplier);

  @if $font-size >= 3rem {
    font-variation-settings: "opsz" 72; // Large optical size
    letter-spacing: -0.02em;
  } @else if $font-size >= 1.5rem {
    font-variation-settings: "opsz" 36; // Medium optical size
    letter-spacing: -0.01em;
  } @else {
    font-variation-settings: "opsz" 12; // Small optical size
    letter-spacing: 0;
  }
}
```

### Dark Mode Adjustments

```scss
.text {
  @include font-size(1rem, 1.5);

  [data-theme="dark"] & {
    // Slightly larger line-height for dark backgrounds
    line-height: calc(1rem * 1.6);

    // Reduce font weight for better readability
    font-weight: 400;
  }
}
```

### Locale-Specific Typography

```scss
@mixin i18n-font-size($font-size, $multiplier: 1.5) {
  @include font-size($font-size, $multiplier);

  [lang="ja"] &,
  [lang="zh"] & {
    // CJK languages need more line-height
    line-height: $font-size * ($multiplier + 0.2);
  }

  [lang="ar"] & {
    // Arabic script benefits from more space
    line-height: $font-size * ($multiplier + 0.1);
  }
}
```

## Accessibility

### Minimum Font Size

Ensure text is readable:

```scss
// ✅ Good - Meets WCAG guidelines
.body-text {
  @include font-size(1rem, 1.5); // 16px minimum
}

.small-text {
  @include font-size(0.875rem, 1.5); // 14px acceptable for secondary text
}

// ❌ Avoid - Too small
.tiny-text {
  @include font-size(0.625rem, 1.5); // 10px - too small for body text
}
```

### Line Length

Combine with max-width for optimal readability:

```scss
.readable-text {
  @include font-size(1.125rem, 1.6);
  max-width: 65ch; // 45-75 characters per line recommended
}
```

### User Preferences

Respect user font size settings:

```scss
// Use rem units to respect user preferences
.text {
  @include font-size(1rem, 1.5); // Scales with user settings
}

// Avoid px for text
.text-bad {
  font-size: 16px; // Doesn't scale with user settings
  line-height: 24px;
}
```

### Focus Indicators

Ensure adequate spacing for focus outlines:

```scss
.link {
  @include font-size(1rem, 1.5);

  &:focus-visible {
    outline: 2px solid var(--focus-color);
    outline-offset: 2px;
    // Line height provides space for outline
  }
}
```

## Integration with Design Systems

### CSS Custom Properties

```scss
:root {
  // Font sizes
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  --font-size-4xl: 2.25rem;

  // Line height multipliers
  --line-height-tight: 1.2;
  --line-height-normal: 1.5;
  --line-height-loose: 1.75;
}

.text-sm {
  @include font-size(var(--font-size-sm), var(--line-height-normal));
}
```

### Utility Class Generator

```scss
$sizes: (
  "xs": 0.75rem,
  "sm": 0.875rem,
  "base": 1rem,
  "lg": 1.125rem,
  "xl": 1.25rem,
  "2xl": 1.5rem,
  "3xl": 1.875rem,
  "4xl": 2.25rem,
  "5xl": 3rem,
);

$line-heights: (
  "tight": 1.2,
  "normal": 1.5,
  "loose": 1.75,
);

@each $size-name, $size-value in $sizes {
  @each $lh-name, $lh-value in $line-heights {
    .text-#{$size-name}-#{$lh-name} {
      @include font-size($size-value, $lh-value);
    }
  }
}

// Generates classes like:
// .text-sm-tight, .text-sm-normal, .text-sm-loose
// .text-lg-tight, .text-lg-normal, .text-lg-loose
// etc.
```

## Performance Considerations

### Font Loading

Prevent layout shift with consistent line heights:

```scss
.text {
  @include font-size(1rem, 1.5);
  font-family: system-ui, sans-serif; // Fallback while loading

  &.font-loaded {
    font-family: "Custom Font", system-ui, sans-serif;
    // Line height remains stable
  }
}
```

### Variable Fonts

Optimize with font-variation-settings:

```scss
@mixin responsive-font($min, $max) {
  @include font-size(clamp($min, 2.5vw, $max), 1.5);

  @supports (font-variation-settings: normal) {
    font-variation-settings:
      "wght" 400,
      "opsz" auto;
  }
}
```

## Examples in Context

### Card Component

```scss
.card {
  padding: 1.5rem;

  .card-title {
    @include font-size(1.5rem, 1.3);
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  .card-subtitle {
    @include font-size(0.875rem, 1.4);
    color: var(--text-secondary);
    margin-bottom: 1rem;
  }

  .card-body {
    @include font-size(1rem, 1.5);
  }

  .card-meta {
    @include font-size(0.75rem, 1.4);
    color: var(--text-tertiary);
    margin-top: 1rem;
  }
}
```

### Article Layout

```scss
.article {
  .article-header {
    .title {
      @include font-size(3rem, 1.2);
      font-weight: 700;
      margin-bottom: 1rem;
    }

    .subtitle {
      @include font-size(1.5rem, 1.4);
      color: var(--text-secondary);
      margin-bottom: 0.5rem;
    }

    .meta {
      @include font-size(0.875rem, 1.5);
      color: var(--text-tertiary);
    }
  }

  .article-body {
    @include font-size(1.125rem, 1.6);
    max-width: 65ch;
    margin: 2rem auto;

    h2 {
      @include font-size(2rem, 1.3);
      margin: 2rem 0 1rem;
    }

    h3 {
      @include font-size(1.5rem, 1.4);
      margin: 1.5rem 0 0.75rem;
    }

    p {
      margin-bottom: 1rem;
    }

    blockquote {
      @include font-size(1.25rem, 1.6);
      font-style: italic;
      padding-left: 1.5rem;
      border-left: 4px solid var(--border-color);
      margin: 2rem 0;
    }

    code {
      @include font-size(0.9em, 1.5);
      font-family: "Fira Code", monospace;
    }
  }
}
```

## Summary

The `font-size` mixin provides:

✅ Automatic line-height calculation  
✅ Proportional vertical rhythm  
✅ Consistent typography system  
✅ Flexible multiplier approach  
✅ Readability optimization  
✅ Accessibility support  
✅ Responsive-ready foundation

Use it consistently across your application for professional, readable typography.
