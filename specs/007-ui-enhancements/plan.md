# Plan: UI Tweaks and Enhancements

## Overview
This plan outlines the specific implementation steps for Spec 007.

## Phase 1: Global & Layout Changes
- Update Footer CSS: increase top margin, remove rounded top corners.
- Update Footer HTML: add `/` to social labels.
- Update global CSS for section title capitalization.
- Update Header components: rename "Ask Questions" to "Ask Q&A".
- Update Sidebar components: rename "Ask Questions" to "Topics".

## Phase 2: Home Page Updates
- Update Home CSS: set hero height to 944px, use 72px for hero title font size, update text color.
- Update Home HTML: reveal the "One god, one message, many prophets" block.

## Phase 3: Academy Restrictions
- Update Academy Intro Component: bind `[disabled]="!canBegin"` on the Begin button.
- Add restriction message adjacent to the button using `--color-text-info` class with `bg-transparent` and `border-none`.

## Verification
- Serve app and visually confirm all criteria are met.
