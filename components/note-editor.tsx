"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Note } from "@/lib/types";
import { useEffect, useState } from "react";

type Props = {
  note: Note | null;
  shareOwnerId: string | null;
  onSave(patch: Partial<Omit<Note, "id" | "createdAt">>): Promise<void>;
  onToggleShare(shared: boolean, shareExpiresAt: string | null): Promise<void>;
};

function parseTags(input: string) {
  return input
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function defaultShareExpiry() {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
}

export function NoteEditor({ note, shareOwnerId, onSave, onToggleShare }: Props) {
  const [title, setTitle] = useState(note?.title ?? "");
  const [body, setBody] = useState(note?.body ?? "");
  const [tags, setTags] = useState(note?.tags.join(", ") ?? "");
  const [shared, setShared] = useState(note?.shared ?? false);
  const [expiresAt, setExpiresAt] = useState(note?.shareExpiresAt?.slice(0, 16) ?? "");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    setTitle(note?.title ?? "");
    setBody(note?.body ?? "");
    setTags(note?.tags.join(", ") ?? "");
    setShared(note?.shared ?? false);
    setExpiresAt(note?.shareExpiresAt?.slice(0, 16) ?? "");
    setStatus(null);
  }, [note]);

  if (!note) {
    return (
      <section className="card card-pad">
        <h2 style={{ marginTop: 0 }}>Open a note to edit it</h2>
        <p className="muted">
          Select a note from the left panel, or create a new note to start capturing thoughts, meeting notes, and shareable snippets.
        </p>
      </section>
    );
  }

  const shareLink =
    shared && shareOwnerId
      ? `/share?uid=${encodeURIComponent(shareOwnerId)}&id=${encodeURIComponent(note.id)}`
      : null;

  const save = async () => {
    const effectiveExpiresAt = shared ? expiresAt || defaultShareExpiry() : null;
    if (shared && !expiresAt) {
      setExpiresAt(effectiveExpiresAt!.slice(0, 16));
    }
    setStatus("Saving...");
    await onSave({
      title,
      body,
      tags: parseTags(tags),
      shared,
      shareExpiresAt: effectiveExpiresAt
    });
    setStatus("Saved");
    setTimeout(() => setStatus(null), 1200);
  };

  const shareNow = async (value: boolean) => {
    const effectiveExpiresAt = value ? expiresAt || defaultShareExpiry() : null;
    setShared(value);
    if (value && !expiresAt) {
      setExpiresAt(effectiveExpiresAt!.slice(0, 16));
    }
    await onToggleShare(value, effectiveExpiresAt);
    setStatus(value ? "Share enabled" : "Share disabled");
    setTimeout(() => setStatus(null), 1200);
  };

  return (
    <section className="card card-pad">
      <div className="editor-title">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <h2 style={{ margin: 0 }}>Editor</h2>
            <p className="muted" style={{ margin: "0.25rem 0 0" }}>
              Firestore path: <code>users/&lt;uid&gt;/notes</code>
            </p>
          </div>
          <div className="row">
            <span className="chip">{shared ? "Public read" : "Private"}</span>
            <span className="chip">{status ?? "Ready"}</span>
          </div>
        </div>

        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note title" />
      </div>

      <div className="grid-2" style={{ alignItems: "start" }}>
        <div className="stack">
          <textarea className="textarea" value={body} onChange={(e) => setBody(e.target.value)} />
          <input className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="tags, separated, by, commas" />

          <div className="card card-pad" style={{ background: "rgba(6, 12, 24, 0.68)" }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div>
                <strong>Share link</strong>
                <p className="muted" style={{ margin: "0.25rem 0 0" }}>
                  Public access is controlled by the `shared` flag and `shareExpiresAt`.
                </p>
              </div>
              <button className="button" type="button" onClick={() => void shareNow(!shared)}>
                {shared ? "Disable share" : "Enable share"}
              </button>
            </div>

            <input
              className="input"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              style={{ marginTop: "0.75rem" }}
            />

            <div className="row" style={{ marginTop: "0.75rem", justifyContent: "space-between" }}>
              <button className="button primary" type="button" onClick={() => void save()}>
                Save changes
              </button>
              {shareLink ? <span className="muted" style={{ fontSize: "0.84rem" }}>{shareLink}</span> : null}
            </div>
          </div>
        </div>

        <div className="card card-pad" style={{ background: "rgba(5, 11, 22, 0.68)" }}>
          <div className="row" style={{ justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <strong>Preview</strong>
            <span className="chip">{note.tags.join(" | ") || "no tags yet"}</span>
          </div>
          <article className="stack" style={{ lineHeight: 1.8 }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
          </article>
        </div>
      </div>
    </section>
  );
}
