# QuickNotes

A small browser client exercise for loading, creating, and deleting notes. The
interactive demo uses JSONPlaceholder, a mock API; it is not the production
QuickNotes backend.

## Run the demo

Open `index.html` in a modern browser. An internet connection is required to
reach JSONPlaceholder. If the browser blocks requests from a local file, serve
the repository root with any static HTTP server and open its local URL.

Use **Load notes** to fetch up to 10 sample posts. Add a note with a title of
up to 100 characters and an optional body. Each displayed note has a Delete
button. JSONPlaceholder simulates writes and does not persist them, so created
notes are added in the current page session and successful deletes remove the
selected item from the current page only.

## Project files

- `index.html`, `style.css`, `api.js`: the demo page, styling, and API client.
- `docs/api-design.md`: proposed production API contract.
- `docs/data-model.md`: relational schema and query examples.
- `docs/architecture.md`: requirements, estimates, architecture, flows, and
  operational trade-offs.

The browser client has no build step or package dependencies. The documentation
describes a future backend; the demo does not implement authentication,
persistence, tags, or the production API.

## Submission checklist

-  GET notes with loading, success, failure, and empty states.
-  Validate and POST notes; display the response status and ID.
-  DELETE notes and explain mock-service behavior in code.
-  Document the production API, data model, and architecture.
