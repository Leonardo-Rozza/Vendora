"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { loginAdmin } from "@/lib/commerce/api";
import { appCopy } from "@/lib/copy/es-ar";
import { toCheckoutErrorMessage } from "@/lib/commerce/checkout";
import { Button, Field, Input } from "@/components/ui";

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
    <main className="grid min-h-screen place-items-center bg-brand-ink px-6 py-12">
      <div className="w-full max-w-[400px]">
        <div className="mb-6 flex items-center justify-center gap-3">
          <span className="grid size-11 place-items-center rounded-[12px] bg-brand-deep text-[23px] font-extrabold text-surface-base">
            V
          </span>
          <span className="text-[22px] font-extrabold tracking-[-0.02em] text-[#fbefd9]">
            Vendora
          </span>
        </div>

        <section className="rounded-panel bg-surface-base p-7 shadow-strong sm:px-7 sm:py-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-brand-deep">
                {copy.eyebrow}
              </p>
              <h1 className="mt-1.5 text-[23px] font-extrabold tracking-[-0.02em] text-ink-strong">
                {copy.sectionTitle}
              </h1>
            </div>
            <Link
              className="mt-1 text-sm font-semibold text-ink-muted"
              href="/"
            >
              {copy.backToStore}
            </Link>
          </div>

          <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
            <Field id="admin-login-email" label={copy.emailLabel}>
              <Input
                onChange={(event) => setEmail(event.target.value)}
                placeholder={copy.emailPlaceholder}
                type="email"
                value={email}
              />
            </Field>
            <Field id="admin-login-password" label={copy.passwordLabel}>
              <Input
                onChange={(event) => setPassword(event.target.value)}
                placeholder={copy.passwordPlaceholder}
                type="password"
                value={password}
              />
            </Field>
            {error ? (
              <p
                className="flex items-center gap-1.5 text-[12.5px] font-medium text-danger-ink"
                role="alert"
              >
                <span
                  aria-hidden
                  className="grid size-3.5 flex-shrink-0 place-items-center rounded-full bg-danger-ink text-[10px] font-bold text-white"
                >
                  !
                </span>
                {error}
              </p>
            ) : null}
            <Button
              className="w-full"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? copy.submitting : copy.submit}
            </Button>
          </form>

          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-ink-soft">
            <span aria-hidden>🔒</span>
            {copy.restrictedHint}
          </div>
        </section>
      </div>
    </main>
  );
}
