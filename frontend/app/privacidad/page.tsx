import type { Metadata } from "next";
import {
  LegalList,
  LegalPage,
  LegalSection,
  SellerDataCard,
} from "@/components/legal/legal-page";
import { seller, STORE_NAME } from "@/lib/legal/seller";

export const metadata: Metadata = {
  title: `Política de Privacidad · ${STORE_NAME}`,
  description:
    "Política de Privacidad de Vendora: qué datos personales recopilamos, con qué finalidad, los proveedores que intervienen y cómo ejercer tus derechos según la Ley 25.326.",
};

export default function PrivacidadPage() {
  return (
    <LegalPage
      eyebrow="Legales"
      title="Política de Privacidad"
      updatedAt="11/06/2026"
      intro={
        <>
          En {STORE_NAME} protegemos tus datos personales. Esta política explica
          qué información recopilamos, con qué finalidad la usamos y cómo podés
          ejercer tus derechos conforme a la Ley 25.326 de Protección de los
          Datos Personales de la República Argentina.
        </>
      }
    >
      <LegalSection title="1. Responsable del tratamiento">
        <p>El responsable del tratamiento de tus datos personales es:</p>
        <SellerDataCard
          rows={[
            { label: "Razón social", value: seller.legalName },
            { label: "CUIT", value: seller.cuit },
            { label: "Domicilio", value: seller.address },
            { label: "Email", value: seller.email },
          ]}
        />
      </LegalSection>

      <LegalSection title="2. Qué datos recopilamos">
        <LegalList
          items={[
            "Datos de contacto: nombre, apellido, correo electrónico y teléfono.",
            "Datos de envío: dirección de entrega y datos necesarios para la logística dentro de CABA y AMBA.",
            "Datos del pedido: productos comprados, montos e historial de operaciones.",
          ]}
        />
        <p>
          No recopilamos ni almacenamos los datos completos de tus tarjetas o
          medios de pago: esa información es gestionada directamente por el
          procesador de pagos.
        </p>
      </LegalSection>

      <LegalSection title="3. Finalidad del tratamiento">
        <LegalList
          items={[
            "Procesar y gestionar tus compras y envíos.",
            "Comunicarnos con vos respecto del estado de tus pedidos.",
            "Cumplir obligaciones legales, fiscales y de defensa del consumidor.",
            "Brindar soporte y atención al cliente.",
          ]}
        />
      </LegalSection>

      <LegalSection title="4. Proveedores que intervienen">
        <p>
          Para prestar el servicio compartimos datos estrictamente necesarios
          con proveedores que actúan como encargados del tratamiento:
        </p>
        <LegalList
          items={[
            <>
              <strong>Mercado Pago</strong>: procesa los pagos. Recibe los datos
              necesarios para concretar la transacción conforme a sus propias
              políticas de privacidad y seguridad.
            </>,
            <>
              <strong>Cloudinary</strong>: aloja y entrega las imágenes de los
              productos del sitio.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection title="5. Conservación de los datos">
        <p>
          Conservamos tus datos durante el tiempo necesario para cumplir las
          finalidades descriptas y las obligaciones legales y fiscales
          aplicables. Luego los eliminamos o anonimizamos.
        </p>
      </LegalSection>

      <LegalSection title="6. Tus derechos">
        <p>
          Conforme a la Ley 25.326, tenés derecho a acceder, rectificar,
          actualizar y suprimir tus datos personales, así como a solicitar su
          retiro o bloqueo.
        </p>
        <p>
          Para ejercer estos derechos, escribinos a{" "}
          <strong>{seller.email}</strong> indicando tu solicitud. Responderemos
          en los plazos previstos por la normativa vigente.
        </p>
        <p className="text-[13px] text-ink-soft">
          La Agencia de Acceso a la Información Pública, en su carácter de Órgano
          de Control de la Ley 25.326, tiene la atribución de atender las
          denuncias y reclamos que se interpongan con relación al incumplimiento
          de las normas sobre protección de datos personales.
        </p>
      </LegalSection>

      <LegalSection title="7. Seguridad">
        <p>
          Adoptamos medidas técnicas y organizativas razonables para proteger tus
          datos contra el acceso no autorizado, la pérdida o la alteración.
        </p>
      </LegalSection>

      <LegalSection title="8. Contacto">
        <p>
          Ante cualquier consulta sobre esta política o sobre el tratamiento de
          tus datos, escribinos a <strong>{seller.email}</strong>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
