# Container Section Pattern

## Overview
The `ContainerSection` component provides a standardized way to create page sections with **full-width backgrounds** while keeping **content constrained** to a maximum width.

## Problem Solved
When applying a container to the main layout, backgrounds get constrained to the container width instead of stretching to the viewport edges. This component solves that by:
- Allowing the section background to extend to 100% viewport width
- Constraining the content within a centered container
- Providing consistent spacing and sizing across the application

## Usage

### Import the Component
```typescript
import { ContainerSection } from '@app/shared/reusable-components/container-section';

@Component({
  // ...
  imports: [ContainerSection, /* other imports */]
})
```

### Basic Example
```html
<app-container-section>
  <h2>Your Section Title</h2>
  <p>Your content here...</p>
</app-container-section>
```

### With Background Color
```html
<app-container-section [bgClass]="'bg-gray-50'">
  <h2>Section with Gray Background</h2>
  <p>Content stays within container bounds</p>
</app-container-section>
```

### Custom Container Size
```html
<!-- Small container (480px max) -->
<app-container-section [containerSize]="'sm'">
  <p>Narrow content</p>
</app-container-section>

<!-- Extra large container (1920px max) - DEFAULT -->
<app-container-section [containerSize]="'4xl'">
  <p>Wide content</p>
</app-container-section>
```

### With Custom Styling
```html
<app-container-section 
  [bgClass]="'bg-gradient-to-br from-green-50 to-blue-50'"
  [contentClass]="'text-center'"
  [containerSize]="'2xl'">
  <h2>Centered Content with Gradient Background</h2>
</app-container-section>
```

### Without Vertical Padding
```html
<app-container-section [applyPadding]="false">
  <div class="py-8">
    <!-- Manage your own padding -->
  </div>
</app-container-section>
```

## Component API

### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `containerSize` | `'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl' \| '3xl' \| '4xl' \| 'full'` | `'4xl'` | Max-width of content container |
| `bgClass` | `string` | `''` | CSS classes for section background |
| `contentClass` | `string` | `''` | CSS classes for content container |
| `applyPadding` | `boolean` | `true` | Apply vertical padding (py-page) |

### Container Sizes

| Size | Max Width |
|------|-----------|
| `sm` | 480px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |
| `2xl` | 1440px |
| `3xl` | 1728px |
| `4xl` | 1920px |
| `full` | 100% |

## Alternative: Manual HTML Pattern

If you prefer not to use the component, you can use the CSS classes directly:

```html
<section class="full-width-section py-page bg-gray-100">
  <div class="container container-4xl">
    <h2>Your content</h2>
    <p>Content stays within bounds</p>
  </div>
</section>
```

## Examples

### Hero Section
```html
<app-container-section 
  [bgClass]="'bg-gradient-to-r from-green-600 to-green-400'"
  [containerSize]="'2xl'">
  <div class="text-white text-center">
    <h1 class="text-5xl font-bold">Welcome</h1>
    <p class="text-xl mt-4">Your journey begins here</p>
  </div>
</app-container-section>
```

### Content Section
```html
<app-container-section [bgClass]="'bg-white'">
  <article class="prose lg:prose-xl">
    <h2>Article Title</h2>
    <p>Article content...</p>
  </article>
</app-container-section>
```

### Multiple Sections
```html
<!-- Light section -->
<app-container-section [bgClass]="'bg-gray-50'">
  <h2>Features</h2>
  <!-- content -->
</app-container-section>

<!-- Dark section -->
<app-container-section [bgClass]="'bg-gray-900 text-white'">
  <h2>Testimonials</h2>
  <!-- content -->
</app-container-section>

<!-- Colored section -->
<app-container-section [bgClass]="'bg-green-50'">
  <h2>Call to Action</h2>
  <!-- content -->
</app-container-section>
```

## CSS Classes Reference

The component uses these utility classes from `containers.css`:

- `.full-width-section` - Full-width section wrapper
- `.container` - Base container with horizontal padding
- `.container-{size}` - Max-width constraints
- `.py-page` - Responsive vertical padding

## Best Practices

1. **Use for page sections** - Each major section of your page should use this pattern
2. **Consistent sizing** - Use `4xl` for most sections unless you need narrower content
3. **Background styling** - Pass background classes via `bgClass` prop
4. **Content spacing** - Use `contentClass` for content-specific spacing
5. **Semantic HTML** - The component renders a `<section>` element for proper semantics
