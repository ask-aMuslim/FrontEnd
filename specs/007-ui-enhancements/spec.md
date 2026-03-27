# Spec 007: UI Tweaks and Enhancements

## Overview
### Problem Statement
The user has requested a series of UI tweaks and enhancements across various pages of the application, including the footer, header, sidebar, home page, and academy section.

### Success Criteria
- [ ] Footer top margin is increased.
- [ ] Footer top curve/bar with rounded corners is removed.
- [ ] Backslashes are added to footer social links labels.
- [ ] Section titles are capitalized, except for the words "is" and "the".
- [ ] "Ask questions" is changed to "Ask Q&A" in the navbar and "Topics" in the sidebar.
- [ ] In the academy course intro page, if the user is not logged in or didn't finish previous courses, the 'begin' button is disabled. A restriction message is displayed to the left of the button with no background/border and text color `--color-text-info`.
- [ ] Hero stat-item text uses `--color-text-info`.
- [ ] Home page hero section height is 944px.
- [ ] Home page hero title font size is 72px.
- [ ] "One god, one message, many prophets" subheading is visible in the hero section.

### Scope
INCLUDED: Footer, header, sidebar, home page hero, and academy course intro updates.
OUT: Major functional rearchitecting.

## Tech Design
### Layer Impact
- **Component (UI)**: Minor CSS adjustments and label text changes.
- **Academy Component**: Logic added to disable the begin button and show restriction text based on user login/progress state.

### State Management
- Utilizing existing signals/auth state in the academy component for button restriction logic.

## Risk & Mitigation
- Minor risk of breaking component layouts; mitigated by validating CSS changes using DevTools or visual checks.
