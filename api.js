const API_URL = "https://jsonplaceholder.typicode.com/posts";

const loadButton = document.querySelector("#load-btn");
const noteForm = document.querySelector("#note-form");
const titleInput = document.querySelector("#title-input");
const bodyInput = document.querySelector("#body-input");
const submitButton = document.querySelector("#submit-btn");
const statusMessage = document.querySelector("#status");
const notesList = document.querySelector("#notes-list");

let notes = [];
let nextClientId = 0;
let requestInProgress = false;

function setStatus(message) {
  statusMessage.textContent = message;
}

function updateControls() {
  loadButton.disabled = requestInProgress;
  submitButton.disabled = requestInProgress;
  notesList.querySelectorAll(".delete-btn").forEach((button) => {
    button.disabled = requestInProgress;
  });
}

function renderNotes() {
  notesList.replaceChildren();

  if (notes.length === 0) {
    const emptyState = document.createElement("li");
    emptyState.className = "empty-state";
    emptyState.textContent = "No notes to show. Load notes or add one to get started.";
    notesList.append(emptyState);
    return;
  }

  notes.forEach((note) => {
    const item = document.createElement("li");
    item.className = "note";

    const title = document.createElement("h2");
    title.textContent = note.title;

    const body = document.createElement("p");
    body.textContent = note.body || "No note body.";

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-btn";
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.disabled = requestInProgress;
    deleteButton.addEventListener("click", () => deleteNote(note));

    item.append(title, body, deleteButton);
    notesList.append(item);
  });
}

async function loadNotes() {
  requestInProgress = true;
  setStatus("Loading notes...");
  updateControls();

  try {
    const response = await fetch(`${API_URL}?_limit=10`);
    if (!response.ok) {
      throw new Error(`The server responded with status ${response.status}.`);
    }

    const serverNotes = await response.json();
    if (!Array.isArray(serverNotes)) {
      throw new Error("The server returned an unexpected response.");
    }

    notes = serverNotes.map((note) => ({
      ...note,
      clientId: `server-${note.id}`,
    }));
    renderNotes();
    setStatus(`Loaded ${notes.length} ${notes.length === 1 ? "note" : "notes"} from the server.`);
  } catch {
    setStatus("Couldn't load notes. Please check your connection and try again.");
  } finally {
    requestInProgress = false;
    updateControls();
  }
}

async function createNote(event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  const body = bodyInput.value;
  if (!title || title.length > 100) {
    setStatus("Please enter a title of 1 to 100 characters.");
    titleInput.focus();
    return;
  }

  requestInProgress = true;
  updateControls();

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=UTF-8" },
      body: JSON.stringify({ title, body, userId: 1 }),
    });
    if (!response.ok) {
      throw new Error(`The server responded with status ${response.status}.`);
    }

    const createdNote = await response.json();
    if (!createdNote || createdNote.id === undefined) {
      throw new Error("The server did not return the new note id.");
    }

    const note = {
      ...createdNote,
      clientId: `created-${++nextClientId}`,
    };
    notes.unshift(note);
    renderNotes();
    noteForm.reset();
    setStatus(`Note created (status ${response.status}, id ${note.id}).`);
  } catch {
    setStatus("Couldn't create the note. Please try again.");
  } finally {
    requestInProgress = false;
    updateControls();
  }
}

async function deleteNote(note) {
  requestInProgress = true;
  updateControls();

  try {
    const response = await fetch(`${API_URL}/${encodeURIComponent(note.id)}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error(`The server responded with status ${response.status}.`);
    }

    // JSONPlaceholder accepts writes but does not persist them; mirror its successful DELETE locally.
    notes = notes.filter((item) => item.clientId !== note.clientId);
    renderNotes();
    setStatus(`Note ${note.id} deleted.`);
  } catch {
    setStatus(`Couldn't delete note ${note.id}. Please try again.`);
  } finally {
    requestInProgress = false;
    updateControls();
  }
}

loadButton.addEventListener("click", loadNotes);
noteForm.addEventListener("submit", createNote);
renderNotes();
