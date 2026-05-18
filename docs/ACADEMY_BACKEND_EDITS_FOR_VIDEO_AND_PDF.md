# Academy Backend Edits Needed (Video + Article PDF)

This document lists backend/data requirements to guarantee correct Academy rendering and PDF export behavior.

## 1) Lesson video fields

For lessons of type `video`, backend should return at least one of:

- `externalVideoUrl` (preferred for YouTube links)
- `videoUrl` (MP4 URL or YouTube URL)

Accepted YouTube formats (frontend supports all):

- `https://www.youtube.com/watch?v=<id>`
- `https://youtu.be/<id>`
- `https://www.youtube.com/embed/<id>`
- raw 11-char YouTube ID

## 2) Article content contract

For article lessons, backend should provide either:

- `contentJson` as valid TipTap/ProseMirror JSON
- or `content` as safe HTML string

Image nodes/HTML image tags should provide valid `src` values.
Prefer absolute URLs or root-relative media URLs (for example: `/uploads/...`).

## 3) Media CORS for PDF export (required for reliable images)

To ensure article images render inside generated PDFs, media endpoints should allow cross-origin image fetches from the frontend origin(s):

- `Access-Control-Allow-Origin: <frontend-origin>` (or `*` for public assets)
- `Access-Control-Allow-Methods: GET, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`

Also ensure correct content headers:

- `Content-Type: image/*`
- cache headers for public assets (recommended)

## 4) Publication flags (visibility control)

Backend responses should consistently include `isPublished` flags for:

- Courses
- Lessons
- Q&A items / topic answers (and translations when applicable)

Unpublished items are intentionally filtered from frontend display.
