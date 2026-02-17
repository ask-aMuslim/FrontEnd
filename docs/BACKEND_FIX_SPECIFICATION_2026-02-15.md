# Backend Fix Specification Document
## Generated: 2026-02-15
## Status: CRITICAL - Missing API Endpoints

---

## Executive Summary

During the production-grade validation cycle, **critical backend gaps** were discovered. The frontend application expects several API endpoints that **do not exist** on the backend. This document specifies the required backend changes to achieve full frontend-backend integration.

---

## Issue #1: Events API - COMPLETELY MISSING

### Severity: CRITICAL
### Impact: Events page non-functional

### Problem Description
The frontend has a fully implemented Events module with service, components, and UI, but the backend has **NO Events endpoints** whatsoever. The Swagger specification at `https://askamusslimapi.runasp.net/swagger/v1/swagger.json` contains zero paths starting with `/api/Event` or `/api/Events`.

### Expected Contract

The frontend expects the following Events endpoints:

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/api/Events` | GET | Get all events with pagination | N/A | `EventReadDTO[]` |
| `/api/Events/{id}` | GET | Get event by ID | N/A | `EventReadDTO` |
| `/api/Events` | POST | Create new event | `EventCreateDTO` | `EventReadDTO` |
| `/api/Events/{id}` | PUT | Update event | `EventUpdateDTO` | `200 OK` |
| `/api/Events/{id}` | DELETE | Delete event | N/A | `200 OK` |

### Actual Contract
**404 Not Found** - No endpoints exist.

### Required DTOs

```typescript
// EventReadDTO
interface EventReadDTO {
  id: string;
  title: string;
  description?: string;
  startDate: string; // ISO 8601 date-time
  endDate?: string; // ISO 8601 date-time
  location?: string;
  isOnline: boolean;
  onlineUrl?: string;
  imageUrl?: string;
  status: EventStatus; // Enum: Upcoming, Ongoing, Completed, Cancelled
  maxAttendees?: number;
  currentAttendees: number;
  createdAt: string;
  updatedAt?: string;
}

// EventCreateDTO
interface EventCreateDTO {
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  isOnline: boolean;
  onlineUrl?: string;
  maxAttendees?: number;
}

// EventUpdateDTO
interface EventUpdateDTO {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  isOnline?: boolean;
  onlineUrl?: string;
  status?: EventStatus;
  maxAttendees?: number;
}
```

### Impacted Frontend Modules
- `src/app/core/services/events.service.ts` - Events API service
- `src/app/pages/events/events.component.ts` - Events list page
- `src/app/pages/events/event-detail/event-detail.component.ts` - Event detail page
- `src/app/pages/events/event-card/event-card.component.ts` - Event card component
- `src/app/core/constants/api-endpoints.ts` - API endpoint constants

### Example Corrected Request/Response

**Request:**
```http
GET /api/Events HTTP/1.1
Host: askamusslimapi.runasp.net
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Expected Response:**
```json
[
  {
    "id": "evt_123456",
    "title": "Introduction to Quran Study",
    "description": "A comprehensive introduction to Quranic studies for beginners",
    "startDate": "2026-03-01T10:00:00Z",
    "endDate": "2026-03-01T12:00:00Z",
    "location": "Online via Zoom",
    "isOnline": true,
    "onlineUrl": "https://zoom.us/j/123456789",
    "imageUrl": "https://storage.example.com/events/quran-study.jpg",
    "status": "Upcoming",
    "maxAttendees": 100,
    "currentAttendees": 45,
    "createdAt": "2026-02-15T08:00:00Z"
  }
]
```

---

## Issue #2: Event Registrations API - MISSING

### Severity: CRITICAL
### Impact: Event registration functionality non-functional

### Problem Description
The frontend has event registration functionality, but the backend has no `/api/EventRegistrations` endpoints.

