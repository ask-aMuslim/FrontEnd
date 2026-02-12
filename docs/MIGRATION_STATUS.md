# API Client Migration Status

## ✅ Completed Migrations

### Core Services Migrated to Generated API Clients

1. **CoursesService** ✅
   - Uses `apiCourseGetCoursesGet$Json`
   - Uses `apiCourseGetCourseByIdIdGet$Json`
   - Uses `apiCourseCreateCoursePost$Json`
   - Uses `apiCourseUpdateCourseIdPut`
   - Uses `apiCourseDeleteCourseIdDelete`
   - Types: `CourseReadDto`, `CourseReadByIdDto`

2. **LessonsService** ✅
   - Uses `apiLessonGetAllLessonsGet$Json`
   - Uses `apiLessonGetLessonByIdIdGet$Json`
   - Uses `apiLessonGetCourseLessonsCourseIdGet$Json`
   - Uses `apiLessonCreateLessonPost$Json`
   - Uses `apiLessonUpdateLessonIdPut`
   - Uses `apiLessonDeleteLessonIdDelete`
   - Types: `LessonReadDto`
   - Note: Still uses legacy API for progress/notes endpoints not in Swagger

3. **AuthService** ✅
   - Uses `apiIdentityLoginLoginPost`
   - Uses `apiIdentityRegisterRegisterPost`
   - Uses `apiIdentityLogoutLogoutPost`
   - Types: `LoginViewModel`
   - Note: Google/Facebook login still uses legacy API (not in Swagger)

4. **EnrollmentsService** ✅
   - Uses `apiEnrollmentGetEnrollmentGet`
   - Uses `apiEnrollmentGetEnrolledCoursesByStudentGet`
   - Uses `apiEnrollmentGetStudentsEnrolledInCourseGet`
   - Uses `apiEnrollmentEnrollPost`
   - Uses `apiEnrollmentUnEnrollDelete`
   - Types: `EnrollmentCreateDto`

5. **InstructorsService** ✅
   - Uses `apiInstructorGetAllInstructorsGet`
   - Uses `apiInstructorGetInstructorByIdIdGet`
   - Uses `apiInstructorGetInstructorByCourseIdIdInstructorGet`
   - Note: `me()` and `update()` not in Swagger spec

6. **StudentsService** ✅
   - Uses `apiStudentGet`
   - Uses `apiStudentIdGet`
   - Uses `apiStudentGetAllCoursesGet`
   - Note: `me()`, `dashboard()`, `update()` still use legacy API

## ⚠️ Services Using Hybrid Approach

Some services use both generated and legacy APIs because:
- Endpoints not present in Swagger specification
- Custom business logic requirements
- Backward compatibility during migration

## 📋 Remaining Services to Migrate

- QuestionsService
- QuizzesService
- OptionsService
- ProgressService (partially available)
- CertificatesService
- EventsService
- QAsService
- TagsService
- And others...

## 🔄 Migration Strategy

1. **Identify** endpoints available in Swagger
2. **Migrate** to generated API clients
3. **Keep** legacy API calls for missing endpoints
4. **Update** components gradually
5. **Remove** legacy code once fully migrated

## 📝 Type Mapping

| Old Type | New Generated Type |
|----------|-------------------|
| `CourseDto` | `CourseReadDto` |
| `LessonDto` | `LessonReadDto` |
| `CreateLessonRequest` | FormData with typed params |
| `LoginRequest` | `LoginViewModel` |

## 🎯 Next Steps

1. Complete migration of remaining services
2. Update components to use new types
3. Remove `API_ENDPOINTS` constant file
4. Add authentication interceptors
5. Update tests to use generated types
