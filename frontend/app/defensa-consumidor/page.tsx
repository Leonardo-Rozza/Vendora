import type { Metadata } from "next";
import Link from "next/link";
import { LegalList, LegalPage, LegalSection } from "@/components/legal/legal-page";
import { seller, STORE_NAME } from "@/lib/legal/seller";

const DEFENSA_CONSUMIDOR_URL =
  "https://www.argentina.gob.ar/produccion/defensadelconsumidor/formulario";

export const metadata: Metadata = {
  title: `Defensa al Consumidor · ${STORE_NAME}`,
  description:
    "Información de Defensa al Consumidor: tus derechos conforme a la Ley 24.240 y acceso al formulario oficial de la Dirección Nacional de Defensa del Consumidor.",
};

export default function DefensaConsumidorPage() {
  return (
    <LegalPage
      eyebrow="Ley 24.240"
      title="Defensa al Consumidor"
      intro={
        <>
          Las compras realizadas en {STORE_NAME} están amparadas por la Ley
          24.240 de Defensa del Consumidor. Como consumidor o usuaria tenés
          derechos que protegen tu relación de consumo.
        </>
      }
    >
      <LegalSection title="Tus derechos">
        <LegalList
          items={[
            "Información cierta, clara y detallada sobre los productos y las condiciones de compra.",
            "Trato digno y equitativo, y condiciones de atención no abusivas.",
            "Protección de tu salud, seguridad e intereses económicos.",
            "Derecho de arrepentimiento dentro de los 10 días corridos en compras a distancia.",
          ]}
        />
      </LegalSection>

      <LegalSection title="Formulario oficial de reclamos">
        <p>
          Si tenés un reclamo, podés iniciarlo a través del sitio oficial de la
          Dirección Nacional de Defensa del Consumidor:
        </p>
        <p>
          <a
            href={DEFENSA_CONSUMIDOR_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-brand-deep underline underline-offset-2 hover:text-brand-hover"
          >
            argentina.gob.ar/produccion/defensadelconsumidor/formulario
          </a>
        </p>
      </LegalSection>

      <LegalSection title="Contacto previo con la tienda">
        <p>
          Antes de iniciar un reclamo formal, te invitamos a contactarnos para
          resolver tu inconveniente de la forma más rápida posible. Escribinos a{" "}
          <strong>{seller.email}</strong> o llamanos al{" "}
          <strong>{seller.phone}</strong>.
        </p>
      </LegalSection>

      <LegalSection title="Enlaces relacionados">
        <LegalList
          items={[
            <Link
              key="terminos"
              href="/terminos"
              className="font-semibold text-brand-deep underline underline-offset-2 hover:text-brand-hover"
            >
              Términos y Condiciones
            </Link>,
            <Link
              key="arrepentimiento"
              href="/arrepentimiento"
              className="font-semibold text-brand-deep underline underline-offset-2 hover:text-brand-hover"
            >
              Botón de Arrepentimiento
            </Link>,
          ]}
        />
      </LegalSection>
    </LegalPage>
  );
}
