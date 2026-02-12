# Container System Implementation

## Summary

A professional, responsive page container system has been implemented for the Ask A Muslim application. This system provides consistent spacing, centered layouts, and dynamic sizing across all pages.

## What Was Created

### 1. **PageContainerComponent** (`page-container/`)
A reusable Angular standalone component that wraps page content with responsive sizing:

```html
<app-page-container size="lg">
  <h1>My Page</h1>
  <p>Content here</p>
</app-page-container>
```

**Files:**
- `page-container.component.ts` - Component logic
- `page-container.component.scss` - Component styles
- `page-container.component.spec.ts` - Unit tests
- `index.ts` - Export barrel
- `README.md` - Detailed documentation

### 2. **CSS Utilities** (`src/styles/containers.css`)
Global CSS utility classes for container styling without using the component:

```html
<div class="container container-lg">Content</div>
<div class="px-page">Content with page padding</div>
<div class="p-page">Content with full page padding</div>
```

### 3. **Documentation**
- **README.md** - Complete usage guide, API reference, and best practices
- **CONTAINER_EXAMPLES.md** - 10+ real-world implementation examples
- **This file** - Overview and quick reference

## Key Features

✅ **Dynamic Responsive Sizing**
- Automatically adjusts for mobile, tablet, desktop, and large screens
- Uses CSS `clamp()` for smooth scaling without media queries

✅ **5 Size Variants**
- `sm` (480px) - Forms, articles
- `md` (768px) - Standard content
- `lg` (1024px) - General pages (default)
- `xl` (1280px) - Wide layouts
- `full` - Full-width content

✅ **Full-width Mode**
- `[fullWidth]="true"` - Removes max-width constraint
- Useful for hero sections and edge-to-edge layouts

✅ **Responsive Padding**
- Mobile: 1rem
- Tablet: ~4vw (scales dynamically)
- Desktop: 2rem
- Large Desktop: clamp(2rem, 10vw, 4rem)

✅ **CSS Variables**
- All sizes defined as CSS variables in `:root`
- Easy global customization
- No hardcoded pixel values in components

✅ **Zero Dependencies**
- No additional packages required
- Pure Angular + SCSS
- Follows project's design system

✅ **Strict TypeScript**
- `ChangeDetectionStrategy.OnPush` for performance
- Readonly inputs for immutability
- Full type safety

✅ **Accessibility**
- Supports `prefers-reduced-motion`
- Semantic HTML
- ARIA labels where needed
- Full keyboard navigation support

## Quick Start

### Using the Component

```typescript
import { PageContainerComponent } from './shared/reusable-components/page-container';

@Component({
  standalone: true,
  imports: [PageContainerComponent],
  template: `
    <app-page-container>
      <h1>My Page</h1>
    </app-page-container>
  `
})
export class MyPageComponent {}
```

### Using CSS Classes

```html
<div class="container container-lg">
  <h1>My Page</h1>
</div>
```

### Using Padding Utilities

```html
<div class="p-page">
  <h1>Page with padding</h1>
</div>
```

## Container Sizes at Different Breakpoints

| Size | Mobile | Tablet | Desktop | Large |
|------|--------|--------|---------|-------|
| sm | 100% - 1rem | 100% - 4vw | 480px | 480px |
| md | 100% - 1rem | 100% - 4vw | 768px | 768px |
| lg | 100% - 1rem | 100% - 4vw | 1024px | 1100px |
| xl | 100% - 1rem | 100% - 4vw | 1280px | 1360px |
| full | 100% | 100% | 100% | 100% |

## Files Created/Modified

### Created
- `src/app/shared/reusable-components/page-container/page-container.component.ts`
- `src/app/shared/reusable-components/page-container/page-container.component.scss`
- `src/app/shared/reusable-components/page-container/page-container.component.spec.ts`
- `src/app/shared/reusable-components/page-container/index.ts`
- `src/app/shared/reusable-components/page-container/README.md`
- `src/styles/containers.css`
- `CONTAINER_EXAMPLES.md`

### Modified
- `src/styles/styles.css` - Added import for containers.css

## CSS Variables (in `:root`)

```css
--container-sm: 480px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1440px;
--container-px: clamp(1rem, 4vw, 2rem);        /* Mobile/Tablet padding */
--container-px-lg: clamp(2rem, 10vw, 4rem);    /* Large screen padding */
```

## Responsive Behavior

The container system uses CSS `clamp()` for smooth, responsive scaling:

```scss
padding: 0 clamp(1rem, 4vw, 2rem);
```

This means:
- Minimum: 1rem padding
- Preferred: 4% of viewport width
- Maximum: 2rem padding

Large screens (> 1441px) use larger padding:
```scss
padding: 0 clamp(2rem, 10vw, 4rem);
```

## Usage Pattern Best Practices

✅ **Do:**
```html
<app-page-container>
  <section>
    <h1>Title</h1>
  </section>
</app-page-container>
```

✅ **Do** use appropriate sizes:
```html
<app-page-container size="md">
  <article>Article text is more readable in narrow container</article>
</app-page-container>
```

✅ **Do** use full-width for backgrounds:
```html
<section style="background: color">
  <app-page-container>
    <h1>Section with background</h1>
  </app-page-container>
</section>
```

❌ **Don't** nest unnecessarily:
```html
<!-- This is too much nesting -->
<app-page-container>
  <div class="wrapper">
    <app-page-container>
      <p>Avoid double-wrapping</p>
    </app-page-container>
  </div>
</app-page-container>
```

❌ **Don't** use for unrelated layout:
```html
<!-- Container is not a flex/grid utility -->
<app-page-container class="flex justify-between">
  <p>Don't use for general layout needs</p>
</app-page-container>
```

## Migration Guide

To migrate existing pages:

1. **Identify the main layout wrapper**
2. **Choose appropriate container size**
3. **Replace with `<app-page-container>`**
4. **Remove manual max-width and margin styles**
5. **Adjust custom padding if needed**
6. **Test on all breakpoints**

Example migration:
```typescript
// Before
<div style="max-width: 1024px; margin: 0 auto; padding: 0 2rem;">
  <p>Content</p>
</div>

// After
<app-page-container size="lg">
  <p>Content</p>
</app-page-container>
```

## Testing

All components and utilities have unit tests:

```bash
npm test -- page-container.component.spec.ts
```

## Performance

✅ **Optimized:**
- Uses `ChangeDetectionStrategy.OnPush`
- Minimal DOM elements
- CSS-based responsive behavior (no JavaScript)
- No layout shifts or repaints
- Follows Angular best practices

## Browser Support

Works in all modern browsers that support:
- CSS Grid/Flexbox
- CSS Variables
- CSS `clamp()` function
- ES2020+ JavaScript

## Next Steps

1. **Import the component** in your pages:
   ```typescript
   import { PageContainerComponent } from '../shared/reusable-components/page-container';
   ```

2. **Wrap your page content:**
   ```html
   <app-page-container>
     <!-- Your page content -->
   </app-page-container>
   ```

3. **Choose appropriate size** based on content type

4. **Test responsive behavior** on different devices

5. **Refer to README.md** for advanced usage patterns

## Documentation Links

- **Full Documentation**: `src/app/shared/reusable-components/page-container/README.md`
- **Implementation Examples**: `CONTAINER_EXAMPLES.md`
- **Component Code**: `src/app/shared/reusable-components/page-container/page-container.component.ts`
- **Utilities**: `src/styles/containers.css`

## Questions?

See the comprehensive README for:
- Detailed API reference
- Real-world examples
- Best practices
- Customization guide
- Accessibility features
- Migration instructions
