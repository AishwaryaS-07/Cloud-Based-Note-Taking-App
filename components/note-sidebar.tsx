"use client";

import type { Note } from "@/lib/types";

type Props = {
  notes: Note[];
  activeId: string | null;
  query: string;
  onQueryChange(value: string): void;
  onSelect(note: Note): void;
  onCreate(): Promise<void>;
  onDelete(id: string): Promise<void>;
  onSignOut(): Promise<void>;
  userEmail: string;
};

function formatShortDate(value: string) {
  const date = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function previewText(body: string) {
  return body.replace(/[#*_`>\-\[\]()]/g, "").replace(/\s+/g, " ").trim();
}

export function NoteSidebar({
  notes,
  activeId,
  query,
  onQueryChange,
  onSelect,
  onCreate,
  onDelete,
  onSignOut,
  userEmail
}: Props) {
  const filtered = notes.filter((note) => {
    const haystack = `${note.title} ${note.body} ${note.tags.join(" ")}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  return (
    <section className="card sidebar">
      <div className="sidebar-header">
        <h2>Notes</h2>
        <button className="button primary sm" onClick={onCreate} type="button">
          + New
        </button>
      </div>

      <input
        className="input"
        placeholder="Search notes…"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
      />

      <div className="note-list">
        {filtered.length === 0 ? (
          <p className="muted-soft" style={{ fontSize: "0.85rem", padding: "0.5rem", margin: 0 }}>
            {notes.length === 0 ? "No notes yet. Create your first one." : "No matches found."}
          </p>
        ) : (
          filtered.map((note) => {
            const preview = previewText(note.body);
            return (
              <div
                key={note.id}
                className={`note-item ${note.id === activeId ? "active" : ""}`}
                onClick={() => onSelect(note)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(note);
                  }
                }}
              >
                <div className="note-item-row">
                  <h3>{note.title || "Untitled"}</h3>
                  <button
                    className="note-item-delete"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void onDelete(note.id);
                    }}
                    aria-label="Delete note"
                  >
                    ×
                  </button>
                </div>
                <p>{preview || "No content"}</p>
                <div className="note-item-row">
                  <span className="meta">{formatShortDate(note.updatedAt)}</span>
                  {note.shared ? <span className="chip chip-shared">Shared</span> : null}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div style={{ marginTop: "auto", paddingTop: "0.85rem", borderTop: "1px solid var(--line)" }}>
        <p className="muted-soft" style={{ fontSize: "0.78rem", margin: "0 0 0.5rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {userEmail}
        </p>
        <button className="button sm" type="button" onClick={() => void onSignOut()} style={{ width: "100%" }}>
          Sign out
        </button>
      </div>
    </section>
  );
}
