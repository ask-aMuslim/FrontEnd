# Forms API for Website Frontend

Base route: `/api/Forms`

This document covers the forms endpoints the public website should use to render published forms and submit answers.

## Data Shapes

### FormFieldType

Accepted values:

- `Text`
- `TextArea`
- `Email`
- `Number`
- `Date`
- `Checkbox`
- `Radio`
- `Select`

### Form DTO

```json
{
  "id": "guid",
  "title": "string",
  "description": "string | null",
  "isPublished": true,
  "fields": [
    {
      "id": "guid",
      "label": "string",
      "type": "Text",
      "isRequired": true,
      "order": 0,
      "options": []
    }
  ]
}
```

### Form Submission DTO

```json
{
  "id": "guid",
  "formId": "guid",
  "userId": "string | null",
  "answersJson": "string",
  "created": "2026-04-18T10:30:00Z"
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
  "errors": ["Form not found"],
  "data": null
}
```

Submit endpoint returns `201 Created` with the created submission GUID in the body.

## Endpoints

### Get all forms

`GET /api/Forms`

No authorization required.

Typical use on the public site: load published forms for a listing page, a support page, or a form chooser.

### Get form by id

`GET /api/Forms/{id}`

No authorization required.

Use this to render a public form page.

Response: `200 OK`

```json
{
  "succeeded": true,
  "errors": [],
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "title": "Contact Us",
    "description": "General questions and support",
    "isPublished": true,
    "fields": [
      {
        "id": "a1111111-1111-1111-1111-111111111111",
        "label": "Your name",
        "type": "Text",
        "isRequired": true,
        "order": 0,
        "options": []
      },
      {
        "id": "b2222222-2222-2222-2222-222222222222",
        "label": "Preferred contact method",
        "type": "Select",
        "isRequired": true,
        "order": 1,
        "options": [
          {
            "id": "c3333333-3333-3333-3333-333333333333",
            "label": "Email",
            "value": "email",
            "order": 0
          },
          {
            "id": "d4444444-4444-4444-4444-444444444444",
            "label": "Phone",
            "value": "phone",
            "order": 1
          }
        ]
      }
    ]
  }
}
```

If the form does not exist, the API returns `400 Bad Request` with:

```json
{
  "succeeded": false,
  "errors": ["Form not found"],
  "data": null
}
```

### Submit form answers

`POST /api/Forms/{formId}/submissions`

No authorization required.

Request body:

```json
{
  "formId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "answersJson": "{\"fullName\":\"Amina Khan\",\"preferredContactMethod\":\"email\"}"
}
```

Important rule: the `formId` in the route must match the `formId` in the body. If they do not match, the API returns `400 Bad Request`.

Response: `201 Created`

```json
"5d0e3b2c-8e1c-4f3b-9f5e-2b1e3d2e9d10"
```

The `Location` header points to `/Forms/{formId}/submissions/{submissionId}`.

## Website Frontend Usage Notes

- Use `Get all forms` for any public listing or form picker.
- Use `Get form by id` before rendering a dynamic form page.
- Use `Submit form answers` after the user completes the form.
- Build the submit payload as JSON in `answersJson`; the backend stores it as-is.
- If you need client-side validation, derive it from the returned field metadata and keep the submission payload aligned with the same keys.
- Anonymous submission is allowed by the backend, so `userId` may be `null` in stored submissions.
