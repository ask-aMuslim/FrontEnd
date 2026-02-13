# Backend Developer TODO List

**Project:** AskAMuslim  
**Date:** February 13, 2026  

---

## What This Document Is

This is a simple list of things the backend team needs to fix so the frontend can work properly. The frontend team uses a tool that reads your Swagger/API documentation to automatically generate code. When things are missing or wrong in Swagger, the frontend breaks.

---

## 🔴 URGENT - Must Fix Now

### 1. Login Endpoint Returns Nothing

**Problem:** When a user logs in, your API returns `void` (nothing). The frontend needs to receive the JWT token.

**What to do:**
- Make the login endpoint return a JSON object with the token

**Example response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "abc123...",
  "tokenType": "Bearer",
  "expiresIn": 3600
}
```

**How to fix in C#:**
```csharp
// Add this above your login method
[ProducesResponseType(typeof(AuthResponse), 200)]
public async Task<ActionResult<AuthResponse>> Login(LoginViewModel model)
{
    // Your existing code...
    return Ok(new AuthResponse 
    {
        AccessToken = token,
        RefreshToken = refreshToken,
        TokenType = "Bearer",
        ExpiresIn = 3600
    });
}
```

---

### 2. Add Refresh Token Endpoint

**Problem:** When a user's token expires, they have to log in again. This is bad user experience.

**What to do:**
- Create a new endpoint: `POST /api/Identity/refresh-token`

**Example request:**
```json
{
  "refreshToken": "abc123..."
}
```

**Example response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "xyz789...",
  "tokenType": "Bearer",
  "expiresIn": 3600
}
```

---

## 🟠 IMPORTANT - Fix Soon

### 3. Missing Response Types in Swagger

**Problem:** Many endpoints don't show what data they return. This breaks our auto-generated code.

**What to do:**
- Add `[ProducesResponseType]` to all your endpoints

**Missing DTOs (need to be in Swagger):**

| DTO Name | Used By |
|----------|---------|
| `AuthResponse` | Login, Register |
| `StudentReadDTO` | Student endpoints |
| `InstructorReadDTO` | Instructor endpoints |
| `EnrollmentReadDTO` | Enrollment endpoints |
| `QuestionReadDTO` | Question endpoints |
| `OptionReadDTO` | Option endpoints |
| `CertificateReadDTO` | Certificate endpoints |
| `UserReadDTO` | User management |
| `QuizEvaluationResultDTO` | Quiz results |

**How to fix in C#:**
```csharp
// Add this above each method
[ProducesResponseType(typeof(YourDtoName), 200)]
```

---

### 4. Add These Endpoints to Swagger

**Problem:** These features exist in the backend but are not shown in Swagger. The frontend can't use them.

**Missing endpoints:**

| Feature | Suggested Path |
|---------|---------------|
| Events | `/api/Event/...` |
| MuslimTube (videos) | `/api/MuslimTube/...` |
| Notifications | `/api/Notification/...` |
| Tags | `/api/Tag/...` |
| Levels | `/api/Level/...` |
| Preachers | `/api/Preacher/...` |
| Q&A | `/api/QA/...` |

**How to fix:**
- Make sure all controllers have `[ApiController]` attribute
- Check that your Swagger generation includes all controllers

---

## 🟡 NICE TO HAVE - Fix When Possible

### 5. Add Pagination to List Endpoints

**Problem:** Getting all courses or all students returns everything at once. This is slow when there's a lot of data.

**What to do:**
- Add `pageNumber` and `pageSize` parameters
- Return a paged result

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

### 6. Consistent Error Format

**Problem:** Errors come back in different formats. Hard for frontend to handle.

**What to do:**
- Use the same error format for all errors

**Example error response:**
```json
{
  "type": "https://your-api.com/errors/validation",
  "title": "Validation Failed",
  "status": 400,
  "detail": "Email is required",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

---

## Quick Checklist for Backend Team

- [ ] Login returns token (URGENT)
- [ ] Refresh token endpoint exists (URGENT)
- [ ] All endpoints have `[ProducesResponseType]`
- [ ] All DTOs are visible in Swagger
- [ ] Events endpoints in Swagger
- [ ] MuslimTube endpoints in Swagger
- [ ] Notifications endpoints in Swagger
- [ ] Pagination on list endpoints
- [ ] Consistent error format

---

## How to Test Your Swagger

1. Run your API
2. Go to `/swagger` in your browser
3. Check that:
   - Login endpoint shows a response schema (not "void")
   - All endpoints show their response type
   - All your controllers are listed

---

## Need Help?

If you have questions about what the frontend needs, ask the frontend team. They can show you exactly what's missing and why it matters.

**Frontend Contact:** [Add contact info here]

---

*This document was created by the frontend team to help coordinate API work.*
