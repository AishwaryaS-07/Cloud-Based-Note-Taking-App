import type { Metadata } from "next";
import { ShareViewer } from "./share-viewer";

export const metadata: Metadata = {
  title: "Shared Note | GlowNotes",
  description: "View a shared GlowNotes note."
};

export default async function SharedNotePage({
  searchParams
}: {
  searchParams?: Promise<{ uid?: string; id?: string }>;
}) {
  const params = (await searchParams) ?? {};

  return <ShareViewer uid={params.uid ?? ""} id={params.id ?? ""} />;
}
