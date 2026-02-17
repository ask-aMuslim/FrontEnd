# Backend API Contract Gaps

- **Timestamp:** 2026-02-14 16:51:05
- **Frontend target:** `http://localhost:4200`
- **Backend target:** `https://askamusslimapi.runasp.net`
- **Status:** OPEN (blocks full API-driven events/auth completeness)

## 1) Events endpoints unavailable (404)
- **Expected by frontend services:**
  - `GET /Events`
  - `GET /Events/{id}`
  - (also probed variants `/api/Events`, `/api/Event`)
- **Observed:** All tested event endpoint variants returned `404`.
- **Impact:**
  - Home events section and events page/detail cannot be fully backend-driven.
  - Frontend must use local fallback data to preserve UX.
- **Backend action required:**
  - Expose and stabilize events read endpoints under the agreed contract.
  - Align Swagger/OpenAPI spec with deployed routes and payload shape.

## 2) Auth social/reset endpoint availability mismatch
- **Observed in earlier audit:** Social and reset flows had backend availability gaps (404/mismatch) during runtime integration checks.
- **Impact:** Frontend can wire flows, but full end-to-end success depends on backend route availability and provider config.
- **Backend action required:**
  - Ensure deployed endpoints match integration contract used by frontend auth services.
  - Return consistent error payloads for failed auth operations.

## 3) Contract/deployment drift risk
- **Observed:** Generated clients and frontend facade assumptions can diverge from deployed API behavior.
- **Impact:** Runtime regressions despite compile-time success.
- **Backend action required:**
  - Keep deployed API and OpenAPI document synchronized.
  - Version contract changes and communicate deprecations before route changes.

## Evidence summary
- Multiple runtime probes against events routes on `askamusslimapi.runasp.net` returned `404`.
- Frontend behavior confirms fallback rendering is active when events API is unavailable.
