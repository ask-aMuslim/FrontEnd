Target framework: Angular 20 standalone-first architecture. Never generate NgModules.

You are implementing SOCIAL LOGIN in an Angular 20 application.

The backend authentication system already exists and MUST NOT be modified.
Your responsibility is FRONTEND ONLY.

Implement a clean, production-ready Angular 20 solution.

---

## GOAL

Add:

1. Sign in with Google
2. Sign in with Facebook

Angular must obtain provider tokens and send them to backend endpoints.

Angular does NOT validate tokens.

---

## ANGULAR VERSION REQUIREMENTS (MANDATORY)

• Angular 20
• Standalone architecture ONLY
• Use ApplicationConfig providers
• No NgModules
• Functional providers preferred
• Modern HttpClient usage
• Strict typing enabled
• Compatible with Signals-based Angular apps

Do NOT generate legacy Angular patterns.

---

## LIBRARY

Use ONLY:

@abacritt/angularx-social-login

Install if missing.

---

## TOKEN RULES (CRITICAL)

Google:

* Extract idToken from SocialUser
* Send idToken to backend

Facebook:

* Extract authToken (accessToken)
* Send accessToken to backend

Never interchange tokens.

---

## BACKEND API CONTRACT

POST /api/Authentication/login/google
Body:
{
"idToken": string
}

POST /api/Authentication/login/facebook
Body:
{
"accessToken": string
}

Response:
{
token: string,
user: object
}

Store returned token as application session token.

---

## IMPLEMENTATION STRUCTURE

Create:

1. social-auth-api.service.ts

   * loginWithGoogle()
   * loginWithFacebook()
   * communicates with backend
   * handles errors properly

2. app.config.ts

   * configure SocialAuthServiceConfig
   * configure providers correctly

3. login.component.ts (standalone component)

4. login.component.html

   * buttons triggering login methods

---

## ANGULAR RESPONSIBILITIES

Angular SHOULD:
✔ Open OAuth popup
✔ Receive provider token
✔ Send token to API
✔ Store backend JWT

Angular MUST NOT:
✘ verify OAuth tokens
✘ treat provider token as session
✘ persist Google/Facebook tokens

---

## CODE QUALITY RULES

• Strong typing everywhere
• No "any"
• No deprecated APIs
• Clean separation of concerns
• Injectable services only
• Proper RxJS handling
• Error handling included
• Production-ready code

---

## OUTPUT

Return COMPLETE runnable code:

* app.config.ts
* social-auth-api.service.ts
* login.component.ts
* login.component.html

Do not explain theory.
Do not output alternatives.
Produce the cleanest professional Angular 20 implementation only.
