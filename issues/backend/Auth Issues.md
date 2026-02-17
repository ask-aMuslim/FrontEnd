# Backend Auth Integration Gaps — 2026-02-14


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


### C) Student profile endpoint ambiguity after login
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
3. Provide canonical current-user endpoint for student profile
4. Update Swagger/OpenAPI to reflect exact runtime behavior and auth requirements


