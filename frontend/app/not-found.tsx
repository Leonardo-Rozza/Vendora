import Link from "next/link";
import { Button } from "@/components/ui";
import { appCopy } from "@/lib/copy/es-ar";

export default function RootNotFound() {
  const copy = appCopy.feedback;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col items-center px-6 py-20 text-center sm:px-8">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">
        {copy.notFoundEyebrow}
      </p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.02em] text-ink-strong sm:text-4xl">
        {copy.notFoundTitle}
      </h1>
      <p className="mt-3 max-w-[42ch] text-[15px] leading-relaxed text-ink-muted">
        {copy.notFoundDescription}
      </p>
      <Link className="mt-7" href="/">
        <Button>{copy.backToStore}</Button>
      </Link>
    </main>
  );
}
