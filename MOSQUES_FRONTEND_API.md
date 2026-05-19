# Mosques API for Frontend

Base route: `/api/Mosques`

This document summarizes the new mosque module so frontend developers can integrate listing, details, search, geo lookup, and admin management screens.

## What Is New

- New mosque entity and APIs were added
- Public read endpoints are available for listing, details, search, and geo lookup
- Admin endpoints are available for create, update, delete, activate, deactivate, and verify
- Mosque records are auditable internally through the shared backend audit model
- Frontend responses expose `createdAt` and `updatedAt` on the DTO

## Mosque DTO

```json
{
  "id": "guid",
  "name": "string",
  "description": "string | null",
  "address": "string | null",
  "country": "string | null",
  "governorate": "string | null",
  "city": "string | null",
  "district": "string | null",
  "latitude": 24.7136,
  "longitude": 46.6753,
  "googleMapsUrl": "string | null",
  "phoneNumber": "string | null",
  "email": "string | null",
  "websiteUrl": "string | null",
  "imamName": "string | null",
  "hasWomenPrayerArea": true,
  "hasFridayKhutbah": true,
  "mainImageUrl": "string | null",
  "isActive": true,
  "isVerified": false,
  "createdAt": "2026-05-16T12:00:00Z",
  "updatedAt": "2026-05-16T12:00:00Z",
  "distanceInKm": 1.4
}
```

Notes:

- `distanceInKm` is only populated by geo endpoints
- `createdAt` and `updatedAt` are response fields for frontend display; the frontend does not send them in create or update requests

## Create / Update Request Body

Use this payload for `POST /api/Mosques` and `PUT /api/Mosques/{id}`.

```json
{
  "name": "King Fahad Mosque",
  "description": "Main neighborhood mosque",
  "address": "123 Example Street",
  "country": "Saudi Arabia",
  "governorate": "Riyadh",
  "city": "Riyadh",
  "district": "Al Olaya",
  "latitude": 24.7136,
  "longitude": 46.6753,
  "googleMapsUrl": "https://maps.google.com/...",
  "phoneNumber": "+966500000000",
  "email": "info@example.org",
  "websiteUrl": "https://example.org",
  "imamName": "Shaykh Ahmad",
  "hasWomenPrayerArea": true,
  "hasFridayKhutbah": true,
  "mainImageUrl": "https://cdn.example.org/mosques/1.jpg",
  "isActive": true
}
```

## Response Envelope

Read endpoints return the shared `Result<T>` wrapper.

Success example:

```json
{
  "succeeded": true,
  "errors": [],
  "data": {}
}
```

Failure example:

```json
{
  "succeeded": false,
  "errors": ["Mosque not found"],
  "data": null
}
```

Write endpoints behave as follows:

- `POST` returns `201 Created` with the created mosque GUID in the response body
- `PUT` and `DELETE` return `204 No Content` on success
- `PUT /activate`, `PUT /deactivate`, and `PUT /verify` return `204 No Content` on success

## Pagination Shape

Paginated endpoints return `Result<PaginatedList<MosqueDto>>`.

```json
{
  "succeeded": true,
  "errors": [],
  "data": {
    "items": [],
    "pageNumber": 1,
    "totalPages": 3,
    "totalCount": 28,
    "hasPreviousPage": false,
    "hasNextPage": true
  }
}
```

## Public Endpoints

### Get mosques

`GET /api/Mosques`

Authorization: none

Supported query params:

- `name`
- `city`
- `country`
- `governorate`
- `district`
- `isActive`
- `isVerified`
- `pageNumber`
- `pageSize`

Use this for the main mosque listing page.

### Get mosque by id

`GET /api/Mosques/{id}`

Authorization: none

Use this for the mosque details page.

### Search mosques

`GET /api/Mosques/search`

Authorization: none

Supported query params:

- `name`
- `city`
- `country`
- `governorate`
- `district`
- `isActive`
- `isVerified`
- `pageNumber`
- `pageSize`

Examples:

- `GET /api/Mosques/search?name=fahad`
- `GET /api/Mosques/search?city=riyadh`
- `GET /api/Mosques/search?country=saudi`

Use this when you want a dedicated search route in the frontend. Internally it returns the same shape as the main listing endpoint.

### Get nearby mosques

`GET /api/Mosques/nearby?lat=&lng=&radius=`

Authorization: none

Supported query params:

- `lat` required
- `lng` required
- `radius` required, in kilometers
- `isActive` optional, defaults to `true`
- `isVerified` optional
- `pageNumber`
- `pageSize`

This returns a paginated list ordered by nearest first.

### Get mosques in radius

`GET /api/Mosques/in-radius?lat=&lng=&radius=`

Authorization: none

Supported query params:

- `lat` required
- `lng` required
- `radius` required, in kilometers
- `isActive` optional, defaults to `true`
- `isVerified` optional

This returns a non-paginated list ordered by nearest first.

### Get nearest mosque

`GET /api/Mosques/nearest?lat=&lng=`

Authorization: none

Supported query params:

- `lat` required
- `lng` required
- `isActive` optional, defaults to `true`
- `isVerified` optional

This returns a single mosque DTO.

## Admin Endpoints

These endpoints are intended for admin or dashboard frontend flows.

### Create mosque

`POST /api/Mosques`

Authorization: `Policies.ManageAdmins`

Response: `201 Created`

```json
"3fa85f64-5717-4562-b3fc-2c963f66afa6"
```

### Update mosque

`PUT /api/Mosques/{id}`

Authorization: `Policies.ManageAdmins`

Response: `204 No Content`

### Delete mosque

`DELETE /api/Mosques/{id}`

Authorization: `Policies.ManageAdmins`

Response: `204 No Content`

### Activate mosque

`PUT /api/Mosques/{id}/activate`

Authorization: `Policies.ManageAdmins`

Response: `204 No Content`

### Deactivate mosque

`PUT /api/Mosques/{id}/deactivate`

Authorization: `Policies.ManageAdmins`

Response: `204 No Content`

### Verify mosque

`PUT /api/Mosques/{id}/verify`

Authorization: `Policies.ManageAdmins`

Response: `204 No Content`

## Frontend Implementation Notes

- Treat `/api/Mosques` and `/api/mosques` as equivalent in practice because ASP.NET routing is case-insensitive, but keep one convention in frontend code for consistency
- Use the paginated endpoints for list pages and infinite scroll or table UIs
- Use `distanceInKm` only when consuming geo endpoints; it may be `null` elsewhere
- Show `isVerified` and `isActive` badges in admin tables because they map directly to the admin actions
- Do not send `id`, `createdAt`, `updatedAt`, or `distanceInKm` in create or update payloads
- For geo search UI, assume `radius` is in kilometers
- On failed write operations, show the first entry from the returned `errors` array to the user
