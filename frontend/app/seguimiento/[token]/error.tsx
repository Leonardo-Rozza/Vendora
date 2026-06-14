"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { appCopy } from "@/lib/copy/es-ar";

export default function TrackingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const copy = appCopy.feedback;

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col items-center px-6 py-20 text-center sm:px-8">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-danger-ink">
        {copy.errorEyebrow}
      </p>
      <h1 className="mt-3 text-2xl font-extrabold text-ink-strong sm:text-3xl">
        {copy.trackingErrorTitle}
      </h1>
      <p className="mt-3 max-w-[42ch] text-[15px] leading-relaxed text-ink-muted">
        {copy.errorDescription}
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={() => reset()}>{copy.retry}</Button>
        <Link href="/">
          <Button variant="secondary">{copy.backToStore}</Button>
        </Link>
      </div>
    </main>
  );
}
