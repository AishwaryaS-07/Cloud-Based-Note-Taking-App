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
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setTitle(note?.title ?? "");
    setBody(note?.body ?? "");
    setTags(note?.tags.join(", ") ?? "");
    setShared(note?.shared ?? false);
    setExpiresAt(note?.shareExpiresAt?.slice(0, 16) ?? "");
    setStatus(null);
    setCopied(false);
  }, [note]);

  if (!note) {
    return (
      <section className="card empty-state">
        <h2>No note selected</h2>
        <p>Create a new note or pick one from the sidebar to start writing.</p>
      </section>
    );
  }

  const shareLink =
    shared && shareOwnerId && typeof window !== "undefined"
      ? `${window.location.origin}/share?uid=${encodeURIComponent(shareOwnerId)}&id=${encodeURIComponent(note.id)}`
      : null;

  const save = async () => {
    const effectiveExpiresAt = shared ? expiresAt || defaultShareExpiry() : null;
    if (shared && !expiresAt) {
      setExpiresAt(effectiveExpiresAt!.slice(0, 16));
    }
    setStatus("Saving…");
    await onSave({
      title,
      body,
      tags: parseTags(tags),
      shared,
      shareExpiresAt: effectiveExpiresAt
    });
    setStatus("Saved");
    setTimeout(() => setStatus(null), 1500);
  };

  const shareNow = async (value: boolean) => {
    const effectiveExpiresAt = value ? expiresAt || defaultShareExpiry() : null;
    setShared(value);
    if (value && !expiresAt) {
      setExpiresAt(effectiveExpiresAt!.slice(0, 16));
    }
    await onToggleShare(value, effectiveExpiresAt);
    setStatus(value ? "Sharing enabled" : "Sharing disabled");
    setTimeout(() => setStatus(null), 1500);
  };

  const copyLink = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <section className="card card-pad editor-card">
      <div className="editor-header">
        <input
          className="input input-lg"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled"
          style={{ border: "none", background: "transparent", padding: "0.25rem 0", flex: 1, minWidth: "200px" }}
        />
        <div className="row">
          {status ? <span className="editor-status">{status}</span> : null}
          <button className="button primary sm" type="button" onClick={() => void save()}>
            Save
          </button>
        </div>
      </div>

      <input
        className="input"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="Add tags, separated by commas"
      />

      <div className="editor-grid">
        <textarea
          className="textarea"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Start writing… markdown is supported."
        />
        <div className="preview">
          {body.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
          ) : (
            <span className="preview-empty">Preview will appear here.</span>
          )}
        </div>
      </div>

      <div className="share-card">
        <div className="share-card-head">
          <div>
            <strong style={{ fontSize: "0.95rem" }}>Share this note</strong>
            <p className="muted-soft" style={{ margin: "0.2rem 0 0", fontSize: "0.82rem" }}>
              {shared ? "Anyone with the link can view this note until it expires." : "Generate a public link with an expiry date."}
            </p>
          </div>
          <button
            className={shared ? "button sm" : "button primary sm"}
            type="button"
            onClick={() => void shareNow(!shared)}
          >
            {shared ? "Disable" : "Enable"}
          </button>
        </div>

        {shared ? (
          <>
            <div className="row" style={{ gap: "0.5rem" }}>
              <label className="muted-soft" style={{ fontSize: "0.82rem" }}>Expires:</label>
              <input
                className="input"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                style={{ flex: 1, padding: "0.5rem 0.7rem" }}
              />
            </div>
            {shareLink ? (
              <div className="row" style={{ gap: "0.5rem", alignItems: "stretch" }}>
                <span className="share-link" style={{ flex: 1 }}>{shareLink}</span>
                <button className="button sm" type="button" onClick={() => void copyLink()}>
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  );
}
