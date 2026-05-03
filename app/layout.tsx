import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GlowNotes",
  description: "A cloud note-taking app with Firebase auth, Firestore notes, and share links."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
