# Quiz Integration Plan

## Overview
Integrate quiz functionality into the academy lesson system with three main screens:
1. **Quiz Overview** - Shown in the lesson page when user clicks on a quiz lesson
2. **Quiz In Progress** - Active quiz taking interface with timer, questions, and navigation
3. **Quiz Results** - Review and completion screen

## Current State Analysis

### Existing Components
- **QuizComponent** (`src/app/pages/academy/quiz/quiz.component.ts`) - Fully functional quiz with:
  - States: intro, in-progress, review, completed
  - Timer functionality (currently text-based)
  - Question navigation and answer tracking
  - Hint system
  - Quiz attempts integration
  
- **LessonPlayerComponent** (`src/app/pages/academy/lesson-player/lesson-player.component.ts`) - Shows different lesson types:
  - Video, Audio, Article, Intro
  - Needs to add Quiz type handling

- **academyProgressService** - Tracks progress and unlocking:
  - Has `submitQuizResult()` method
  - Updates course progress and unlocks next content
  - Marks lessons complete

### Data Flow
- Quiz questions come from `academyMockDataService.getQuizQuestionsFormatted(courseId)`
- Progress updates via `academyProgressService.submitQuizResult()`
- Quiz lessons are already defined in seed data with type 'quiz'

## Implementation Steps

### 1. Update QuizComponent UI to Match Figma Designs

**Files to Modify:**
- `src/app/pages/academy/quiz/quiz.component.html`
- `src/app/pages/academy/quiz/quiz.component.scss`

**Changes:**

#### 1.1 Quiz Overview (Intro State)
- Update layout to match Figma Frame 3 (Quiz intro card with sidebar)
- Ensure course sidebar shows all lessons with completion status
- Keep existing "Previous Lesson" and "Start the Quiz" buttons

#### 1.2 Quiz In Progress
- **Timer**: Replace current timer display with circular SVG countdown matching Figma
  - Current: Text display `1:20`
  - New: Circular progress ring (golden arc) with centered time
  - SVG circle with stroke-dashoffset animation based on `timerProgress()`
  
- **Question Sidebar**: Update question list styling
  - Show green background + checkmark for correct answers
  - Show red background + X icon for wrong answers  
  - Show plain style for current question
  - Keep gray/disabled for pending questions

- **Question Display**: Match Figma styling
  - Question number and text at top
  - Multiple choice options with letter labels (A, B, C, D)
  - Selected option gets green border
  - Skip button on left, "Confirm, Next" (or "Confirm, View Result" on last question) on right

- **Hint Section**: Collapsible hint with lightbulb icon
  - Shows hint text when expanded
  - Evidence source link if available

#### 1.3 Quiz Results/Review
- Keep existing review state functionality
- Ensure results are submitted to progress service when quiz passes

### 2. Embed Quiz in Lesson Player

**Files to Modify:**
- `src/app/pages/academy/lesson-player/lesson-player.component.html`
- `src/app/pages/academy/lesson-player/lesson-player.component.ts`
- `src/app/pages/academy/lesson-player/lesson-player.component.scss`

**Changes:**

#### 2.1 Detect Quiz Lessons
- Add quiz type detection in `loadLessonData()`:
  ```typescript
  const isQuizLesson = this.currentLesson.type === 'quiz';
  ```

#### 2.2 Embed Quiz Component
- Import QuizComponent into LessonPlayerComponent
- Add conditional rendering in template:
  ```html
  <div *ngIf="currentLesson?.type === 'quiz'" class="quiz-embed">
    <app-quiz [courseId]="courseId" [lessonId]="lessonId"></app-quiz>
  </div>
  ```

#### 2.3 Pass Context to Quiz
- Make QuizComponent accept `@Input() courseId` and `@Input() lessonId`
- Quiz should load questions based on courseId
- Quiz should navigate back to lesson player on completion

### 3. Integrate Quiz Results with Progress System

**Files to Modify:**
- `src/app/pages/academy/quiz/quiz.component.ts`

**Changes:**

#### 3.1 Submit Results on Completion
- In `completeQuiz()` method, when `hasPassed()` is true:
  ```typescript
  this.academyProgressService.submitQuizResult({
    stageNumber: this.courseInfo().stage,
    courseId: this.courseId,
    score: this.correctAnswersCount(),
    passed: true
  }).subscribe({
    next: (result) => {
      // Show success message
      // Navigate to next course or academy
      if (result.nextStageUnlocked) {
        // Show notification about unlocked stage
      }
    }
  });
  ```

#### 3.2 Mark Quiz Lesson Complete
- After passing quiz, also mark the quiz lesson as complete:
  ```typescript
  this.academyProgressService.markLessonCompleted(
    this.lessonId, 
    this.courseId
  ).subscribe();
  ```

