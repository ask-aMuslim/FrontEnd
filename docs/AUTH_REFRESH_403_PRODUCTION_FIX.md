# Auth + Refresh 403 Production Fix Guide

This project now restores auth state before app startup and guards protected routes on refresh.

## 1) SPA fallback routing (direct URL refresh)

If you deploy as a SPA behind a web server, ensure all non-file/non-API routes return `index.html`.

### Node (Express) example

```ts
import express from "express";
import path from "path";

const app = express();
const distPath = path.join(process.cwd(), "dist/browser");

app.use("/api", apiRouter);
app.use(express.static(distPath));

app.get(/^(?!\/api\/).*/, (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});
```

### ASP.NET Core (.NET) example

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

var app = builder.Build();

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapWhen(
    ctx => !ctx.Request.Path.StartsWithSegments("/api")
           && !Path.HasExtension(ctx.Request.Path.Value),
    spa => spa.Run(async context =>
    {
        context.Response.ContentType = "text/html";
        await context.Response.SendFileAsync(Path.Combine(app.Environment.WebRootPath, "index.html"));
    })
);

app.Run();
```

## 2) CORS for bearer/cookie auth

When API and SPA are on different origins:

- Allow `Authorization` and `Content-Type` headers.
- If cookie auth is used, enable credentials on both backend and frontend.
- Do **not** use wildcard origin with credentials.

### ASP.NET Core CORS example

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("SpaCors", policy =>
    {
        policy.WithOrigins("https://your-spa-domain.com")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

app.UseCors("SpaCors");
```

## 3) Frontend credentials toggle

This frontend supports cookie mode via:

- `environment.authWithCredentials = true`

Keep it `false` for bearer-token-only mode.

## 4) Refresh-safe startup checklist

- Token restored before initial rendering (`provideAppInitializer`)
- Interceptor attaches bearer token on first request after refresh
- Auth guard redirects unauthenticated users before protected API calls
- 401/403 handled globally with meaningful logs and safe redirect

## 5) Verified root causes of server-only 403s

The most common reason localhost works while server fails is **auth transport mismatch**:

- Refresh endpoint path differences (`/refresh-token` vs legacy aliases)
- Refresh response shape differences (envelope `data.token` vs flat `accessToken`)
- Credentials mode mismatch (cookie refresh requires `withCredentials` + backend CORS credentials)
- Over-aggressive 403 handling that logs users out even for authorization-only forbidden responses

## 6) Durable frontend safeguards implemented

- Refresh tries canonical and legacy endpoints
- Refresh response normalization supports both envelope and flat contracts
- Hybrid refresh support:
  - token-body refresh when refresh token exists
  - cookie refresh fallback (`withCredentials`) when token-body is unavailable
- Request compatibility honors `REQUIRE_CREDENTIALS` context, not only global env toggle
- 403 handling avoids forced logout for permission-based forbidden responses

## 7) Backend/infrastructure hardening for "fixed forever"

For production parity across all environments, backend and infra must also satisfy:

1. **CORS parity** between localhost/staging/prod
   - Explicit origins only
   - `AllowCredentials()` when cookie refresh is used
   - `Authorization` + `Content-Type` headers allowed
2. **Cookie policy parity** (if refresh cookie is used)
   - `Secure`, `HttpOnly`, `SameSite=None` for cross-site scenarios
   - Domain/path correctly scoped for SPA + API hosts
3. **JWT/refresh lifecycle parity**
   - Same signing keys and token validation settings across nodes
   - NTP clock sync (clock skew causes intermittent 401/403)
4. **Reverse proxy correctness**
   - Forwarded headers preserved (proto/host)
   - No auth header stripping
5. **Session consistency** (if stateful refresh token store)
   - shared distributed store or sticky sessions

## 8) Production verification checklist

- Login success on server environment
- Protected API call succeeds with bearer token
- Forced token expiry triggers refresh and retries original request
- Permission-based 403 stays on page (no global logout)
- Hard refresh on protected route preserves authenticated state
