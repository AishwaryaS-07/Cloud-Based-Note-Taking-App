# Project 1 - GlowNotes

Cloud-based note-taking app for the Glowlogics cloud project prompt.

## What is included

- Firebase authentication flow for email/password and Google sign-in
- Firestore-friendly notes model under `users/{uid}/notes`
- CRUD note editor with title, markdown body, tags, and share controls
- Search across title, body, and tags
- Local fallback storage so the app can be explored without Firebase configured

## Setup

1. Install dependencies.
2. Create `.env.local` with your Firebase values.
3. Run `npm run dev`.

## Environment variables

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
```

## Firebase notes

The app expects Firestore documents shaped like:

```ts
{
  title: string;
  body: string;
  tags: string[];
  shared: boolean;
  shareExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}
```

## Deployment

This project is ready to deploy through GitHub-connected hosting such as Vercel, or through Firebase Hosting if you prefer a Firebase deployment.

### Recommended path

1. Push the repository to GitHub.
2. Import the repo into Vercel.
3. Set the same environment variables from `.env.example` in the Vercel project settings.
4. Deploy.

### Firebase path

1. Keep Authentication and Firestore configured in the Firebase Console.
2. Install the Firestore rules from `firestore.rules`.
3. This app is configured for Firebase Hosting static export, so the deployed build comes from `out`.
4. Run `firebase deploy` after the GitHub workflow or local build creates the export.

### Final submission checklist

1. Authentication works with Email/Password.
2. Google sign-in works.
3. Create, edit, delete, and search notes work.
4. Shared note links open correctly and expire properly.
5. Firestore rules are published.
6. The app is deployed and the live URL is included in your submission.
