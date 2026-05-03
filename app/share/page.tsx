"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ShareViewer } from "./share-viewer";

function SharedNoteContent() {
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid") ?? "";
  const id = searchParams.get("id") ?? "";
  return <ShareViewer uid={uid} id={id} />;
}

export default function SharedNotePage() {
  return (
    <Suspense fallback={null}>
      <SharedNoteContent />
    </Suspense>
  );
}
