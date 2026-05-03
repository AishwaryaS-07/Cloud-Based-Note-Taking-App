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
        <section className="card card-pad">
          <h1 style={{ marginTop: 0 }}>Loading shared note...</h1>
        </section>
      </main>
    );
  }

  if (!note || expired || !note.shared) {
    return (
      <main className="hero" style={{ minHeight: "100vh", placeItems: "center" }}>
        <section className="card card-pad">
          <h1 style={{ marginTop: 0 }}>This note is not available</h1>
          <p className="muted">
            The note may have expired, been marked private again, or the link could be incomplete.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="hero" style={{ minHeight: "100vh", placeItems: "center" }}>
      <section className="card card-pad" style={{ width: "min(920px, 100%)" }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <span className="chip">Shared note</span>
            <h1 style={{ marginBottom: 0 }}>{note.title}</h1>
          </div>
          <span className="chip">{note.tags.join(" | ") || "No tags"}</span>
        </div>
        <article className="stack" style={{ marginTop: "1rem", lineHeight: 1.8 }}>
          <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontFamily: "inherit" }}>{note.body}</pre>
        </article>
      </section>
    </main>
  );
}
