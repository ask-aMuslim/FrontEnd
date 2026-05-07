# Sending files with Form Submissions

Endpoint: `POST /api/Forms/{formId}/submissions`

Summary: send the form answers and any attached files as multipart/form-data. The endpoint reads a form field named `answersJson` (string) and zero-or-more file parts named `files`.

**Key points**

- Content-Type: `multipart/form-data`
- Form field names: **`answersJson`** (string), **`files`** (file; can be repeated)
- `formId` is provided in the route — do NOT rely on sending `formId` inside the body. Use the route path `/api/Forms/{formId}/submissions`.
- Antiforgery is disabled for this endpoint; no CSRF token is required by server-side (`.DisableAntiforgery()` is applied).

## How the server treats files

- Backend receives an `IFormFileCollection? files` called `files`.
- For each uploaded file the backend uploads it (via `IFileStorageService`) and then replaces occurrences of the original `file.FileName` inside `answersJson` with the returned file URL. That means your `answersJson` must contain the filename(s) you upload so the server can replace them with accessible URLs.

Important: replacement is a simple string replace on `file.FileName`. Use unique file names (or include a predictable placeholder) and match them exactly in `answersJson` (case-sensitive).

## Frontend requirements

- Build a `FormData` payload.
- Append `answersJson` as a string: `formData.append('answersJson', JSON.stringify(payload))`.
- Append all files under the same key `files`: `formData.append('files', file)` (repeat for each file).

## Examples

1. Browser fetch (single file)

```javascript
const formData = new FormData();
const answers = { fullName: "Amina Khan", attachments: ["resume.pdf"] };
formData.append("answersJson", JSON.stringify(answers));
formData.append("files", fileInput.files[0], "resume.pdf");

await fetch(`/api/Forms/${formId}/submissions`, {
  method: "POST",
  body: formData,
});
```

2. Browser fetch (multiple files)

```javascript
const formData = new FormData();
const answers = {
  message: "See attached",
  attachments: ["photo.jpg", "document.pdf"],
};
formData.append("answersJson", JSON.stringify(answers));
for (const f of fileInput.files) {
  // Append each file with the same key 'files'
  formData.append("files", f, f.name);
}

await fetch(`/api/Forms/${formId}/submissions`, {
  method: "POST",
  body: formData,
});
```

3. Axios (multipart)

```javascript
const formData = new FormData();
formData.append("answersJson", JSON.stringify(answers));
files.forEach((f) => formData.append("files", f, f.name));

await axios.post(`/api/Forms/${formId}/submissions`, formData, {
  headers: { "Content-Type": "multipart/form-data" },
});
```

4. curl example

```bash
curl -X POST "https://example.com/api/Forms/3fa85f64-.../submissions" \
  -F "answersJson={\"fullName\":\"Amina Khan\",\"attachments\":[\"resume.pdf\"]}" \
  -F "files=@/path/to/resume.pdf;filename=resume.pdf"
```

## Best practices and notes

- Ensure the filenames you include in `answersJson` match the `file.name` you upload.
- Prefer short, unique filenames (e.g., include a timestamp or GUID) to avoid accidental replacement of unrelated strings.
- Validate file types and sizes client-side before upload (the server uploads files via `IFileStorageService` but repository code does not show enforced client-side limits).
- The server replaces occurrences of `file.FileName` with the stored URL; avoid embedding user-provided file names into other text where accidental replacements could happen.
- The endpoint returns `201 Created` with the created submission GUID in the body and `Location` header pointing to `/Forms/{formId}/submissions/{submissionId}`.

## Troubleshooting

- If you receive `400 Bad Request`, check:
  - The route `formId` is correct.
  - `answersJson` is present and valid JSON.
  - Files are appended under the `files` key.
- To inspect what the server stored, call `GET /api/Forms/{formId}/submissions` (requires `Policies.ViewForms` authorization).

---

File location: [FORMS_SUBMISSION_FILES.md](FORMS_SUBMISSION_FILES.md)
