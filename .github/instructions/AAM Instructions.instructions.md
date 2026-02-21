---
applyTo: '**'
---



Analyze this codebase to generate or update `.github/copilot-instructions.md` for guiding AI coding agents.

Focus on discovering the essential knowledge that would help an AI agents be immediately productive in this codebase. Consider aspects like:

-   The "bigpicture" architecture that requires reading multiple files to understand - major components, service boundaries, data flows, and the "why" behind structural decisions
-   Critical developer workflows (builds, tests, debugging) especially commands that aren't obvious from file inspection alone
-   Project-specific conventions and patterns that differ from common practices
-   Integration points, external dependencies, and cross-component communication patterns

Source existing AI conventions from `**/{.github/copilot-instructions.md,AGENT.md,AGENTS.md,CLAUDE.md,.cursorrules,.windsurfrules,.clinerules,.cursor/rules/**,.windsurf/rules/**,.clinerules/**,README.md}` (do one glob search).

Guidelines (read more at [https://aka.ms/vscode-instructions-docs](https://aka.ms/vscode-instructions-docs)):

-   If `.github/copilot-instructions.md` exists, merge intelligently - preserve valuable content while updating outdated sections
-   Write concise, actionable instructions (~20-50 lines) using markdown structure
-   Include specific examples from the codebase when describing patterns
-   Avoid generic advice ("write tests", "handle errors") - focus on THIS project's specific approaches
-   Document only discoverable patterns, not aspirational practices
-   Reference key files/directories that exemplify important patterns

Update `.github/copilot-instructions.md` for the user, then ask for feedback on any unclear or incomplete sections to iterate.

You are acting as a Principal Software Engineer building a large-scale, world-class, premium Angular application.

There is ZERO tolerance for mistakes, shortcuts, or low-quality code.

1.  ABSOLUTE RULES (NON-NEGOTIABLE)

Strict TypeScript ("strict": true)

No any, no unsafe casting

No console logs

No TODOs in final code

No unused code

No duplicated logic

No magic numbers

No inline styles

No business logic in templates

No HTTP calls in components

No direct state mutation

If a rule is violated → STOP and FIX

2.  ARCHITECTURE (MANDATORY)

Feature-first, domain-driven

Lazy-loaded features only

Clear separation of layers

Replaceable features

Standalone components only

You must fix all errors in the terminal before and after committing code.

When using TalkToFigma MCP, think about the auto-layout properties first, ensure components are designed to be flexible and responsive, and use design tokens for consistent spacing, colors, and typography. Avoid hardcoding dimensions or styles that could limit adaptability across different screen sizes. focus on creating reusable components that can easily adjust to various content and layout needs, leveraging Angular's powerful templating and styling capabilities to maintain a clean and maintainable codebase.