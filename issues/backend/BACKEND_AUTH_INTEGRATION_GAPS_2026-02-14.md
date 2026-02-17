# Backend Auth Integration Gaps — 2026-02-14

## Scope
- UI runtime validation via Chrome DevTools MCP on localhost:4200
- API/runtime validation via Postman MCP context + direct backend probes
- Auth workflows covered: Register/Login, Google/Facebook Sign-In, Reset Password

## Verified Working
1. Email/password login endpoint works
- Endpoint: POST /api/Identity/Login/login
- Observed status: 200 (valid credentials), 401 (invalid credentials)
- Response shape currently used by frontend: { token: string }

2. Registration can succeed when multipart payload includes PhoneNumber
- Endpoint: POST /api/Identity/Register/register
- Observed status: 200 when payload includes FirstName, LastName, Email, Password, Role, PhoneNumber

## Backend Issues Requiring Fixes

### A) Social login endpoints return 404
Observed from UI after wiring social buttons:
- https://askamusslimapi.runasp.net/Authentication/login/google -> HTTP 404
- https://askamusslimapi.runasp.net/Authentication/login/facebook -> HTTP 404

Required backend work:
- Implement Google OAuth endpoint
- Implement Facebook OAuth endpoint
- Return a stable frontend-consumable success flow (redirect + token handoff, or JSON token contract)
- Add these endpoints to Swagger/OpenAPI

Suggested contract options:
- Option 1 (redirect flow):
  - GET /api/Identity/Login/google
  - GET /api/Identity/Login/facebook
  - Callback endpoint returns app redirect with token/session
- Option 2 (API flow):
  - POST /api/Identity/Login/google with provider token
  - POST /api/Identity/Login/facebook with provider token
  - Response: { token, refreshToken?, expiresIn, userId?, userEmail? }

### B) Reset password API workflow is missing entirely
Observed probes for these common routes all returned 404:
- /api/Identity/ForgotPassword
- /api/Identity/forgot-password
- /api/Identity/SendOtp
- /api/Identity/VerifyOtp
- /api/Identity/ResetPassword
- /Authentication/forgot-password
- /Authentication/reset-password

Required backend work:
- Implement full forgot/reset password flow:
  1) Request reset OTP/code by email
  2) Verify OTP/code
  3) Set new password
- Add endpoints and schemas to Swagger/OpenAPI
- Ensure email ahmedanwer1prof2@gmail.com is accepted in reset flow for validation/testing

Recommended endpoint contract:
- POST /api/Identity/ForgotPassword
  - body: { email }
  - response: 200 { message, expiresInSeconds }
- POST /api/Identity/VerifyOtp
  - body: { email, otp }
  - response: 200 { verificationToken }
- POST /api/Identity/ResetPassword
  - body: { email, verificationToken, newPassword }
  - response: 200 { message }

### C) Register contract mismatch between spec/runtime behavior
Observed:
- Runtime rejects registration without PhoneNumber
- Error: Phone Number field is required
- OpenAPI marks PhoneNumber optional in generated client contract (or behavior is inconsistent from frontend perspective)

Required backend work:
- Align runtime validation with OpenAPI schema OR update OpenAPI to mark PhoneNumber required
- Keep request content type explicitly documented (multipart/form-data vs application/json)
- Ensure validation errors are explicit and stable for frontend mapping

### D) Student profile endpoint ambiguity after login
Observed:
- /api/Student/{id} returned 404 for JWT sub in tested flow
- Frontend now falls back to /api/Student list for resilience

Required backend work:
- Confirm canonical “current user profile” endpoint (recommended: GET /api/Student/me)
- Ensure JWT subject maps to retrievable student entity
- Add endpoint and response schema to Swagger

## Expected Backend Deliverables
1. Implement and publish social auth endpoints
2. Implement and publish full reset-password endpoints
3. Resolve register payload/schema mismatch (PhoneNumber requirement)
4. Provide canonical current-user endpoint for student profile
5. Update Swagger/OpenAPI to reflect exact runtime behavior and auth requirements

## Validation After Backend Delivery
Re-run:
- UI auth flows on localhost:4200 via Chrome DevTools MCP
- Full contract checks against updated Swagger
- Error-state checks for 400/401/403/404/500 responses
- Console/network verification for zero auth-flow integration errors
