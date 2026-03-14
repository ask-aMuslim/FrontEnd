# Feature Specification: Home UI and Auth-Aware Placement Enhancements

**Feature Branch**: `[005-enhance-home-ui]`  
**Created**: 2026-03-14  
**Status**: Draft  
**Input**: User description: "Implement coordinated header, home, footer, profile, and inquiry UI updates including auth-aware section placement and logged-in identity display."

## User Scenarios & Testing _(mandatory)_

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.

  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Navigate with Clear, Updated Home Experience (Priority: P1)

As a visitor, I want the top navigation and home page cards to present clear actions and polished visuals so I can immediately understand where to go and what to do next.

**Why this priority**: Navigation clarity and first-impression quality directly affect discoverability, trust, and engagement on the landing experience.

**Independent Test**: Open the home page while not signed in and verify updated call-to-action copy, adjusted logo scale, resources card destination, and updated card visuals.

**Acceptance Scenarios**:

1. **Given** a visitor is on the site header, **When** they view the primary call-to-action, **Then** the action text reads "Explore Islam".
2. **Given** a visitor views the home feature cards, **When** they select the articles/resources card, **Then** they are taken to the resources destination page.
3. **Given** a visitor views the feature cards, **When** the cards render, **Then** they use the required themed background and consistent 16px card corner radius.

---

### User Story 2 - See Relevant Support Prompt by Account State (Priority: P2)

As a visitor or registered user, I want the "How can we best serve you?" section to appear in the most relevant location for my status so the prompt feels contextual instead of repetitive.

**Why this priority**: Contextual placement improves relevance and reduces friction by showing conversion prompts where they are most useful for each user state.

**Independent Test**: Verify visibility and placement while signed out, then sign in and confirm the section moves from home to the about page.

**Acceptance Scenarios**:

1. **Given** a user is not authenticated, **When** they open the home page, **Then** the support prompt is visible at the end of home content.
2. **Given** a user is authenticated, **When** they open the home page, **Then** the support prompt is not shown on home.
3. **Given** a user is authenticated, **When** they open the about page, **Then** the support prompt is shown on the about page.

---

### User Story 3 - Personalize Identity and Account Actions (Priority: P3)

As a signed-in user, I want profile actions and inquiry greetings to use my account identity and intuitive placement so my account areas feel consistent and personal.

**Why this priority**: Proper identity display and action placement reduce confusion in account management and improve confidence in signed-in flows.

**Independent Test**: Sign in with a known user profile and verify logout location in profile context and greeting name in the inquiry page.

**Acceptance Scenarios**:

1. **Given** a signed-in user is in profile context, **When** they view profile status details, **Then** logout appears next to gender status with icon and label.
2. **Given** the user opens the inquiry page while signed in, **When** the greeting renders, **Then** it displays the signed-in user’s actual name.
3. **Given** header navigation is rendered, **When** account actions are displayed, **Then** logout is no longer shown in navbar or drawer navigation.

---

### Edge Cases

- A signed-in user lacks first name/last name values; greeting must fall back to available display identity without blank output.
- Auth state changes during navigation; support prompt placement updates correctly after authentication state settles.
- Resources destination is temporarily unavailable; card selection must fail gracefully without crashing the page shell.
- Footer icons or app assets are missing; footer still renders without layout breakage.
- Very small screens must preserve readability after logo resizing, QR downsizing, and footer separator insertion.

## Requirements _(mandatory)_

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: System MUST display the primary header call-to-action text as "Explore Islam".
- **FR-002**: System MUST render the navigation logo at a reduced visual size relative to the prior baseline while preserving legibility.
- **FR-003**: System MUST route the home "Articles & Resources" card to the resources destination page.
- **FR-004**: System MUST render home feature cards with the specified themed background artwork.
- **FR-005**: System MUST apply a reusable card corner-radius value of 16px for home feature cards.
- **FR-006**: System MUST remove logout access from header navbar and drawer navigation.
- **FR-007**: System MUST expose logout action in profile context adjacent to gender status using icon + text treatment.
- **FR-008**: System MUST show "How can we best serve you?" at the end of the home page only when the user is not authenticated.
- **FR-009**: System MUST show "How can we best serve you?" on the about page when the user is authenticated.
- **FR-010**: System MUST render inquiry greeting identity from current signed-in user data instead of static placeholder text.
- **FR-011**: System MUST use the mail icon asset for the footer email social link.
- **FR-012**: System MUST render app download actions without borders and with subtle scale-only hover interaction.
- **FR-013**: System MUST display a visible 1px separator between app download footer actions.
- **FR-014**: System MUST render footer QR code imagery at reduced size compared to the prior baseline.

### Key Entities _(include if feature involves data)_

- **User Identity Snapshot**: Auth-derived display identity fields used for contextual messaging and visibility decisions (for example display name and authentication state).
- **Navigation Action Placement**: Rules defining where account actions (especially logout) are visible based on screen context and page context.
- **Promotional Support Block**: Reusable section content that changes placement between home and about based on authentication state.
- **Home Feature Card**: Homepage card metadata controlling destination, visual style, and consistent radius.

## Constitution Alignment _(mandatory)_

- **CA-001 (Component model)**: UI updates are scoped to existing page/reusable component boundaries and preserve current component rendering strategies.
- **CA-002 (Data access boundary)**: Identity-driven UI behavior continues to consume established authentication/domain state providers rather than introducing page-level transport calls.
- **CA-003 (State model)**: Auth-aware visibility and placement decisions use existing reactive state signals/streams with immutable assignment patterns.
- **CA-004 (API contract path)**: No new backend contract is introduced; this feature consumes existing authenticated user identity and profile payloads.
- **CA-005 (Verification gates)**: Feature is accepted only if static checks are clean and production build completes successfully without blocking errors.

## Success Criteria _(mandatory)_

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: 100% of configured home feature cards render with the specified 16px corner radius and themed background in responsive breakpoints covered by acceptance QA.
- **SC-002**: In authenticated-state testing, the support prompt appears on about and is absent from home in 100% of verification runs; in guest-state testing, the inverse is true.
- **SC-003**: Inquiry greeting displays a non-placeholder signed-in identity value in 100% of authenticated test sessions.
- **SC-004**: Profile/logout discoverability improves such that logout can be reached in one profile-screen interaction without accessing navigation drawer/header menus.
- **SC-005**: Header/footer UI revisions ship without introducing compile/lint blocking errors and without regression failures in primary navigation flows.
