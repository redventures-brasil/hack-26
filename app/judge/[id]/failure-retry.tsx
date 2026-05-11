"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function FailureRetry({ submissionId }: { submissionId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className="ed-btn"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await fetch(`/api/evaluate/${submissionId}`, { method: "POST" }).catch(
          () => {},
        );
        window.setTimeout(() => {
          router.refresh();
          setBusy(false);
        }, 1500);
      }}
    >
      {busy ? "Tentando…" : "Tentar de novo"}
    </button>
  );
}
