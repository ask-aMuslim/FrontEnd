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
