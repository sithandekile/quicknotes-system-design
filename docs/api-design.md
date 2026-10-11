# QuickNotes API design

This document proposes the production API for QuickNotes. The browser exercise
uses JSONPlaceholder as a mock only; the production service should own durable
notes, authenticated users, validation, and authorization.

## Conventions

- Base URL: `https://api.quicknotes.example/v1`
- JSON request and response bodies use `application/json`.
- Authentication uses `Authorization: Bearer <access-token>`. Tokens are issued
  by the login endpoint and are not placed in URLs.
- Timestamps are UTC ISO 8601 strings. IDs are opaque UUIDs.
- Lists are ordered by `updatedAt` descending by default and use cursor
  pagination. The default page size is 20; the maximum is 100.
- Every note and tag operation is scoped to the authenticated user. A client
  cannot read, update, or delete another user's data.
- PATCH updates only supplied fields. `title` is required on create, 1-100
  characters after trimming; `body` is optional and up to 50,000 characters.

## Endpoints

| Method | Path | Purpose | Success |
| --- | --- | --- | --- |
| POST | `/auth/register` | Create an account | `201 Created` |
| POST | `/auth/login` | Authenticate and issue a token | `200 OK` |
| POST | `/auth/logout` | Revoke the current refresh/session token | `204 No Content` |
| GET | `/users/me` | Return the authenticated user | `200 OK` |
| GET | `/notes?limit=20&cursor=...&q=...&tag=...` | List/search the user's notes | `200 OK` |
| POST | `/notes` | Create a note | `201 Created` |
| GET | `/notes/{noteId}` | Fetch one note | `200 OK` |
| PATCH | `/notes/{noteId}` | Update note fields | `200 OK` |
| DELETE | `/notes/{noteId}` | Delete a note | `204 No Content` |
| GET | `/tags` | List the user's tags | `200 OK` |
| POST | `/tags` | Create a tag | `201 Created` |
| PUT | `/notes/{noteId}/tags/{tagId}` | Associate a tag with a note | `204 No Content` |
| DELETE | `/notes/{noteId}/tags/{tagId}` | Remove a tag association | `204 No Content` |

`cursor` is an opaque token from the previous response's `nextCursor`. Search
matches title and body. A tag filter returns notes assigned that tag.

## Request and response examples

### Create a note

Request:

```http
POST /v1/notes HTTP/1.1
Authorization: Bearer eyJ...
Content-Type: application/json
```

```json
{
  "title": "Design review",
  "body": "Review the API contract on Friday.",
  "tagIds": ["a2391bb3-0246-49ec-91dd-6fdbeb313033"]
}
```

Response (`201 Created`):

```http
Location: /v1/notes/6e85b898-55d1-49e0-9c2a-d79686d61f5b
```

```json
{
  "id": "6e85b898-55d1-49e0-9c2a-d79686d61f5b",
  "title": "Design review",
  "body": "Review the API contract on Friday.",
  "tags": [
    {
      "id": "a2391bb3-0246-49ec-91dd-6fdbeb313033",
      "name": "work"
    }
  ],
  "createdAt": "2026-10-11T08:00:00Z",
  "updatedAt": "2026-10-11T08:00:00Z"
}
```

`tagIds` is optional; every supplied tag must belong to the authenticated user.
The server sets timestamps and ownership rather than trusting client-supplied
values.

### List notes

Request:

```http
GET /v1/notes?limit=20&q=design HTTP/1.1
Authorization: Bearer eyJ...
```

Response (`200 OK`):

```json
{
  "items": [
    {
      "id": "6e85b898-55d1-49e0-9c2a-d79686d61f5b",
      "title": "Design review",
      "body": "Review the API contract on Friday.",
      "tags": [],
      "createdAt": "2026-10-11T08:00:00Z",
      "updatedAt": "2026-10-11T08:00:00Z"
    }
  ],
  "nextCursor": null
}
```

### Update and delete

`PATCH /v1/notes/{noteId}` accepts any non-empty subset of `title`, `body`, and
`tagIds`; for example `{"title":"Updated title"}`. It returns the complete
updated note with `200 OK`. `DELETE /v1/notes/{noteId}` returns `204 No Content`
and is idempotent from the client's perspective.

## Error format and status codes

All errors use a stable machine-readable code, a human-readable message, and
optional field details:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid fields.",
    "details": {
      "title": "Must be between 1 and 100 characters."
    },
    "requestId": "req_01J9ABCDEF"
  }
}
```

The task brief refers to error codes from accompanying instructions, but none
were included with the supplied files. The following conventional HTTP statuses
and stable codes are therefore the proposed contract:

| HTTP status | Code | Meaning |
| --- | --- | --- |
| `400` | `BAD_REQUEST` | Malformed JSON or invalid query parameter |
| `401` | `UNAUTHENTICATED` | Missing, expired, or invalid credentials |
| `403` | `FORBIDDEN` | Authenticated user is not allowed to perform the operation |
| `404` | `NOT_FOUND` | Resource does not exist or is not visible to this user |
| `409` | `CONFLICT` | Duplicate account/email or conflicting state |
| `422` | `VALIDATION_ERROR` | Well-formed request fails field validation |
| `429` | `RATE_LIMITED` | Request limit exceeded; include `Retry-After` |
| `500` | `INTERNAL_ERROR` | Unexpected server error; response includes a request ID |
| `503` | `SERVICE_UNAVAILABLE` | Temporary outage or maintenance |

Do not return stack traces, password hashes, or internal database details.
Clients should display `message`, use `code` for predictable behavior, and
retry only safe/idempotent operations when appropriate.
