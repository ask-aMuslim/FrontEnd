# Copilot Instructions — AskAMuslim

## Project Overview
- Angular 20 app with standalone components; route config in src/app/app.routes.ts and SSR routes in src/app/app.routes.server.ts.
- Feature-first layout: pages live in src/app/pages, shared UI in src/app/shared, and singleton services in src/app/core.
- Academy feature lives in src/app/pages/academy; routes are under /academy/*.

## UI & Styling Conventions
- Prefer the Page Container System for layout consistency: src/app/shared/reusable-components/page-container and src/styles/containers.css.
- Use Container Section for full-width backgrounds with constrained content: src/app/shared/reusable-components/container-section.
- Use design tokens and CSS variables from src/styles/tokens and src/styles/_tokens.scss; avoid inline styles.
- Apply landscape mixins from src/styles/_mixins.scss for reduced vertical spacing in landscape.
- Static assets are served from public/ and referenced via absolute paths (e.g., /backgrounds/texture.svg).

## API & Data Layer
- Generated OpenAPI clients live in src/app/core/api/generated (ng-openapi-gen); regenerate via npm run generate:api.
- Prefer domain services in src/app/core/services that wrap generated API functions over direct API calls.
- Api base URL is configured in src/app/app.config.ts via provideApiConfiguration(environment.apiBaseUrl).

## Development Workflows
- Start dev server: npm start (localhost:4200).
- Build: npm run build.
- Tests: npm test.

## Patterns to Follow
- Keep business logic out of templates; keep components focused on view state.
- Use RxJS and Angular DI patterns in core services/facades.
- Keep routes lazy and feature-focused when adding new pages.
