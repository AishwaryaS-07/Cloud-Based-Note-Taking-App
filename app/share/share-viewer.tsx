"use client";

import { useEffect, useMemo, useState } from "react";
import { db, firebaseEnabled, fromFirestoreShareExpiresAt } from "@/lib/firebase";
import type { Note } from "@/lib/types";
import { doc, getDoc } from "firebase/firestore";

function readLocalNote(uid: string, id: string): Note | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem("glownotes-local-store");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as {
      notes?: Record<string, Note[]>;
    };
    return parsed.notes?.[uid]?.find((note) => note.id === id) ?? null;
  } catch {
    return null;
  }
}

export function ShareViewer({ uid, id }: { uid: string; id: string }) {
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid || !id) {
      setLoading(false);
      setNote(null);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        if (firebaseEnabled && db) {
          const snap = await getDoc(doc(db, "users", uid, "notes", id));
          if (snap.exists()) {
            const data = snap.data() as Omit<Note, "id"> & { shareExpiresAt?: unknown };
            setNote({
              id: snap.id,
              ...data,
              shareExpiresAt: fromFirestoreShareExpiresAt(data.shareExpiresAt)
            });
          } else {
            setNote(null);
          }
        } else {
          setNote(readLocalNote(uid, id));
        }
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id, uid]);

  const expired = useMemo(() => {
    if (!note?.shareExpiresAt) return false;
    return Date.now() > new Date(note.shareExpiresAt).getTime();
  }, [note]);

  if (loading) {
    return (
      <main className="hero" style={{ minHeight: "100vh", placeItems: "center" }}>
        <p className="muted">Loading…</p>
      </main>
    );
  }

  if (!note || expired || !note.shared) {
    return (
      <main className="hero" style={{ minHeight: "100vh", placeItems: "center" }}>
        <section className="card empty-state" style={{ maxWidth: 480 }}>
          <h2>This note isn’t available</h2>
          <p>The link may have expired or the note is no longer shared.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="hero" style={{ minHeight: "100vh", placeItems: "center", paddingBlock: "3rem" }}>
      <section className="card card-pad" style={{ width: "min(820px, 100%)" }}>
        <div className="row" style={{ marginBottom: "1rem" }}>
          <span className="chip chip-shared">Shared note</span>
          {note.tags.length ? (
            <span className="chip">{note.tags.join(" · ")}</span>
          ) : null}
        </div>
        <h1 style={{ marginTop: 0, marginBottom: "1.25rem", fontSize: "2rem", letterSpacing: "-0.02em" }}>{note.title || "Untitled"}</h1>
        <article className="preview" style={{ minHeight: 0, border: "none", padding: 0, background: "transparent" }}>
          <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontFamily: "inherit", lineHeight: 1.75 }}>{note.body}</pre>
        </article>
      </section>
    </main>
  );
}
