# Course Component

This component displays a course page with two states: locked and unlocked.

## Features

### Locked State
- Shows when the user hasn't passed the previous course quiz
- Displays an informational message: "You must finish the quizzes of all the previous courses to unlock this course."
- Begin button is disabled
- All lessons except "Intro" are locked
- Shows 0/5 lessons completed

### Unlocked State
- Shows when the user has passed the previous course quiz
- Displays "Take the Quiz" and "Begin" buttons (both active)
- Lessons show completion status with checkmarks
- Shows 4/5 lessons completed
- Has a "Ready?" indicator before the Quiz section
- One lesson may have a red notification dot

## Usage

### Route
The component is accessible via: `/roadmap/course/:id`

### Query Parameters
- `unlocked=true` - Shows the unlocked state
- Default (no param) - Shows the locked state

### Examples

**Locked State:**
```
http://localhost:4200/roadmap/course/course-a2
```

**Unlocked State:**
```
http://localhost:4200/roadmap/course/course-a2?unlocked=true
```

## Component Structure

```
course/
├── course.component.ts       # Component logic
├── course.component.html     # Template
├── course.component.scss     # Styles
└── README.md                # Documentation
```

## Responsive Design

The component is fully responsive:
- **Mobile (< 768px)**: Stacked layout, sidebar below main content
- **Tablet (768px - 1024px)**: Larger fonts and spacing
- **Desktop (> 1024px)**: Side-by-side layout with sidebar on the right

## Design Tokens Used

The component uses the existing design tokens:
- `--colors-green-*` - Primary color
- `--colors-orange-*` - Secondary color
- `--colors-rare-grays-*` - Text and borders
- `--colors-system-sys-*` - System colors (info, error)
- `--spacing-*` - Spacing values
- `--font-*` - Typography

## Customization

To customize the course data, modify the `course` object in `course.component.ts`:

```typescript
course: CourseDetails = {
  id: 'course-a2',
  stageNumber: 1,
  title: 'Course A2: Prayer (Salah)',
  // ... other properties
}
```
