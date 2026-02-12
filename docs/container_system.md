# Responsive Container System - Usage Guide

## Overview
The project uses a responsive container system that allows sections to stretch to the full width of the screen while keeping content optimally centered and readable.

## Key Principles

### 1. **Full-Width Sections**
Sections stretch edge-to-edge across the viewport

### 2. **Centered Content**
Inner content is constrained to optimal widths and centered

### 3. **Responsive Padding**
Fluid padding using `clamp()` scales smoothly across devices

### 4. **No Overflow**
Content never exceeds container bounds or causes horizontal scrolling

## Implementation Pattern

### Basic Structure
```html
<div class="section-outer">
  <div class="section-inner">
    <!-- Your content -->
  </div>
</div>
```

### SCSS Pattern
```scss
.section-outer {
  width: 100%; // Full width
  background: /* your background */;
}

.section-inner {
  max-width: 1440px; // Maximum content width
  margin: 0 auto; // Center horizontally
  padding: 40px clamp(1rem, 4vw, 2rem); // Responsive padding
  
  @media (min-width: 1441px) {
    max-width: 1600px; // Wider on XL screens
    padding: 40px clamp(2rem, 6vw, 4rem);
  }
}
```

## Quiz Component Implementation

### Wrapper Container
```scss
.quiz-wrapper {
  max-width: 1440px;
  margin: 0 auto;
  padding: 40px clamp(1rem, 4vw, 2rem) 48px;
  
  @media (min-width: 1441px) {
    max-width: 1600px;
    padding: 40px clamp(2rem, 6vw, 4rem) 48px;
  }
}
```

### Content Cards
```scss
.quiz-intro-card {
  max-width: 888px; // Optimal reading width
  margin: 0 auto; // Center within parent
  width: 100%; // Responsive
}
```

## Global Utilities (From `containers.css`)

### Container Classes
- `.container` - Basic centered container
- `.container-sm` - 480px max-width
- `.container-md` - 768px max-width
- `.container-lg` - 1024px max-width
- `.container-xl` - 1280px max-width
- `.container-2xl` - 1440px max-width

### Section Classes
- `.page-section` - Full-width section with centered content
- `.section-full-width` - Breakout to full viewport width
- `.section-block` - Inner content wrapper

### Padding Utilities
- `.px-page` - Responsive horizontal padding
- `.py-page` - Responsive vertical padding
- `.p-page` - Combined page padding

## Responsive Breakpoints

| Breakpoint | Padding | Max-Width |
|------------|---------|-----------|
| Mobile (<768px) | 1rem - 1.5rem | 100% |
| Tablet (768-1024px) | 1rem - 1.5rem | 100% |
| Desktop (1024-1440px) | 1rem - 2rem | 1440px |
| XL (>1441px) | 2rem - 4rem | 1600px |

## Best Practices

### ✅ DO
- Use `clamp()` for fluid, responsive padding
- Center content with `margin: 0 auto`
- Set `max-width` on inner content containers
- Use `width: 100%` for responsive sizing
- Add `overflow: hidden` to prevent horizontal scroll

### ❌ DON'T
- Use fixed pixel padding
- Hardcode widths for different screen sizes
- Allow content to touch screen edges on mobile
- Create containers wider than 1600px
- Nest multiple centered containers

## Examples

### Full-Width Hero Section
```scss
.hero-section {
  width: 100%;
  background: linear-gradient(...);
  padding: clamp(3rem, 8vw, 6rem) 0;
}

.hero-content {
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 clamp(1rem, 4vw, 2rem);
}
```

### Content Card
```scss
.content-card {
  max-width: 888px;
  margin: 0 auto;
  padding: 2rem;
  width: 100%;
}
```

### Two-Column Layout
```scss
.two-column-wrapper {
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 clamp(1rem, 4vw, 2rem);
  
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 32px;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}
```

## Testing Checklist

- [ ] Content is centered on all screen sizes
- [ ] No horizontal scrolling occurs
- [ ] Padding scales smoothly when resizing
- [ ] Text doesn't touch screen edges on mobile
- [ ] Max-width prevents over-stretching on large screens
- [ ] Backgrounds extend full-width while content stays contained

---

**When in doubt:** Use `max-width: 1440px`, `margin: 0 auto`, and `padding: clamp(1rem, 4vw, 2rem)`
