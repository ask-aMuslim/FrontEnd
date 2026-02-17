# API Integration with ng-openapi-gen

## Quick Start

### Generate API Clients
```bash
npm run generate:api
```

This command:
1. Fetches the Swagger specification from `https://askamusslimapi.runasp.net/api/specification.json`
2. Generates type-safe TypeScript interfaces and services
3. Outputs everything to `src/app/api/`

### Using Generated API Clients

#### Basic Usage
```typescript
import { Api } from 'src/app/api/api';
import { apiCourseGetCoursesGetJson } from 'src/app/api/fn/course/get-courses';
import { CourseReadDTO } from 'src/app/api/models/course-read-dto';

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
import { Api } from 'src/app/api/api';
import { apiCourseGetCoursesGetJson } from 'src/app/api/fn/course/get-courses';

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

All endpoints from the Swagger specification are available. Check `src/app/api/functions.ts` for the complete list.

### Common Endpoints

- **Courses**: `apiCourseGetCoursesGetJson`, `apiCourseGetCourseByIdIdGetJson`, `apiCourseCreateCoursePostJson`
- **Lessons**: `apiLessonGetAllLessonsGetJson`, `apiLessonGetLessonByIdIdGetJson`
- **Identity**: `apiIdentityLoginLoginPost`, `apiIdentityRegisterRegisterPost`
- **Progress**: `apiProgressGetAllProgressesGetJson`, `apiProgressCreateProgressPostJson`

## Type Safety

All generated types are in `src/app/api/models/`:
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
