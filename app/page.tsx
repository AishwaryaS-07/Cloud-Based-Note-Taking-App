"use client";

import { useEffect, useMemo, useState } from "react";
import { AuthPanel } from "@/components/auth-panel";
import { NoteEditor } from "@/components/note-editor";
import { NoteSidebar } from "@/components/note-sidebar";
import { createStore } from "@/lib/store";
import type { AuthUser, Note, StoreAction } from "@/lib/types";

function initials(name: string | undefined | null) {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function Page() {
  const [store, setStore] = useState<StoreAction | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    setStore(createStore());
    setBooted(true);
  }, []);

  useEffect(() => {
    if (!store) return;
    return store.subscribe((snapshot) => {
      setUser(snapshot.user);
      setNotes(snapshot.notes);
      setActiveId((current) => current ?? snapshot.notes[0]?.id ?? null);
    });
  }, [store]);

  const activeNote = useMemo(
    () => notes.find((note) => note.id === activeId) ?? notes[0] ?? null,
    [notes, activeId]
  );

  const run = async (task: () => Promise<void>) => {
    setLoading(true);
    try {
      await task();
    } finally {
      setLoading(false);
    }
  };

  if (!booted) {
    return (
      <div className="shell">
        <main className="hero" style={{ placeItems: "center" }}>
          <p className="muted">Loading…</p>
        </main>
      </div>
    );
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <div className="brand-mark">G</div>
            <div className="brand-text">
              <strong>GlowNotes</strong>
              <span>Cloud notes</span>
            </div>
          </div>
          {user ? (
            <div className="user-pill">
              <div className="avatar">{initials(user.displayName || user.email)}</div>
              <span>{user.displayName || user.email}</span>
            </div>
          ) : (
            <span className="chip chip-status">Online</span>
          )}
        </div>
      </header>

      <main className="hero">
        {!user ? (
          <div className="auth-hero">
            <div className="auth-headline">
              <h1>
                Your notes,<br />
                <span>anywhere you go.</span>
              </h1>
              <p>
                A fast, private workspace for capturing thoughts, organising ideas,
                and sharing notes with a single link. Built on Firebase for real-time sync.
              </p>
              <ul className="feature-list">
                <li>Real-time sync across all your devices</li>
                <li>Markdown editor with live preview</li>
                <li>Tag, search, and organise effortlessly</li>
                <li>Share notes with expiring public links</li>
              </ul>
            </div>

            <AuthPanel
              loading={loading}
              onSignIn={(email, password) =>
                run(async () => {
                  if (!store) throw new Error("Store is not ready.");
                  await store.signIn(email, password);
                })
              }
              onSignUp={(email, password, displayName) =>
                run(async () => {
                  if (!store) throw new Error("Store is not ready.");
                  await store.signUp(email, password, displayName);
                })
              }
              onGoogleSignIn={() =>
                run(async () => {
                  if (!store) throw new Error("Store is not ready.");
                  await store.signInWithGoogle();
                })
              }
            />
          </div>
        ) : (
          <div className="hero-grid">
            <NoteSidebar
              notes={notes}
              activeId={activeNote?.id ?? null}
              query={query}
              onQueryChange={setQuery}
              onSelect={(note) => setActiveId(note.id)}
              onCreate={() =>
                run(async () => {
                  if (!store) throw new Error("Store is not ready.");
                  const created = await store.createNote();
                  setActiveId(created.id);
                })
              }
              onDelete={(id) =>
                run(async () => {
                  if (!store) throw new Error("Store is not ready.");
                  await store.deleteNote(id);
                  if (activeId === id) {
                    setActiveId(null);
                  }
                })
              }
              onSignOut={() =>
                run(async () => {
                  if (!store) throw new Error("Store is not ready.");
                  await store.signOut();
                })
              }
              userEmail={user.email}
            />

            <NoteEditor
              note={activeNote}
              shareOwnerId={user?.uid ?? null}
              onSave={(patch) =>
                run(async () => {
                  if (!store || !activeNote) throw new Error("No note selected.");
                  await store.updateNote(activeNote.id, patch);
                })
              }
              onToggleShare={(shared, shareExpiresAt) =>
                run(async () => {
                  if (!store || !activeNote) throw new Error("No note selected.");
                  await store.toggleShare(activeNote.id, shared, shareExpiresAt);
                })
              }
            />
          </div>
        )}
      </main>
    </div>
  );
}
