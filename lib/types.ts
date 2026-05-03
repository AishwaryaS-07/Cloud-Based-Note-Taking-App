export type AuthMode = "signin" | "signup";

export type AuthUser = {
  uid: string;
  email: string;
  displayName: string;
  provider: "firebase" | "local";
};

export type Note = {
  id: string;
  title: string;
  body: string;
  tags: string[];
  shared: boolean;
  shareExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StoredAccount = {
  password: string;
  user: AuthUser;
};

export type StoreSnapshot = {
  user: AuthUser | null;
  notes: Note[];
};

export type StoreAction = {
  signIn(email: string, password: string): Promise<void>;
  signUp(email: string, password: string, displayName: string): Promise<void>;
  signInWithGoogle(): Promise<void>;
  signOut(): Promise<void>;
  createNote(): Promise<Note>;
  updateNote(id: string, patch: Partial<Omit<Note, "id" | "createdAt">>): Promise<void>;
  deleteNote(id: string): Promise<void>;
  toggleShare(id: string, shared: boolean, shareExpiresAt: string | null): Promise<void>;
  subscribe(callback: (snapshot: StoreSnapshot) => void): () => void;
};
