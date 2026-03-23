# Social Login Setup (Google + Facebook)

This project uses `@abacritt/angularx-social-login` and backend token exchange endpoints.

## Current implementation

- Frontend social providers are configured in `src/app/app.config.ts` via `SOCIAL_AUTH_CONFIG`.
- UI triggers are implemented in:
  - `src/app/pages/account/login/social-login.component.ts`
  - `src/app/pages/account/login/social-login-button.component.ts`
- Auth orchestration is in:
  - `src/app/core/services/social-auth.service.ts`
- Backend exchange calls are in:
  - `src/app/api/facades/social-auth.facade.ts`

## Required environment values

Set these values in `src/environments/environment.ts`:

- `googleClientId`
- `facebookAppId`

Example placeholders are already present:

- `googleClientId: 'YOUR_GOOGLE_CLIENT_ID'`
- `facebookAppId: 'YOUR_FACEBOOK_APP_ID'`

## Google Console setup

1. Open Google Cloud Console and select/create a project.
2. Configure **OAuth consent screen**.
3. Create **OAuth 2.0 Client ID** for Web application.
4. Add authorized JavaScript origins for your frontend URLs.
5. Copy the generated client ID into `environment.googleClientId`.

## Facebook Developer setup

1. Open Meta for Developers and create/select an app.
2. Add **Facebook Login** product.
3. Configure valid OAuth redirect URLs and allowed domains.
4. Copy the app ID into `environment.facebookAppId`.

## Backend contract expectations

The frontend expects these backend endpoints to accept provider tokens and return app auth payload:

- `POST /api/Authentication/google`
- `POST /api/Authentication/facebook`

Expected response shape consumed by frontend:

- `token` (string)
- `user` (object)

## Local verification checklist

1. Run the app.
2. Open login page and confirm both social buttons render icons.
3. Click Google login and verify successful redirect/auth token storage.
4. Click Facebook login and verify successful redirect/auth token storage.
5. Confirm API calls hit `/api/Authentication/google|facebook` once per login attempt.

## Notes

- Icons are served from:
  - `/public/icons/icons-social-apps/google.svg`
  - `/public/icons/icons-social-apps/facebook.svg`
- If a provider returns no token, the frontend raises a user-facing login error from `SocialAuthenticationService`.
