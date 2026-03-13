"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { loginAdmin } from "@/lib/commerce/api";
import { toCheckoutErrorMessage } from "@/lib/commerce/checkout";

export function AdminLoginForm() {
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
            Protected admin access
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
            Sign in to manage catalog operations and incoming purchase requests.
          </h1>
          <p className="mt-5 text-sm leading-7 text-white/76">
            This surface is reserved for Vendora operators. Storefront browsing and cart
            flow stay public for buyers.
          </p>
          <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/6 p-5 text-sm text-white/76">
            <p>Use the environment-backed initial admin credentials for the first login.</p>
            <p className="mt-2">Product changes, inventory updates, and order review require an active admin session.</p>
          </div>
        </section>

        <section className="rounded-[2rem] border border-[var(--line-soft)] bg-[var(--surface-panel)] p-6 shadow-[0_20px_70px_rgba(61,43,28,0.08)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.34em] text-[var(--ink-soft)]">
                Admin sign in
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--ink-strong)]">
                Start an authenticated session.
              </h2>
            </div>
            <Link className="text-sm font-semibold text-[var(--ink-muted)]" href="/">
              Return to storefront
            </Link>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-[var(--ink-strong)]">
              Admin email
              <input
                className="mt-2 w-full rounded-[1rem] border border-[var(--line-soft)] bg-white px-4 py-3 text-sm text-[var(--ink-strong)] outline-none transition focus:border-[var(--brand-deep)]"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="ops@vendora.local"
                type="email"
                value={email}
              />
            </label>
            <label className="block text-sm font-medium text-[var(--ink-strong)]">
              Password
              <input
                className="mt-2 w-full rounded-[1rem] border border-[var(--line-soft)] bg-white px-4 py-3 text-sm text-[var(--ink-strong)] outline-none transition focus:border-[var(--brand-deep)]"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimum 8 characters"
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
              {isSubmitting ? "Signing in..." : "Sign in to admin"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
