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
};

function formatShortDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

export function NoteSidebar({ notes, activeId, query, onQueryChange, onSelect, onCreate, onDelete }: Props) {
  const filtered = notes.filter((note) => {
    const haystack = `${note.title} ${note.body} ${note.tags.join(" ")}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  return (
    <section className="card card-pad sidebar">
      <div className="stack">
        <div className="toolbar">
          <div>
            <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Notes</h2>
            <p className="muted" style={{ margin: "0.25rem 0 0" }}>
              {filtered.length} matched
            </p>
          </div>
          <button className="button primary" onClick={onCreate} type="button">
            New note
          </button>
        </div>

        <input
          className="input"
          placeholder="Search title, body, or tags"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
      </div>

      <div className="stack">
        {filtered.map((note) => (
          <article
            key={note.id}
            className={`note-item ${note.id === activeId ? "active" : ""}`}
          >
            <button
              className="button ghost"
              style={{ width: "100%", textAlign: "left", padding: 0, border: 0, background: "transparent" }}
              onClick={() => onSelect(note)}
              type="button"
            >
              <div className="row" style={{ justifyContent: "space-between" }}>
                <h3>{note.title}</h3>
                {note.shared ? <span className="chip">Shared</span> : <span className="chip">Private</span>}
              </div>
              <p>{note.body.replace(/[#*_`]/g, "").slice(0, 92) || "Empty note"}</p>
              <span className="muted" style={{ display: "inline-block", marginTop: "0.8rem" }}>
                {formatShortDate(note.updatedAt)}
              </span>
            </button>
            <div className="row" style={{ justifyContent: "flex-end", marginTop: "0.75rem" }}>
              <button className="button danger" onClick={() => void onDelete(note.id)} type="button">
                Delete
              </button>
            </div>
          </article>
        ))}
        {filtered.length === 0 ? <p className="muted">No notes found. Try a different search.</p> : null}
      </div>
    </section>
  );
}
