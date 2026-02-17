# API Integration Overview for Beginners

**Project:** AskAMuslim  
**Last Updated:** February 13, 2026  

---

## What is API Integration?

When you use an app like AskAMuslim, the app needs to talk to a server (backend) to get data like courses, user profiles, and lessons. This conversation happens through something called an **API** (Application Programming Interface).

Think of an API like a waiter in a restaurant:
- You (the frontend/app) tell the waiter what you want
- The waiter (API) takes your request to the kitchen (backend server)
- The kitchen prepares your order and gives it to the waiter
- The waiter brings it back to you

### Why Do We Need API Integration?

Without proper API integration, developers would have to:
- Manually write code for every single request to the server
- Remember the exact URL for each piece of data
- Handle errors differently for each request
- Update code manually whenever the server changes

This leads to bugs, inconsistencies, and lots of repetitive work.

---

## Our Solution: Automated API Integration

We use a tool called **ng-openapi-gen** that automatically generates all the API code for us. Here's how it works:

```
Swagger Specification (API Document)
         |
         v
   ng-openapi-gen (Tool)
         |
         v
   Generated TypeScript Code
         |
         v
   Facades (Easy-to-use Wrappers)
         |
         v
   Your Components (Pages)
```

### What is Swagger?

Swagger is like a menu that lists all the available API endpoints. It describes:
- What URLs are available (like `/api/courses`)
- What data you need to send (like course ID)
- What data you'll get back (like course details)

When the backend team adds a new feature, they update the Swagger document, and our tool automatically generates the code to use it.

---

## Key Concepts Explained

### 1. Generated Client Code

**What it is:** TypeScript files automatically created from the Swagger specification.

**Where it lives:** `src/app/api/`

**What it does:** Contains functions for every API endpoint. For example:
- `apiCourseGetCoursesGet()` - Gets all courses
- `apiIdentityLoginPost()` - Logs in a user
- `apiLessonCreateLessonPost()` - Creates a new lesson

**Why it matters:** You don't write this code manually. The tool writes it for you, ensuring it's always correct and type-safe.

### 2. Facades (Domain Services)

**What they are:** Easy-to-use wrappers around the generated code.

**Where they live:** `src/app/core/api/facades/`

**Why we need them:** The generated code is very technical. Facades make it simple:

```typescript
// Without facade (technical, hard to use)
this.courseService.apiCourseGetCoursesGet()

// With facade (simple, clean)
this.courseFacade.getCourses()
```

**Available Facades:**

| Facade | What it handles |
|--------|-----------------|
| IdentityFacade | Login, register, logout, password reset |
| CourseFacade | Browse and manage courses |
| EnrollmentFacade | Student enrollments in courses |
| InstructorFacade | Instructor profiles |
| LessonFacade | Lessons within courses |
| QuizFacade | Quizzes and questions |
| StudentFacade | Student profiles and dashboard |
| AnswerFacade | Student answers to quiz questions |

### 3. Authentication (Logging In)

**How it works:**
1. User enters email/password
2. IdentityFacade sends to server
3. Server returns a "token" (like a digital ID card)
4. Token is stored securely
5. Every future request includes this token automatically

**The token system:**
- Tokens expire after a certain time
- When expired, the system automatically gets a new one
- User stays logged in seamlessly

### 4. Error Handling

**The problem:** APIs can fail in many ways:
- Server is down (500 error)
- User not logged in (401 error)
- Bad request (400 error)
- Network issues

**Our solution:** A unified error system that:
- Catches all errors in one place
- Converts technical errors to user-friendly messages
- Shows appropriate UI (like "Please log in" or "Try again later")

---

## How to Use the API in Your Code

### Step 1: Import the Facade

```typescript
import { CourseFacade } from '@app/core/api/facades';

export class MyComponent {
  private readonly courseFacade = inject(CourseFacade);
}
```

### Step 2: Call Methods and Subscribe

```typescript
// Get all courses
this.courseFacade.getCourses().subscribe({
  next: (courses) => {
    console.log('Got courses:', courses);
  },
  error: (error) => {
    console.error('Failed to get courses:', error);
  }
});
```

