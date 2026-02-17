# Copilot Instructions — AskAMuslim

## Architecture Snapshot
- Angular 20 with standalone components only; routes in `src/app/app.routes.ts`, SSR route config in `src/app/app.routes.server.ts`.
- Feature-first structure: pages in `src/app/pages`, cross-feature UI in `src/app/shared`, domain/core logic in `src/app/core`.
- Auth UI screens live in `src/app/core/auth/*`; route guards are in `src/app/core/guards`.
- API transport is split: generated OpenAPI functions/models in `src/app/api`, facades in `src/app/api/facades`, domain wrappers in `src/app/core/services`.

## Mandatory Engineering Rules
- TypeScript strict mode is enforced: no `any`, no unsafe casts, no unused symbols.
- No inline styles, no business logic in templates, no direct HTTP in components.
- Keep state updates immutable/signal-safe; prefer services/facades for mutations.
- Use design tokens only (`src/styles/_tokens.scss`, `src/styles/tokens/*`) and container system (`src/styles/containers.css`).

## UI and Routing Conventions
- Use reusable layout primitives: `page-container` and `container-section` components under `src/app/shared/reusable-components`.
- Static assets must come from `public/` and use absolute paths (example: `/icons/icons-24/...`).
- New feature routes should remain lazy/feature-scoped where possible.

## API Integration Conventions
- Use `IdentityFacade` and other facades for auth/domain actions instead of calling generated fn files directly in components.
- Use canonical endpoint paths directly in services; do not reintroduce a global endpoint-map constants file.
- Normalize and surface user-facing API errors through shared error handling (`src/app/core/errors/error-normalizer.ts`).

## Required Validation Workflow (Every Integration Task)
1. Validate contract binding first:
	- Check generated endpoint paths in `src/app/api/fn/**`.
	- Confirm env base URL from `src/environments/*` and `provideApiConfiguration(...)` in `src/app/app.config.ts`.
2. Validate runtime behavior:
	- Run app (`npm start`) and verify browser console/network behavior for changed flows.
	- For API flows, verify request/response behavior in Postman using `postman_environment.json` before/after frontend changes.
3. Validate regression safety:
	- Run `npm run build` after code changes.
	- Run relevant tests (`npm test`) when touched area has tests.
4. Document gaps immediately:
	- Write frontend/backend integration issues under `issues/frontend` or `issues/backend`.
	- Naming format: `YYYY-MM-DD_HH-mm_<short-title>.md`.

## Notes for Auth and Events
- Auth flows must include clear, user-friendly error messages for register, login, logout, and reset-password states.
- Events detail pages should resolve by route id and preserve clicked-card fallback data when API detail temporarily fails.
