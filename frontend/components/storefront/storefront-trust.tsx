const TRUST_SIGNALS = [
  { icon: "🔒", title: "Pago seguro", detail: "Mercado Pago" },
  { icon: "🚚", title: "Envío a AMBA", detail: "24–72 hs" },
  { icon: "↩️", title: "Devolución", detail: "10 días" },
  { icon: "💬", title: "Soporte real", detail: "Lun a Sáb" },
];

export function StorefrontTrust() {
  return (
    <section className="rounded-[16px] bg-brand-ink">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-[22px] p-[26px]">
        {TRUST_SIGNALS.map((signal) => (
          <div className="flex items-center gap-3" key={signal.title}>
            <div className="grid size-10 flex-shrink-0 place-items-center rounded-[11px] bg-[rgba(216,182,144,0.16)] text-lg">
              <span aria-hidden>{signal.icon}</span>
            </div>
            <div>
              <div className="text-sm font-bold text-[#FBEFD9]">{signal.title}</div>
              <div className="text-[12.5px] text-[#9FB6BE]">{signal.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
