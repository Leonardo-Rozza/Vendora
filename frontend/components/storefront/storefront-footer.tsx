import Link from "next/link";

const TRUST_SIGNALS = [
  { icon: "🔒", title: "Pago seguro", detail: "Cifrado · Mercado Pago" },
  { icon: "🚚", title: "Envío a AMBA", detail: "24–72 hs hábiles" },
  { icon: "↩️", title: "Devolución", detail: "10 días corridos" },
  { icon: "💬", title: "Soporte real", detail: "Lun a Sáb · WhatsApp" },
] as const;

const LEGAL_LINKS = [
  { label: "Términos y Condiciones", href: "/terminos" },
  { label: "Política de Privacidad", href: "/privacidad" },
  { label: "Botón de Arrepentimiento", href: "/arrepentimiento" },
  { label: "Defensa al Consumidor", href: "/defensa-consumidor" },
] as const;

export function StorefrontFooter() {
  return (
    <footer className="mt-20 bg-brand-ink">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-6 py-10 sm:grid-cols-2 sm:px-8 lg:grid-cols-4 lg:px-12">
        {TRUST_SIGNALS.map((signal) => (
          <div key={signal.title} className="flex items-center gap-3">
            <span
              aria-hidden
              className="grid size-10 flex-shrink-0 place-items-center rounded-[11px] bg-[rgba(216,182,144,0.16)] text-lg"
            >
              {signal.icon}
            </span>
            <div>
              <div className="text-sm font-bold text-[#fbefd9]">
                {signal.title}
              </div>
              <div className="mt-0.5 text-[12.5px] text-accent-sky">
                {signal.detail}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <nav
          aria-label="Enlaces legales"
          className="mx-auto flex w-full max-w-7xl flex-col items-center gap-3 px-6 py-5 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-6 sm:gap-y-2 sm:px-8 lg:px-12"
        >
          {LEGAL_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent-sky transition-colors hover:text-[#fbefd9]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-1 px-6 py-6 text-center text-[12.5px] text-accent-sky sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:text-left lg:px-12">
          <span className="font-mono uppercase tracking-[0.14em]">
            Vendora · es-AR
          </span>
          <span>© {new Date().getFullYear()} Vendora. Todos los derechos reservados.</span>
        </div>
      </div>
    </footer>
  );
}
