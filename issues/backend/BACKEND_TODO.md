# Backend Developer TODO List

**Project:** AskAMuslim  
**Last Updated:** February 13, 2026  

---

## Current Status Summary

### What's Working Now

| Feature | Status | Notes |
|---------|--------|-------|
| Login | WORKING | Returns `{ "token": "..." }` - frontend adapted |
| JWT Authentication | WORKING | Bearer token in Authorization header |
| Core API Endpoints | WORKING | 73 endpoints available |

### Frontend Adaptations Made

The frontend has been updated to work with the actual API response format:
- Login returns `{ "token": "..." }` (not `accessToken`)
- No refresh token returned (frontend uses default 1-hour expiry)
- Test credentials stored in `environment.development.ts`

---

## Still Needed from Backend Team

### 1. Add Refresh Token Endpoint

**Why:** When a user's token expires (after ~1 hour), they have to log in again. This is bad user experience.

**What to do:**
- Create endpoint: `POST /api/Identity/refresh-token` or similar

**Example request:**
```json
{
  "refreshToken": "abc123..."
}
```

**Example response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "xyz789..."
}
```

---

### 2. Add Response Types to Swagger

**Why:** Many endpoints show `void` as response in Swagger. This breaks auto-generation of TypeScript types.

**Missing DTOs:**

| DTO Name | Used By | Priority |
|----------|---------|----------|
| `StudentReadDTO` | Student endpoints | HIGH |
| `InstructorReadDTO` | Instructor endpoints | HIGH |
| `EnrollmentReadDTO` | Enrollment endpoints | HIGH |
| `QuestionReadDTO` | Question endpoints | HIGH |
| `OptionReadDTO` | Option endpoints | MEDIUM |
| `CertificateReadDTO` | Certificate endpoints | MEDIUM |
| `UserReadDTO` | User management | MEDIUM |
| `QuizEvaluationResultDTO` | Quiz results | MEDIUM |

**How to fix:**
```csharp
[ProducesResponseType(typeof(YourDtoName), 200)]
```

---

### 3. Add Missing Endpoints to Swagger

**Why:** These features exist in backend but aren't in Swagger. Frontend can't use them.

| Feature | Status | Priority |
|---------|--------|----------|
| Events | Not in Swagger | HIGH |
| MuslimTube (videos) | Not in Swagger | HIGH |
| Notifications | Not in Swagger | MEDIUM |
| Tags | Not in Swagger | LOW |
| Levels | Not in Swagger | LOW |
| Preachers | Not in Swagger | MEDIUM |
| Q&A | Not in Swagger | MEDIUM |

---

### 4. Add Pagination to List Endpoints

**Why:** Getting all courses/students returns everything. Slow with large data.

**What to do:**
- Add `pageNumber` and `pageSize` query parameters
- Return paged result

**Example response:**
```json
{
  "items": [...],
  "pageNumber": 1,
  "pageSize": 10,
  "totalCount": 150,
  "totalPages": 15
}
```

---

## Quick Checklist

- [x] Login returns token (DONE - working)
- [ ] Refresh token endpoint exists
- [ ] All endpoints have `[ProducesResponseType]`
- [ ] All DTOs visible in Swagger
- [ ] Events endpoints in Swagger
- [ ] MuslimTube endpoints in Swagger
- [ ] Notifications endpoints in Swagger
- [ ] Pagination on list endpoints

---

## Next Steps for Frontend Team

1. **Test authenticated endpoints** - Verify courses, lessons, quizzes work with token
2. **Complete partial facades** - Progress, Certificate, Question, Option
3. **Migrate legacy services** - Events, MuslimTube, Notifications (once in Swagger)
4. **Add integration tests** - Test full authentication flow

---

## How to Test Your Swagger

1. Run your API
2. Go to `/swagger` in browser
3. Check:
   - Login endpoint shows response schema
   - All endpoints show their response type
   - All controllers are listed

---

*This document is updated as backend/frontend work progresses.*
