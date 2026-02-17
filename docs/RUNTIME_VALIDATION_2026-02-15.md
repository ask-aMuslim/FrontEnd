# Runtime Validation Report — 2026-02-15

## Scope
- Postman MCP runtime verification against `https://askamusslimapi.runasp.net`.
- Chrome DevTools MCP click-flow validation on local frontend (`http://localhost:6946`).
- Focused user journeys: Ask & Contact, Meet Scholar, Send Inquiry.

## Postman MCP Evidence
- `GET /api/specification.json` returned `200 OK`.
- `GET /api/Events` returned `200 OK` with valid paged result contract.
- `POST /api/MeetingRequests` returned `401 Unauthorized` without auth token (backend requires JWT).

## Chrome MCP Evidence
- Home → Ask & Contact loads with successful API calls (`GET /api/Events`, `GET /api/QAs`).
- Meet Scholar full form flow now issues real backend calls on confirmation:
  - `POST /api/MeetingRequests` observed in network (401 unauthenticated path).
- Send Inquiry submission now issues real backend calls:
  - `POST /api/InquiryRequests` observed in network (401 unauthenticated path).

## Defects Found and Fixed
1. Meet Scholar had a temporary bypass that skipped API submission and always navigated to success.
2. Send Inquiry navigated to success without backend submission.
3. Both flows lacked robust submission/error state handling for unauthorized requests.

## Implemented Remediation
- Enabled real API submissions in both flows via `MeetingRequestsService` and `InquiryRequestsService`.
- Added submit loading state and user-facing error messages.
- Added 401-aware handling and login redirect intent (`redirectUrl` query param).
- Removed temporary bypass logic and placeholder comments from Meet Scholar flow.

## Validation After Fix
- `npm run build` succeeds.
- Browser click flows now produce expected API requests in network traces.
- Unauthorized backend responses are surfaced to users instead of silent success navigation.

## Remaining Notes
- Backend currently enforces JWT on meeting/inquiry create endpoints; guest submissions are expected to fail with 401 unless product/API policy changes.
- Existing accessibility issues (`label`/`id` warnings) are still present in current UI and are separate from integration correctness.
