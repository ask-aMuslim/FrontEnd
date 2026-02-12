# API Client Migration Guide

## Overview
This project now uses auto-generated type-safe API clients from the OpenAPI/Swagger specification. This guide explains how to migrate from manual services to generated clients.

## Generated API Structure

All generated API clients are located in `src/app/core/api/generated/`:

- **api.ts** - Main API service with helper methods
- **api-configuration.ts** - Configuration provider
- **models/** - TypeScript interfaces for all DTOs
- **fn/** - Individual API function implementations
- **functions.ts** - Exported API functions

## Migration Steps

### 1. Import Generated Types

Replace manual model imports:
```typescript
// Old
import { CourseDto } from '@core/models/interfaces/course.model';

// New
import { CourseReadDTO } from '@core/api/generated/models/course-read-dto';
```

### 2. Use Generated API Functions

Replace manual service calls:
```typescript
// Old
constructor(private coursesService: CoursesService) {}
this.coursesService.getAll().subscribe(courses => { ... });

// New
import { Api } from '@core/api/generated/api';
import { apiCourseGetCoursesGetJson } from '@core/api/generated/functions';

constructor(private api: Api) {}
const courses = await this.api.invoke(apiCourseGetCoursesGetJson);
```

### 3. Update Service Wrappers (Optional)

For services with business logic, wrap generated functions:
```typescript
import { Injectable, inject } from '@angular/core';
import { Api } from '@core/api/generated/api';
import { apiCourseGetCoursesGetJson } from '@core/api/generated/functions';
import { CourseReadDTO } from '@core/api/generated/models';

@Injectable({ providedIn: 'root' })
export class CoursesService {
  private api = inject(Api);

  getAll(): Observable<CourseReadDTO[]> {
    return from(this.api.invoke(apiCourseGetCoursesGetJson));
  }
}
```

### 4. Handle Authentication

The generated API uses Angular's HttpClient. Add interceptors for authentication:
```typescript
// In app.config.ts or separate interceptor
import { HTTP_INTERCEPTORS } from '@angular/common/http';

export const authInterceptor = {
  provide: HTTP_INTERCEPTORS,
  useClass: AuthInterceptor,
  multi: true
};
```

## API Function Naming Convention

Generated functions follow this pattern:
- `api{Controller}{Action}{Params}GetJson` - GET requests with JSON response
- `api{Controller}{Action}{Params}PostJson` - POST requests with JSON body
- `api{Controller}{Action}{Params}PutJson` - PUT requests
- `api{Controller}{Action}{Params}Delete` - DELETE requests

Example:
- `apiCourseGetCoursesGetJson` - GET /api/Course/GetCourses
- `apiCourseGetCourseByIdIdGetJson` - GET /api/Course/GetCourseById/{id}
- `apiCourseCreateCoursePostJson` - POST /api/Course/CreateCourse

## Type Safety Benefits

1. **Compile-time type checking** - TypeScript ensures correct types
2. **Auto-completion** - IDE suggests available properties
3. **Refactoring safety** - Changes propagate automatically
4. **Documentation** - Types serve as inline documentation

## Regenerating API Clients

When the Swagger spec changes:
```bash
npm run generate:api
```

This will:
- Fetch latest Swagger JSON
- Regenerate all types and services
- Preserve your custom service wrappers (outside generated folder)

## Common Patterns

### Error Handling
```typescript
try {
  const result = await this.api.invoke(apiCourseGetCoursesGetJson);
} catch (error) {
  // Handle error
  console.error('Failed to fetch courses', error);
}
```

### Query Parameters
```typescript
import { apiEnrollmentGetEnrollmentGet } from '@core/api/generated/functions';

const enrollment = await this.api.invoke(apiEnrollmentGetEnrollmentGet, {
  studentId: '123',
  courseId: '456'
});
```

### Path Parameters
```typescript
import { apiCourseGetCourseByIdIdGetJson } from '@core/api/generated/functions';

const course = await this.api.invoke(apiCourseGetCourseByIdIdGetJson, {
  id: 'course-123'
});
```

## Migration Checklist

- [ ] Replace manual model imports with generated types
- [ ] Update service methods to use generated API functions
- [ ] Remove manual `api-endpoints.ts` usage
- [ ] Update components to use new service methods
- [ ] Add authentication interceptors if needed
- [ ] Test all API calls
- [ ] Update tests to use generated types

## Backward Compatibility

The old `ApiService` and `API_ENDPOINTS` are still available during migration. Gradually replace them:

1. Start with new features - use generated clients
2. Migrate high-traffic endpoints first
3. Update tests alongside code changes
4. Remove old code once fully migrated
