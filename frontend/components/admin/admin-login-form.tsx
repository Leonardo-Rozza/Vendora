"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { loginAdmin } from "@/lib/commerce/api";
import { appCopy } from "@/lib/copy/es-ar";
import { toCheckoutErrorMessage } from "@/lib/commerce/checkout";

export function AdminLoginForm() {
  const copy = appCopy.adminLogin;
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await loginAdmin({ email, password });
      router.replace("/admin");
      router.refresh();
    } catch (caughtError) {
      setError(toCheckoutErrorMessage(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#132531_0%,#172f3d_48%,#efe6d7_48%,#efe6d7_100%)] px-6 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[0.94fr_1.06fr]">
        <section className="rounded-[2rem] border border-white/10 bg-white/8 p-6 text-white shadow-[0_20px_80px_rgba(8,14,19,0.28)] backdrop-blur">
          <p className="font-mono text-xs uppercase tracking-[0.34em] text-[var(--accent-sand)]">
            {copy.eyebrow}
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
            {copy.title}
          </h1>
          <p className="mt-5 text-sm leading-7 text-white/76">
            {copy.description}
          </p>
          <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/6 p-5 text-sm text-white/76">
            <p>{copy.credentialHint}</p>
            <p className="mt-2">{copy.sessionHint}</p>
          </div>
        </section>

        <section className="rounded-[2rem] border border-[var(--line-soft)] bg-[var(--surface-panel)] p-6 shadow-[0_20px_70px_rgba(61,43,28,0.08)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.34em] text-[var(--ink-soft)]">
                {copy.sectionEyebrow}
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--ink-strong)]">
                {copy.sectionTitle}
              </h2>
            </div>
            <Link className="text-sm font-semibold text-[var(--ink-muted)]" href="/">
              {copy.backToStore}
            </Link>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-[var(--ink-strong)]">
              {copy.emailLabel}
              <input
                className="mt-2 w-full rounded-[1rem] border border-[var(--line-soft)] bg-white px-4 py-3 text-sm text-[var(--ink-strong)] outline-none transition focus:border-[var(--brand-deep)]"
                onChange={(event) => setEmail(event.target.value)}
                placeholder={copy.emailPlaceholder}
                type="email"
                value={email}
              />
            </label>
            <label className="block text-sm font-medium text-[var(--ink-strong)]">
              {copy.passwordLabel}
              <input
                className="mt-2 w-full rounded-[1rem] border border-[var(--line-soft)] bg-white px-4 py-3 text-sm text-[var(--ink-strong)] outline-none transition focus:border-[var(--brand-deep)]"
                onChange={(event) => setPassword(event.target.value)}
                placeholder={copy.passwordPlaceholder}
                type="password"
                value={password}
              />
            </label>
            {error ? <p className="text-sm text-[var(--warning-copy)]">{error}</p> : null}
            <button
              className="w-full rounded-full bg-[var(--ink-strong)] px-5 py-3 text-sm font-semibold text-[var(--surface-base)] transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? copy.submitting : copy.submit}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