### Step 3: Use Signals for Reactive UI

```typescript
// In your component
courses = this.courseFacade.courses;      // Signal<CourseReadDto[]>
loading = this.courseFacade.loading;       // Signal<boolean>
error = this.courseFacade.error;           // Signal<ApiError | null>

// In your template
@if (loading()) {
  <p>Loading courses...</p>
}

@for (course of courses(); track course.id) {
  <div>{{ course.title }}</div>
}
```

---

## Current Status

### What's Working (Complete)

| Feature | Status | Description |
|---------|--------|-------------|
| Swagger Integration | Complete | API spec is connected |
| Generated Client | Complete | All endpoints have TypeScript code |
| Facades | Complete | 8 easy-to-use services available |
| Authentication | Complete | Login/logout works automatically |
| Error Handling | Complete | Errors are caught and displayed nicely |
| CI/CD Validation | Complete | System checks for API changes automatically |

### What's Partially Done

| Feature | Status | Notes |
|---------|--------|-------|
| Certificates | Partial | Some endpoints not in Swagger yet |
| Progress Tracking | Partial | Some endpoints not in Swagger yet |
| Questions | Partial | Some endpoints not in Swagger yet |

### What's Still Using Old Code

Some features still use the old way of calling APIs because the backend hasn't added them to Swagger yet:

- Events (calendar events)
- MuslimTube (video content)
- Notifications
- Tags
- And a few others

These will be migrated once the backend team updates the Swagger specification.

---

## Common Tasks

### How do I add a new API endpoint?

1. **Check if it's in Swagger:** Look in `swagger.json` or ask backend team
2. **If yes:** Run `npm run generate:api` to generate the code
3. **Create/update a facade:** Add a method that calls the generated function
4. **Use in component:** Inject the facade and call your method

### How do I handle errors?

```typescript
this.courseFacade.getCourses().subscribe({
  next: (courses) => { /* success */ },
  error: (err) => {
    // err is already an ApiError with user-friendly message
    this.showError(err.message);
  }
});
```

### How do I skip authentication for a public endpoint?

```typescript
// In your facade, pass the skipAuth option
this.httpContext.setToken(SKIP_AUTH, true);
```

---

## File Structure

```
src/app/core/api/
  |
  +-- generated/           # Auto-generated code (DON'T EDIT!)
  |   +-- fn/              # Functions for each endpoint
  |   +-- models/          # Data types (DTOs)
  |   +-- api.ts           # Main API configuration
  |
  +-- facades/             # Easy-to-use wrappers (YOU EDIT THESE)
  |   +-- course.facade.ts
  |   +-- identity.facade.ts
  |   +-- ... (8 total)
  |
  +-- swagger.hash         # Checksum to detect API changes
```

---

## Tips for Beginners

1. **Never edit generated code** - It will be overwritten. Always use facades.

2. **Use TypeScript types** - The generated code includes types. Use them!

```typescript
// Good - uses the type
const course: CourseReadDto = await this.courseFacade.getCourseById(1);

// Bad - uses 'any'
const course: any = await this.courseFacade.getCourseById(1);
```

3. **Handle errors** - Always subscribe with error handling.

4. **Check the facade first** - Before writing API code, check if a facade already has the method you need.

5. **Ask for help** - If an endpoint isn't working, it might not be in Swagger yet. Ask the backend team.

---

## Glossary

| Term | Definition |
|------|------------|
| API | Application Programming Interface - how apps talk to servers |
| Swagger | A document that describes all available API endpoints |
| Facade | A simplified interface to complex code |
| DTO | Data Transfer Object - a typed data structure |
| Token | A digital "ID card" that proves you're logged in |
| Endpoint | A specific URL that provides a specific piece of data |
| HTTP | The protocol used to send requests over the internet |
| Subscribe | Listen for the result of an async operation |

---

*This document is for developers new to the project. For technical details, see [API_INTEGRATION_IMPLEMENTATION.md](./API_INTEGRATION_IMPLEMENTATION.md)*