#### 3.3 Update Course Sidebar
- Sidebar should reflect quiz completion status
- Show checkmark on quiz lesson item when passed

### 4. Update Routing (Optional)

**Files to Consider:**
- `src/app/app.routes.ts` - Quiz route already exists: `/academy/course/:courseId/quiz`

**Decision:**
- Keep standalone quiz route for direct access
- Lesson player will embed quiz when lesson type is 'quiz'
- Both approaches work simultaneously

### 5. Polish and Validation

#### 5.1 Validation Requirements
- User must select an answer to enable "Confirm" button ✓ (already implemented)
- Last question shows "Confirm, View Result" instead of "Confirm, Next" ✓ (already implemented)
- Timer auto-skips question when time runs out ✓ (already implemented)
- Minimum passing score enforced (8/10) ✓ (already implemented)

#### 5.2 UI Polish
- Ensure breadcrumb shows: academy / Prayer (Salah) / Quiz
- Circular timer animation is smooth
- Question transitions are animated
- Hint expand/collapse is smooth
- Color scheme matches design system:
  - Green: `#156B40` (correct, primary)
  - Red: `#F44336` (wrong, critical)
  - Gold: `#CDA736` (timer, special)
  - Gray: `#E9ECEF` (borders, backgrounds)

#### 5.3 Responsive Design
- Quiz should work on mobile, tablet, desktop
- Sidebar should stack on mobile
- Timer circle should scale appropriately

## Technical Implementation Details

### Component Inputs/Outputs

**QuizComponent:**
```typescript
@Input() courseId: string = '';
@Input() lessonId: string = '';
@Output() quizCompleted = new EventEmitter<{ passed: boolean; score: number }>();
```

### Timer SVG Implementation
```html
<svg class="timer-svg" viewBox="0 0 200 200">
  <!-- Background circle -->
  <circle cx="100" cy="100" r="85" fill="none" 
    stroke="#E9ECEF" stroke-width="8" 
    transform="rotate(-135 100 100)" />
  
  <!-- Progress arc (golden) -->
  <circle cx="100" cy="100" r="85" fill="none" 
    stroke="#CDA736" stroke-width="8"
    stroke-dasharray="424"
    [attr.stroke-dashoffset]="424 - (424 * timerProgress()) / 100"
    stroke-linecap="round"
    transform="rotate(-135 100 100)" />
</svg>
```

### Question Status Styling
```scss
.question-item {
  &.correct {
    background: #E8F5E8;
    border-color: #4CAF50;
  }
  
  &.wrong {
    background: #FFEBEE;
    border-color: #F44336;
  }
  
  &.current {
    background: white;
    border-color: #343A40;
  }
  
  &.pending {
    background: #F8F9FA;
    color: #6C757D;
  }
}
```

## Files to Modify Summary

1. **src/app/pages/academy/quiz/quiz.component.html** - Update UI to match Figma
2. **src/app/pages/academy/quiz/quiz.component.scss** - Add Figma styling
3. **src/app/pages/academy/quiz/quiz.component.ts** - Add inputs, integrate with progress service
4. **src/app/pages/academy/lesson-player/lesson-player.component.html** - Embed quiz component
5. **src/app/pages/academy/lesson-player/lesson-player.component.ts** - Handle quiz lesson type
6. **src/app/pages/academy/lesson-player/lesson-player.component.scss** - Style quiz embed

## Testing Checklist

- [ ] Quiz overview shows correctly when clicking quiz lesson
- [ ] Timer counts down and displays as circular progress
- [ ] Question navigation works (can click questions in sidebar)
- [ ] Answer selection highlights correctly
- [ ] Skip button marks question as skipped
- [ ] Confirm button is disabled until answer selected
- [ ] Last question shows "Confirm, View Result"
- [ ] Hint expands/collapses correctly
- [ ] Quiz results show correct/wrong/skipped count
- [ ] Passing quiz (8+/10) unlocks next course
- [ ] Failing quiz allows retake
- [ ] Quiz completion marks lesson as complete
- [ ] Course sidebar updates with quiz completion status
- [ ] Breadcrumb navigation works correctly
- [ ] Responsive design works on all screen sizes

## Success Criteria

1. ✅ Quiz UI matches all three Figma design frames pixel-perfect
2. ✅ Quiz embedded in lesson player for quiz-type lessons
3. ✅ Circular timer displays and animates correctly
4. ✅ Quiz results integrate with academy progress system
5. ✅ Passing quiz unlocks next course/stage
6. ✅ All validation rules enforced (answer selection, passing score)
7. ✅ Smooth animations and transitions
8. ✅ Fully responsive across devices

## Future Enhancements (Out of Scope)

- Quiz analytics and detailed reporting
- Question randomization
- Multiple quiz attempts with score history
- Time-based leaderboards
- Question explanations after each answer
- Quiz bookmarking/pause functionality
