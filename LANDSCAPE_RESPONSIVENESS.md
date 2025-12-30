# Landscape Responsiveness Guidelines

## Overview
All components in the website should handle landscape orientation properly to ensure a good user experience across all devices and orientations.

## Best Practices

### 1. Use SCSS Mixins
Import and use the mixins from `src/styles/_mixins.scss`:

```scss
@import 'src/styles/mixins';

.my-component {
    // Regular styles
    padding: 2rem;
    
    // Landscape adjustments
    @include landscape {
        padding: 1rem;
        min-height: auto;
    }
}
```

### 2. Landscape Spacing Principles
- **Reduce vertical spacing**: Use smaller padding-top/bottom and margin-top/bottom
- **Maintain horizontal spacing**: Keep padding-left/right mostly unchanged
- **Reduce gaps**: Decrease gap values in flex/grid containers
- **Remove min-height constraints**: Use `min-height: auto` or `height: auto`

### 3. Height Management
In landscape mode:
- Avoid fixed heights
- Use `height: auto` or `height: fit-content`
- Remove `min-height: 100vh` constraints
- Enable scrolling with `overflow-y: auto` on container elements

### 4. Typography Adjustments
- Reduce font-sizes slightly (10-15%)
- Decrease line-height for better vertical space usage
- Keep headings readable but compact

### 5. Layout Patterns

#### Flexbox Containers
```scss
.flex-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    
    @include landscape {
        gap: 0.75rem;
        padding: 1rem;
    }
}
```

#### Grid Containers
```scss
.grid-container {
    display: grid;
    gap: 2rem;
    
    @include landscape {
        gap: 1rem;
        grid-template-rows: auto;
    }
}
```

#### Cards and Sections
```scss
.card {
    padding: 2rem;
    margin-bottom: 2rem;
    
    @include landscape {
        padding: 1rem 2rem;
        margin-bottom: 1rem;
    }
}
```

### 6. Form Elements
Forms need special attention in landscape:
```scss
.form-group {
    margin-bottom: 1.5rem;
    
    @include landscape {
        margin-bottom: 0.75rem;
    }
}

.form-input {
    padding: 0.75rem 1rem;
    
    @include landscape {
        padding: 0.5rem 1rem;
    }
}
```

### 7. Mobile Landscape Specifics
Use `landscape-mobile` mixin for mobile-specific landscape adjustments:
```scss
.mobile-component {
    @include landscape-mobile {
        // Mobile landscape specific styles
        // Max height: 600px
    }
}
```

### 8. Tablet Landscape Specifics
Use `landscape-tablet` mixin for tablet-specific landscape adjustments:
```scss
.tablet-component {
    @include landscape-tablet {
        // Tablet landscape specific styles
        // Max height: 800px
    }
}
```

## Component Checklist
When creating or updating components, ensure:

- [ ] Component has landscape media queries
- [ ] Vertical spacing is reduced in landscape
- [ ] Height constraints are removed or adjusted
- [ ] Scrolling works properly in landscape
- [ ] Content is not cropped or cut off
- [ ] All interactive elements are accessible
- [ ] Typography remains readable
- [ ] Layout adapts gracefully

## Testing
Test landscape orientation on:
1. Mobile devices (< 600px height)
2. Tablets (< 800px height)
3. Desktop browsers with reduced height
4. Real devices when possible

## Examples

### Auth Components
The authentication components demonstrate proper landscape handling:
- [login.component.scss](../app/core/auth/login/login.component.scss)
- [register.component.scss](../app/core/auth/register/register.component.scss)
- [reset-password.component.scss](../app/core/auth/reset-password/reset-password.component.scss)
- [auth-layout.component.scss](../app/core/layouts/auth-layout/auth-layout.component.scss)

Key features:
- Reduced vertical margins and padding
- Smaller gaps between elements
- Compact form groups
- Auto heights instead of fixed heights
- Scrollable containers

## Common Issues and Solutions

### Issue: Content Cropped
**Solution**: Add `overflow-y: auto` to container and use `height: auto`

### Issue: Too Much White Space
**Solution**: Reduce vertical spacing with landscape mixins

### Issue: Elements Overlapping
**Solution**: Ensure proper z-index and reduce element sizes

### Issue: Scrolling Not Working
**Solution**: Check parent containers have `overflow: visible` or `auto`

### Issue: Typography Too Large
**Solution**: Reduce font-size and line-height in landscape

## Future Considerations
- Continue refining landscape styles based on user feedback
- Consider device-specific optimizations
- Monitor new device form factors and orientations
- Update mixins as needed for new patterns
