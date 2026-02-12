# Page Container System Documentation

## Overview

The Page Container System provides a responsive, centered layout solution for all pages in the Ask A Muslim application. It ensures consistent spacing, readability, and professional appearance across different screen sizes.

## Features

- **Dynamic Responsive Sizing**: Automatically adjusts padding and max-width based on viewport
- **Multiple Size Options**: SM, MD, LG, XL, and Full-width variants
- **Centered Content**: Content is centered with appropriate margins
- **CSS Variables**: Uses custom properties for easy customization
- **Accessibility**: Full support for reduced motion preferences
- **No Magic Numbers**: All values are maintainable and consistent

## Component Usage

### Basic Usage

```typescript
import { PageContainerComponent } from './shared/reusable-components/page-container';

@Component({
  standalone: true,
  imports: [PageContainerComponent],
  template: `
    <app-page-container>
      <h1>Page Title</h1>
      <p>Page content goes here</p>
    </app-page-container>
  `
})
export class MyPageComponent {}
```

### Size Variants

The container supports 5 size variants:

```html
<!-- Small (480px max-width) -->
<app-page-container size="sm">
  <p>Small container content</p>
</app-page-container>

<!-- Medium (768px max-width) -->
<app-page-container size="md">
  <p>Medium container content</p>
</app-page-container>

<!-- Large (1024px max-width) - Default -->
<app-page-container size="lg">
  <p>Large container content</p>
</app-page-container>

<!-- Extra Large (1280px max-width) -->
<app-page-container size="xl">
  <p>XL container content</p>
</app-page-container>

<!-- Full Width (no max-width) -->
<app-page-container size="full">
  <p>Full width content</p>
</app-page-container>
```

### Full Width Mode

For pages that should stretch edge-to-edge:

```html
<app-page-container [fullWidth]="true">
  <p>Content stretches across entire screen</p>
</app-page-container>
```

## CSS Utility Classes

For cases where you can't use the component, use the CSS utility classes directly:

### Container Classes

```html
<!-- Centered container with max-width -->
<div class="container container-lg">
  <p>Content here</p>
</div>

<!-- Available sizes: container-sm, container-md, container-lg, container-xl, container-2xl -->

<!-- Full width container -->
<div class="container container-full">
  <p>Stretches full width with padding</p>
</div>
```

### Padding Utilities

```html
<!-- Horizontal page padding -->
<div class="px-page">
  <p>Responsive horizontal padding</p>
</div>

<!-- Vertical page padding -->
<div class="py-page">
  <p>Responsive vertical padding</p>
</div>

<!-- Combined page padding -->
<div class="p-page">
  <p>Both horizontal and vertical padding</p>
</div>
```

### Section Container

```html
<!-- Centered section with specific max-width -->
<div class="section-container section-container--lg">
  <p>Section content</p>
</div>
```

## Responsive Behavior

### Mobile (< 480px)
- Horizontal padding: 1rem (clamp: 1rem - 2rem)
- All containers maintain 1rem padding on sides

### Tablet (480px - 1024px)
- Horizontal padding: ~4vw (dynamic, between 1rem - 2rem)
- All containers scale proportionally

### Desktop (1024px - 1440px)
- Horizontal padding: 2rem (clamp: 1rem - 2rem)
- Max-widths at their defined values

### Large Desktop (> 1440px)
- Horizontal padding: clamp(2rem, 10vw, 4rem) - larger padding
- Max-widths increase slightly for better readability

## CSS Variables

Available in `:root`:

```css
--container-sm: 480px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1440px;
--container-px: clamp(1rem, 4vw, 2rem);
--container-px-lg: clamp(2rem, 10vw, 4rem);
```

## Real-world Examples

### Simple Page Layout

```html
<app-page-container>
  <div class="content-wrapper">
    <h1>My Page</h1>
    <p>Lorem ipsum dolor sit amet...</p>
  </div>
</app-page-container>
```

### Full-width Hero with Container

```html
<section class="hero">
  <app-page-container>
    <h1>Hero Title</h1>
    <p>Hero description</p>
  </app-page-container>
</section>

<section class="content-section">
  <app-page-container size="md">
    <p>Narrower content section</p>
  </app-page-container>
</section>
```

### Mixed Sizing

```html
<app-page-container size="xl">
  <header>
    <h1>Page Title</h1>
  </header>

  <app-page-container size="md">
    <article>
      <p>Article content is narrower for better readability</p>
    </article>
  </app-page-container>
</app-page-container>
```

## Breakpoints Reference

| Name | Size | Usage |
|------|------|-------|
| xs | 480px | Extra small devices |
| sm | 640px | Small devices |
| md | 768px | Tablets |
| lg | 1024px | Desktops |
| xl | 1280px | Large desktops |
| 2xl | 1440px | Extra large desktops |

## Migration Guide

### From Inline Styles

**Before:**
```html
<div style="max-width: 1024px; margin: 0 auto; padding: 0 2rem;">
  <p>Content</p>
</div>
```

**After:**
```html
<app-page-container size="lg">
  <p>Content</p>
</app-page-container>
```

### From Tailwind Classes

**Before:**
```html
<div class="max-w-4xl mx-auto px-8">
  <p>Content</p>
</div>
```

**After:**
```html
<app-page-container size="lg">
  <p>Content</p>
</app-page-container>
```

## Best Practices

1. **Use the component when possible** - It provides better type safety and consistency
2. **Choose appropriate sizes** - Don't always use `size="lg"`; consider the content type
3. **Avoid nesting unnecessarily** - One container per page section is usually enough
4. **Use full-width for backgrounds** - Apply backgrounds to outer containers, not the inner container
5. **Maintain spacing consistency** - Use the provided padding utilities instead of custom values

## Customization

To customize container max-widths globally, modify the CSS variables in `src/styles/containers.css`:

```css
:root {
  --container-lg: 1100px; /* Change from 1024px to 1100px */
}
```

## Accessibility

The container system fully supports:

- **Reduced Motion**: Animations and transitions respect `prefers-reduced-motion`
- **Responsive Text**: Uses `clamp()` for fluid typography when combined with responsive sizes
- **Focus Management**: No z-index stacking issues or hidden overflow
- **Semantic HTML**: Works with all HTML elements

## Files

- **Component**: `src/app/shared/reusable-components/page-container/page-container.component.ts`
- **Styles**: `src/app/shared/reusable-components/page-container/page-container.component.scss`
- **Utilities**: `src/styles/containers.css`
- **Tests**: `src/app/shared/reusable-components/page-container/page-container.component.spec.ts`

## Support

For issues or questions about the container system, check:
1. The component's TypeScript file for available inputs
2. The SCSS file for CSS customization
3. This documentation for usage patterns
