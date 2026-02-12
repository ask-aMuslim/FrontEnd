# Page Container Implementation Examples

## Quick Start

This guide provides practical examples for implementing the page container system across your pages.

## Example 1: Basic Page Layout

```typescript
// my-page.component.ts
import { Component } from '@angular/core';
import { PageContainerComponent } from '../shared/reusable-components/page-container';

@Component({
  selector: 'app-my-page',
  standalone: true,
  imports: [PageContainerComponent],
  template: `
    <app-page-container>
      <h1>Page Title</h1>
      <p>Your content here</p>
    </app-page-container>
  `
})
export class MyPageComponent {}
```

## Example 2: Page with Multiple Sections

```html
<!-- Page with full-width sections and narrower content -->
<div class="page-wrapper">
  <!-- Hero section (full width) -->
  <section class="hero-section" style="background: linear-gradient(...)">
    <app-page-container>
      <h1>Hero Title</h1>
      <p>Hero subtitle</p>
    </app-page-container>
  </section>

  <!-- Content section (narrower) -->
  <section class="content-section">
    <app-page-container size="md">
      <h2>Content Section</h2>
      <p>Main content goes here</p>
    </app-page-container>
  </section>

  <!-- Wide content section -->
  <section class="wide-section">
    <app-page-container size="xl">
      <h2>Wide Section</h2>
      <p>Wider layout for featured content</p>
    </app-page-container>
  </section>
</div>
```

## Example 3: Ask and Contact Layout

```html
<!-- Sidebar + Content Layout -->
<app-page-container size="xl">
  <div class="flex gap-8">
    <!-- Sidebar -->
    <aside class="w-64 shrink-0">
      <nav>
        <!-- Navigation items -->
      </nav>
    </aside>

    <!-- Main content -->
    <main class="flex-1 min-w-0">
      <!-- Page content -->
    </main>
  </div>
</app-page-container>
```

## Example 4: academy/Course Page

```html
<!-- Three-column layout centered -->
<app-page-container>
  <div class="grid grid-cols-3 gap-6">
    <div class="course-card">
      <!-- Course 1 -->
    </div>
    <div class="course-card">
      <!-- Course 2 -->
    </div>
    <div class="course-card">
      <!-- Course 3 -->
    </div>
  </div>
</app-page-container>
```

## Example 5: Events Page

```html
<app-page-container size="lg">
  <!-- Events header -->
  <div class="mb-12">
    <h1>Upcoming Events</h1>
    <p>Discover our latest events and sessions</p>
  </div>

  <!-- Events grid -->
  <div class="grid grid-cols-2 gap-8 lg:grid-cols-3">
    @for (event of events; track event.id) {
      <event-card [event]="event"></event-card>
    }
  </div>
</app-page-container>
```

## Example 6: Profile/Account Page

```html
<app-page-container size="md">
  <!-- Profile header -->
  <div class="profile-header">
    <img [src]="user.avatar" alt="Profile">
    <h1>{{ user.name }}</h1>
  </div>

  <!-- Profile sections -->
  <div class="profile-section">
    <h2>About</h2>
    <p>{{ user.bio }}</p>
  </div>

  <div class="profile-section">
    <h2>Settings</h2>
    <!-- Settings form -->
  </div>
</app-page-container>
```

## Example 7: Using CSS Utilities

```html
<!-- When you can't use the component -->
<section class="container container-lg">
  <h1>Standard Page</h1>
  <p>Content with responsive padding</p>
</section>

<!-- Full-width with page padding -->
<section class="px-page py-page">
  <h2>Another Section</h2>
</section>

<!-- Combined padding -->
<div class="p-page">
  <p>Page content with all padding applied</p>
</div>
```

## Example 8: Responsive Typography with Container

```html
<app-page-container size="md">
  <h1 style="font-size: clamp(2rem, 5vw, 3.5rem);">
    Responsive Title
  </h1>
  <p style="font-size: clamp(1rem, 2vw, 1.25rem); line-height: 1.6;">
    Responsive paragraph text that scales with viewport
  </p>
</app-page-container>
```

## Example 9: Nested Containers

```html
<!-- Outer container for hero -->
<section class="hero" style="background: var(--color-surface-primary)">
  <app-page-container size="xl">
    <h1>Main Title</h1>
    <p>Hero description</p>
  </app-page-container>
</section>

<!-- Middle container for featured content -->
<section class="featured">
  <app-page-container size="lg">
    <h2>Featured Section</h2>
    
    <!-- Inner narrower container for article text -->
    <app-page-container size="md">
      <article>
        <p>Article content is narrower for better readability</p>
      </article>
    </app-page-container>
  </app-page-container>
</section>
```

## Example 10: Full-width Background with Centered Content

```html
<!-- This pattern is useful for sections with background colors -->
<section style="background: var(--color-surface-secondary)">
  <app-page-container>
    <div class="py-page">
      <h2>Section with Background</h2>
      <p>Content is centered and has padding</p>
    </div>
  </app-page-container>
</section>

<!-- Alternative using CSS utilities -->
<section style="background: var(--color-surface-secondary)">
  <div class="container container-lg p-page">
    <h2>Section with Background</h2>
    <p>Content is centered and has padding</p>
  </div>
</section>
```

## Best Practices Summary

1. **Choose the right size for your content**
   - `sm`: Narrow forms, articles (480px)
   - `md`: Standard pages, content (768px)
   - `lg`: General pages, default choice (1024px)
   - `xl`: Wide layouts, featured content (1280px)
   - `full`: Hero sections, edge-to-edge content

2. **Use full-width backgrounds correctly**
   ```html
   <section style="background: color">
     <app-page-container>
       <div class="p-page">Content</div>
     </app-page-container>
   </section>
   ```

3. **Maintain consistency**
   - Use the same size for related pages
   - Avoid mixing too many size variations
   - Use the default `lg` when unsure

4. **Leverage responsive padding**
   - `clamp()` ensures padding scales smoothly
   - Padding automatically adjusts for large screens
   - No need for custom breakpoint media queries

5. **Nesting strategy**
   - Usually one main container per page
   - Nest only when you need different constraints
   - Use containers to control max-width, not for general layout

## Migration Checklist

When migrating existing pages:

- [ ] Replace inline max-width styles with size prop
- [ ] Replace margin: 0 auto with container
- [ ] Replace custom padding with page container
- [ ] Test responsive behavior on all breakpoints
- [ ] Check for any z-index or overflow issues
- [ ] Verify hover states work correctly
- [ ] Test with keyboard navigation
- [ ] Validate HTML structure

## Related Files

- Component: `page-container.component.ts`
- Component Styles: `page-container.component.scss`
- Global Utilities: `styles/containers.css`
- Main Documentation: `README.md`
