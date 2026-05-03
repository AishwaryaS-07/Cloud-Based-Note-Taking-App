import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  signInWithPopup,
  updateProfile
} from "firebase/auth";
import {
  addDoc,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";
import {
  auth,
  firebaseEnabled,
  fromFirestoreShareExpiresAt,
  notesCollection,
  provider,
  toFirestoreShareExpiresAt
} from "./firebase";
import type { AuthUser, Note, StoredAccount, StoreAction, StoreSnapshot } from "./types";

const STORAGE_KEY = "glownotes-local-store";

type LocalState = {
  accounts: Record<string, StoredAccount>;
  sessions: Record<string, string>;
  notes: Record<string, Note[]>;
  currentUid: string | null;
};

const now = () => new Date().toISOString();

const slug = () => Math.random().toString(36).slice(2, 10);

const defaultNote = (): Note => {
  const stamp = now();
  return {
    id: `note_${slug()}`,
    title: "Untitled note",
    body: "# Welcome to GlowNotes\n\nStart typing here.",
    tags: ["welcome"],
    shared: false,
    shareExpiresAt: null,
    createdAt: stamp,
    updatedAt: stamp
  };
};

function loadLocalState(): LocalState {
  if (typeof window === "undefined") {
    return { accounts: {}, sessions: {}, notes: {}, currentUid: null };
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { accounts: {}, sessions: {}, notes: {}, currentUid: null };
  }

  try {
    return JSON.parse(raw) as LocalState;
  } catch {
    return { accounts: {}, sessions: {}, notes: {}, currentUid: null };
  }
}

function saveLocalState(state: LocalState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function localUser(email: string, displayName?: string): AuthUser {
  const name = displayName?.trim() || email.split("@")[0] || "note-keeper";
  return {
    uid: `local_${email.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
    email,
    displayName: name,
    provider: "local"
  };
}

function createLocalStore(): StoreAction {
  const listeners = new Set<(snapshot: StoreSnapshot) => void>();
  let state = loadLocalState();

  const emit = () => {
    const user = state.currentUid ? (Object.values(state.accounts).find((a) => a.user.uid === state.currentUid)?.user ?? null) : null;
    const notes = user ? state.notes[user.uid] ?? [defaultNote()] : [];
    listeners.forEach((listener) => listener({ user, notes }));
    saveLocalState(state);
  };

  const getCurrentUser = (): AuthUser | null => {
    if (!state.currentUid) return null;
    return Object.values(state.accounts).find((a) => a.user.uid === state.currentUid)?.user ?? null;
  };

  const ensureNotes = (uid: string) => {
    if (!state.notes[uid]) {
      state.notes[uid] = [defaultNote()];
    }
  };

  return {
    async signIn(email, password) {
      const account = state.accounts[email.toLowerCase()];
      if (!account || account.password !== password) {
        throw new Error("Invalid email or password.");
      }
      state.currentUid = account.user.uid;
      ensureNotes(account.user.uid);
      emit();
    },
    async signUp(email, password, displayName) {
      const key = email.toLowerCase();
      if (state.accounts[key]) {
        throw new Error("An account with this email already exists.");
      }
      const user = localUser(email, displayName);
      state.accounts[key] = { password, user };
      state.currentUid = user.uid;
      state.notes[user.uid] = [defaultNote()];
      emit();
    },
    async signInWithGoogle() {
      const user = localUser("demo@google.local", "Google Demo");
      state.accounts[user.email] = {
        password: "google-demo",
        user
      };
      state.currentUid = user.uid;
      ensureNotes(user.uid);
      emit();
    },
    async signOut() {
      state.currentUid = null;
      emit();
    },
    async createNote() {
      const user = getCurrentUser();
      if (!user) throw new Error("Please sign in first.");
      const note = defaultNote();
      state.notes[user.uid] = [note, ...(state.notes[user.uid] ?? [])];
      emit();
      return note;
    },
    async updateNote(id, patch) {
      const user = getCurrentUser();
      if (!user) throw new Error("Please sign in first.");
      state.notes[user.uid] = (state.notes[user.uid] ?? []).map((note) =>
        note.id === id
          ? {
              ...note,
              ...patch,
              updatedAt: now()
            }
          : note
      );
      emit();
    },
    async deleteNote(id) {
      const user = getCurrentUser();
      if (!user) throw new Error("Please sign in first.");
      state.notes[user.uid] = (state.notes[user.uid] ?? []).filter((note) => note.id !== id);
      if (state.notes[user.uid].length === 0) {
        state.notes[user.uid] = [defaultNote()];
      }
      emit();
    },
    async toggleShare(id, shared, shareExpiresAt) {
      const user = getCurrentUser();
      if (!user) throw new Error("Please sign in first.");
      state.notes[user.uid] = (state.notes[user.uid] ?? []).map((note) =>
        note.id === id
          ? {
              ...note,
              shared,
              shareExpiresAt,
              updatedAt: now()
            }
          : note
      );
      emit();
    },
    subscribe(callback) {
      listeners.add(callback);
      const user = getCurrentUser();
      const notes = user ? state.notes[user.uid] ?? [defaultNote()] : [];
      callback({ user, notes });
      return () => {
        listeners.delete(callback);
      };
    }
  };
}

function createFirebaseStore(): StoreAction {
  const firebaseAuth = auth;

  if (!firebaseAuth) {
    throw new Error("Firebase auth was not initialized.");
  }

  const authListeners = new Set<(snapshot: StoreSnapshot) => void>();
  let unsubscribeNotes: (() => void) | null = null;
  let currentSnapshot: StoreSnapshot = { user: null, notes: [] };

  const emit = (snapshot: StoreSnapshot) => {
    currentSnapshot = snapshot;
    authListeners.forEach((listener) => listener(snapshot));
  };

  onAuthStateChanged(firebaseAuth, (user) => {
    const mapped = user
      ? {
          uid: user.uid,
          email: user.email ?? "",
          displayName: user.displayName ?? user.email?.split("@")[0] ?? "Note keeper",
          provider: "firebase" as const
        }
      : null;

    unsubscribeNotes?.();
    unsubscribeNotes = null;

    if (!mapped) {
      emit({ user: null, notes: [] });
      return;
    }

    unsubscribeNotes = onSnapshot(
      query(notesCollection(mapped.uid), orderBy("updatedAt", "desc"), limit(200)),
      (snap) => {
        emit({
          user: mapped,
          notes: snap.docs.map((docSnap) => {
            const data = docSnap.data() as Omit<Note, "id"> & { shareExpiresAt?: unknown };
            return {
              id: docSnap.id,
              ...data,
              shareExpiresAt: fromFirestoreShareExpiresAt(data.shareExpiresAt)
            } as Note;
          })
        });
      }
    );
  });

  return {
    async signIn(email, password) {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
    },
    async signUp(email, password, displayName) {
      const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      if (displayName.trim()) {
        await updateProfile(credential.user, { displayName: displayName.trim() });
      }
    },
    async signInWithGoogle() {
      const googleProvider = provider;
      if (!googleProvider) throw new Error("Google sign-in is unavailable.");
      await signInWithPopup(firebaseAuth, googleProvider);
    },
    async signOut() {
      await firebaseSignOut(firebaseAuth);
    },
    async createNote() {
      if (!currentSnapshot.user) throw new Error("Please sign in first.");
      const nowValue = new Date().toISOString();
      const ref = await addDoc(notesCollection(currentSnapshot.user.uid), {
        title: "Untitled note",
        body: "# Welcome to GlowNotes\n\nStart typing here.",
        tags: ["welcome"],
        shared: false,
        shareExpiresAt: null,
        createdAt: nowValue,
        updatedAt: nowValue,
        createdServerAt: serverTimestamp(),
        updatedServerAt: serverTimestamp()
      });
      return {
        id: ref.id,
        title: "Untitled note",
        body: "# Welcome to GlowNotes\n\nStart typing here.",
        tags: ["welcome"],
        shared: false,
        shareExpiresAt: null,
        createdAt: nowValue,
        updatedAt: nowValue
      };
    },
    async updateNote(id, patch) {
      if (!currentSnapshot.user) throw new Error("Please sign in first.");
      const { shareExpiresAt, ...rest } = patch;
      await updateDoc(doc(notesCollection(currentSnapshot.user.uid), id), {
        ...rest,
        ...(shareExpiresAt !== undefined ? { shareExpiresAt: toFirestoreShareExpiresAt(shareExpiresAt) } : {}),
        updatedServerAt: serverTimestamp()
      });
    },
    async deleteNote(id) {
      if (!currentSnapshot.user) throw new Error("Please sign in first.");
      await deleteDoc(doc(notesCollection(currentSnapshot.user.uid), id));
    },
    async toggleShare(id, shared, shareExpiresAt) {
      if (!currentSnapshot.user) throw new Error("Please sign in first.");
      await updateDoc(doc(notesCollection(currentSnapshot.user.uid), id), {
        shared,
        shareExpiresAt: toFirestoreShareExpiresAt(shareExpiresAt),
        updatedServerAt: serverTimestamp()
      });
    },
    subscribe(callback) {
      authListeners.add(callback);
      callback(currentSnapshot);
      return () => {
        authListeners.delete(callback);
      };
    }
  };
}

export function createStore(): StoreAction {
  if (firebaseEnabled) {
    return createFirebaseStore();
  }

  if (typeof window !== "undefined") {
    return createLocalStore();
  }

  return {
    async signIn() {
      throw new Error("Storage is not ready on the server.");
    },
    async signUp() {
      throw new Error("Storage is not ready on the server.");
    },
    async signInWithGoogle() {
      throw new Error("Storage is not ready on the server.");
    },
    async signOut() {
      throw new Error("Storage is not ready on the server.");
    },
    async createNote() {
      throw new Error("Storage is not ready on the server.");
    },
    async updateNote() {
      throw new Error("Storage is not ready on the server.");
    },
    async deleteNote() {
      throw new Error("Storage is not ready on the server.");
    },
    async toggleShare() {
      throw new Error("Storage is not ready on the server.");
    },
    subscribe() {
      return () => undefined;
    }
  };
}
