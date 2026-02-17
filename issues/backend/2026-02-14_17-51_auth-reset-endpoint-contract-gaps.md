# Backend Contract Gaps — Auth Reset Workflow

## Context
Frontend is now wired for a production-grade reset password flow with endpoint fallbacks.

## Endpoint uncertainty detected
The backend contract for reset-password is still inconsistent across environments and docs. Frontend now attempts:

1. Forgot password (request OTP)
   - `POST /api/Identity/ForgotPassword`
   - `POST /api/Identity/forgot-password`
   - `POST /Authentication/forgot-password`

2. Verify OTP
   - `POST /api/Identity/VerifyOtp`
   - `POST /api/Identity/verify-otp`

3. Reset password
   - `POST /api/Identity/ResetPassword`
   - `POST /api/Identity/reset-password`
   - `POST /Authentication/reset-password`

## Required backend decisions
- Publish a single canonical endpoint path for each step.
- Publish canonical request payload contracts for each step (field names and required fields).
- Add these endpoints to Swagger/OpenAPI and regenerate frontend client bindings.

## Why this matters
Without a stable contract in Swagger, frontend must use fallback probing and cannot guarantee 100% deterministic behavior across deployments.
