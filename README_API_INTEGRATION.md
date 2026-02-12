# API Integration with ng-openapi-gen

## Quick Start

### Generate API Clients
```bash
npm run generate:api
```

This command:
1. Fetches the Swagger specification from `https://ask-a-muslim.runasp.net/swagger/v1/swagger.json`
2. Generates type-safe TypeScript interfaces and services
3. Outputs everything to `src/app/core/api/generated/`

### Using Generated API Clients

#### Basic Usage
```typescript
import { Api } from '@core/api/generated/api';
import { apiCourseGetCoursesGetJson } from '@core/api/generated/functions';
import { CourseReadDTO } from '@core/api/generated/models';

export class MyComponent {
  private api = inject(Api);

  async loadCourses() {
    const courses: CourseReadDTO[] = await this.api.invoke(apiCourseGetCoursesGetJson);
    console.log(courses);
  }
}
```

#### With RxJS Observables
```typescript
import { from } from 'rxjs';
import { Api } from '@core/api/generated/api';
import { apiCourseGetCoursesGetJson } from '@core/api/generated/functions';

export class MyComponent {
  private api = inject(Api);

  courses$ = from(this.api.invoke(apiCourseGetCoursesGetJson));
}
```

## Configuration

The API base URL is configured in `src/app/app.config.ts`:
```typescript
provideApiConfiguration(environment.apiBaseUrl)
```

Update `src/environments/environment.ts` to change the API base URL.

## Available Endpoints

All endpoints from the Swagger specification are available. Check `src/app/core/api/generated/functions.ts` for the complete list.

### Common Endpoints

- **Courses**: `apiCourseGetCoursesGetJson`, `apiCourseGetCourseByIdIdGetJson`, `apiCourseCreateCoursePostJson`
- **Lessons**: `apiLessonGetAllLessonsGetJson`, `apiLessonGetLessonByIdIdGetJson`
- **Identity**: `apiIdentityLoginLoginPost`, `apiIdentityRegisterRegisterPost`
- **Progress**: `apiProgressGetAllProgressesGetJson`, `apiProgressCreateProgressPostJson`

## Type Safety

All generated types are in `src/app/core/api/generated/models/`:
- `CourseReadDTO` - Course data structure
- `LessonReadDTO` - Lesson data structure
- `LoginViewModel` - Login request
- `ProgressReadDTO` - Progress tracking
- And many more...

## Regeneration

When the backend API changes:
1. Update Swagger specification (or it auto-updates)
2. Run `npm run generate:api`
3. Review generated changes
4. Update your code to use new types/methods

## Migration from Manual Services

See `docs/API_CLIENT_MIGRATION.md` for detailed migration guide.

## Figma Integration

See `docs/FIGMA_MCP_SETUP.md` for Figma MCP server configuration and design token extraction.
