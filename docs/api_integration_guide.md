# API Integration Guide

## Overview
The application now uses **auto-generated type-safe API clients** from the OpenAPI/Swagger specification. All API clients are generated using `ng-openapi-gen` and located in `src/app/core/api/generated/`.

## Architecture

### Generated API Clients
- **Location**: `src/app/core/api/generated/`
- **Types**: All DTOs in `models/` directory
- **Functions**: All API endpoints in `functions.ts`
- **Service**: Main `Api` service for invoking endpoints

### Domain Services
Domain-specific services (e.g., `CoursesService`, `AuthService`) wrap the generated API clients and provide:
- Business logic
- Observable wrappers
- Error handling
- Type conversions

## Usage

### Using Domain Services (Recommended)
```typescript
import { CoursesService } from '@core/services/courses.service';
import { CourseReadDto } from '@core/api/generated/models';

export class MyComponent {
  private coursesService = inject(CoursesService);

  courses$ = this.coursesService.getAll();
}
```

### Using Generated API Directly
```typescript
import { Api } from '@core/api/generated/api';
import { apiCourseGetCoursesGet$Json } from '@core/api/generated/functions';
import { CourseReadDto } from '@core/api/generated/models';

export class MyComponent {
  private api = inject(Api);

  async loadCourses() {
    const courses: CourseReadDto[] = await this.api.invoke(apiCourseGetCoursesGet$Json);
  }
}
```

### With RxJS Observables
```typescript
import { from } from 'rxjs';
import { Api } from '@core/api/generated/api';
import { apiCourseGetCoursesGet$Json } from '@core/api/generated/functions';

export class MyComponent {
  private api = inject(Api);

  courses$ = from(this.api.invoke(apiCourseGetCoursesGet$Json));
}
```

## Best Practices

1. **Use Domain Services**: Prefer domain services over direct API calls for better abstraction
2. **Type Safety**: Always use generated types from `@core/api/generated/models`
3. **Error Handling**: Handle errors in services or use RxJS operators
4. **Regeneration**: Run `npm run generate:api` when backend API changes

## Workflow for New Integrations

1. **Check Swagger**: Verify endpoint exists in Swagger spec
2. **Regenerate**: Run `npm run generate:api` if needed
3. **Use Generated Function**: Import from `@core/api/generated/functions`
4. **Add to Service**: Wrap in domain service if business logic needed
5. **Use in Component**: Call service method from component

## Migration from Legacy API

See `docs/API_CLIENT_MIGRATION.md` for detailed migration guide.

## Available Endpoints

All endpoints are available as generated functions. Check `src/app/core/api/generated/functions.ts` for the complete list.

Common patterns:
- `api{Controller}{Action}Get$Json` - GET requests
- `api{Controller}{Action}Post$Json` - POST requests  
- `api{Controller}{Action}Put` - PUT requests
- `api{Controller}{Action}Delete` - DELETE requests
