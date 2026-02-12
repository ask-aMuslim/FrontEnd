# System Overview

## Tech Stack
- **Framework**: Angular 20
- **Styling**: Tailwind CSS 4, Flowbite
- **Animations**: GSAP
- **State/Async**: RxJS
- **Build Tool**: Angular CLI

## Directory Structure
- `src/app/core`: Core singleton services (e.g., `ApiService`) and guards.
- `src/app/shared`: Shared components (`PageContainerComponent`, etc.) and pipes.
- `src/app/pages`: Feature modules and page components.
- `src/styles`: Global styles and Tailwind configuration.
- `docs/`: Project documentation.

## Key Subsystems
### Page Container System
A comprehensive system for consistent page layouts and responsiveness.
- Documentation: [DOCUMENTATION_INDEX.md](../DOCUMENTATION_INDEX.md)
- Location: `src/app/shared/reusable-components/page-container`

### API Layer
Centralized `ApiService` for HTTP requests.
- Location: `src/app/core/services/api.service.ts`
- Usage: Inject `ApiService` to perform GET, POST, PUT, DELETE operations.

## Development
- **Start**: `npm start` (serves on localhost:4200)
- **Build**: `npm run build`
- **Test**: `npm test`