### Expected Contract

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/EventRegistrations` | POST | Register for event |
| `/api/EventRegistrations/{id}` | DELETE | Cancel registration |
| `/api/EventRegistrations/event/{eventId}` | GET | Get registrations by event |
| `/api/EventRegistrations/user/{userId}` | GET | Get user's registrations |
| `/api/EventRegistrations/{id}/status` | PUT | Update registration status |

### Actual Contract
**404 Not Found** - No endpoints exist.

---

## Issue #3: Muslim Tube API - MISSING

### Severity: MAJOR
### Impact: Video content section non-functional

### Problem Description
The frontend has a Muslim Tube section for video content, but the backend has no corresponding endpoints.

### Expected Contract

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/MuslimTube/channels` | GET | Get all channels |
| `/api/MuslimTube/videos` | GET | Get home videos |
| `/api/MuslimTube/videos/{id}` | GET | Get video by ID |
| `/api/MuslimTube/channels/{id}/videos` | GET | Get videos by channel |

### Actual Contract
**404 Not Found** - No endpoints exist.

---

## Issue #4: Preachers API - MISSING

### Severity: MAJOR
### Impact: Preacher profiles non-functional

### Problem Description
The frontend expects a Preachers API for scholar/preacher profiles.

### Expected Contract

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/Preachers` | GET | Get all preachers |
| `/api/Preachers/{id}` | GET | Get preacher by ID |
| `/api/Preachers/me` | GET | Get current preacher profile |

### Actual Contract
**404 Not Found** - No endpoints exist.

---

## Issue #5: Notifications API - MISSING

### Severity: MAJOR
### Impact: Notification system non-functional

### Problem Description
The frontend expects a Notifications API for user notifications.

### Expected Contract

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/Notifications/user/{userId}` | GET | Get user notifications |
| `/api/Notifications/{id}/read` | PUT | Mark as read |
| `/api/Notifications/fcm-token` | POST | Register FCM token |

### Actual Contract
**404 Not Found** - No endpoints exist.

---

## Issue #6: Q&A API - MISSING

### Severity: MAJOR
### Impact: Q&A section non-functional

### Problem Description
The frontend has Q&A functionality but the backend has no corresponding endpoints.

### Expected Contract

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/QA` | GET | Get Q&As with pagination |
| `/api/QA/{id}` | GET | Get Q&A by ID |
| `/api/QA` | POST | Create Q&A |
| `/api/QA/{id}` | PUT | Update Q&A |
| `/api/QA/{id}` | DELETE | Delete Q&A |

### Actual Contract
**404 Not Found** - No endpoints exist.

---

## Summary of Required Backend Work

### Priority 1 (Critical - Core Features)
1. **Events API** - Full CRUD implementation
2. **Event Registrations API** - Full implementation

### Priority 2 (Major - Important Features)
3. **Muslim Tube API** - Video content management
4. **Preachers API** - Scholar profiles
5. **Notifications API** - User notification system
6. **Q&A API** - Questions and answers

### Priority 3 (Minor - Enhancement Features)
7. Admin Notes API
8. Inquiry Requests API
9. Meeting Requests API
10. Student Notes API
11. Student Questions API
12. Tags API
13. Levels API

---

## Validation Evidence

### Network Requests (Chrome DevTools)
```
reqid=1801 GET https://askamusslimapi.runasp.net/api/Event [failed - 404]
reqid=1803 GET https://askamusslimapi.runasp.net/api/Event [failed - 404]
reqid=1805 GET https://askamusslimapi.runasp.net/api/Events [failed - 404]
reqid=1806 GET https://askamusslimapi.runasp.net/api/Events [failed - 404]
```

### Console Errors
```
[error] Failed to load resource: the server responded with a status of 404 ()
[error] Failed to load resource: the server responded with a status of 404 ()
[error] Failed to load resource: the server responded with a status of 404 ()
[error] Failed to load resource: the server responded with a status of 404 ()
```

---

## Next Steps

1. **Backend Team** must implement the missing APIs according to this specification
2. Update Swagger/OpenAPI specification to include all endpoints
3. Regenerate frontend API layer using `ng-openapi-gen` after backend updates
4. Re-run integration validation to confirm fixes

---

## Document Information
- **Generated by**: Kilo Code Integration Validation Agent
- **Date**: 2026-02-15
- **Validation Method**: Postman MCP + Chrome DevTools MCP + Swagger Analysis
- **Backend URL**: https://askamusslimapi.runasp.net
- **Swagger URL**: https://askamusslimapi.runasp.net/swagger/v1/swagger.json
