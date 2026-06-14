import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalList,
  LegalPage,
  LegalSection,
  SellerDataCard,
} from "@/components/legal/legal-page";
import { seller, STORE_NAME } from "@/lib/legal/seller";

export const metadata: Metadata = {
  title: `Términos y Condiciones · ${STORE_NAME}`,
  description:
    "Términos y condiciones de uso de la tienda Vendora: precios en pesos argentinos, proceso de compra, medios de pago, envíos a CABA y AMBA, devoluciones y ley aplicable.",
};

export default function TerminosPage() {
  return (
    <LegalPage
      eyebrow="Legales"
      title="Términos y Condiciones"
      updatedAt="11/06/2026"
      intro={
        <>
          Estos Términos y Condiciones regulan el uso del sitio de {STORE_NAME} y
          la compra de productos a través de él. Al navegar o realizar una compra
          aceptás estas condiciones en su totalidad.
        </>
      }
    >
      <LegalSection title="1. Datos del vendedor">
        <p>El responsable de la tienda y de la venta de los productos es:</p>
        <SellerDataCard
          rows={[
            { label: "Razón social", value: seller.legalName },
            { label: "CUIT", value: seller.cuit },
            { label: "Domicilio", value: seller.address },
            { label: "Email", value: seller.email },
            { label: "Teléfono", value: seller.phone },
          ]}
        />
      </LegalSection>

      <LegalSection title="2. Uso del sitio">
        <p>
          El usuario se compromete a utilizar el sitio de forma lícita, a
          ingresar datos verídicos y a no realizar acciones que puedan dañar,
          inhabilitar o sobrecargar el servicio. {STORE_NAME} podrá suspender el
          acceso ante usos indebidos o fraudulentos.
        </p>
      </LegalSection>

      <LegalSection title="3. Precios">
        <p>
          Todos los precios se expresan en pesos argentinos (ARS) e incluyen los
          impuestos aplicables, salvo que se indique lo contrario. Los precios y
          la disponibilidad de los productos pueden modificarse sin previo aviso;
          el precio vigente es el exhibido al momento de confirmar la compra.
        </p>
      </LegalSection>

      <LegalSection title="4. Proceso de compra">
        <LegalList
          items={[
            "Seleccionás los productos y los agregás al carrito.",
            "Confirmás los datos de contacto y de envío en el checkout.",
            "Realizás el pago a través de Mercado Pago.",
            "Una vez aprobado el pago, recibís la confirmación del pedido y podés seguir su estado.",
          ]}
        />
        <p>
          La compra se considera perfeccionada cuando el pago es acreditado.
          {" "}
          {STORE_NAME} se reserva el derecho de no procesar o de cancelar
          pedidos ante errores de precio, falta de stock o sospecha de fraude,
          reintegrando en ese caso los importes abonados.
        </p>
      </LegalSection>

      <LegalSection title="5. Medios de pago">
        <p>
          Los pagos se procesan exclusivamente a través de{" "}
          <strong>Mercado Pago</strong>, que actúa como procesador de pagos. Los
          datos de las tarjetas y medios de pago son gestionados por Mercado Pago
          conforme a sus propios términos y políticas de seguridad; {STORE_NAME}{" "}
          no almacena datos completos de tarjetas.
        </p>
      </LegalSection>

      <LegalSection title="6. Envíos">
        <p>
          Realizamos envíos únicamente dentro de la Ciudad Autónoma de Buenos
          Aires (CABA) y el Área Metropolitana de Buenos Aires (AMBA).
        </p>
        <LegalList
          items={[
            "Plazo estimado de entrega: 24 a 72 horas hábiles desde la acreditación del pago.",
            "Los plazos son estimativos y pueden variar por factores logísticos o de fuerza mayor.",
            "Es responsabilidad del comprador informar una dirección y datos de contacto correctos para la entrega.",
          ]}
        />
      </LegalSection>

      <LegalSection title="7. Devoluciones y cambios">
        <p>
          Podés solicitar la devolución o el cambio de un producto dentro de los{" "}
          <strong>10 días corridos</strong> de recibido, conforme a la
          normativa de defensa del consumidor. El producto debe encontrarse sin
          uso y en su empaque original.
        </p>
        <p>
          Para ejercer el derecho de revocación sin expresar motivo, consultá la
          página de{" "}
          <Link
            href="/arrepentimiento"
            className="font-semibold text-brand-deep underline underline-offset-2 hover:text-brand-hover"
          >
            Botón de Arrepentimiento
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="8. Propiedad intelectual">
        <p>
          Todo el contenido del sitio (marca {STORE_NAME}, logotipos, textos,
          diseños, imágenes y código) es propiedad del vendedor o de sus
          licenciantes y está protegido por la legislación vigente. Queda
          prohibida su reproducción o uso sin autorización previa y por escrito.
        </p>
      </LegalSection>

      <LegalSection title="9. Defensa del consumidor">
        <p>
          Las operaciones se rigen por la Ley 24.240 de Defensa del Consumidor.
          Para más información y para realizar reclamos podés acceder al sitio
          oficial:
        </p>
        <p>
          <Link
            href="/defensa-consumidor"
            className="font-semibold text-brand-deep underline underline-offset-2 hover:text-brand-hover"
          >
            Información de Defensa al Consumidor
          </Link>
        </p>
      </LegalSection>

      <LegalSection title="10. Privacidad">
        <p>
          El tratamiento de tus datos personales se describe en nuestra{" "}
          <Link
            href="/privacidad"
            className="font-semibold text-brand-deep underline underline-offset-2 hover:text-brand-hover"
          >
            Política de Privacidad
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="11. Ley aplicable y jurisdicción">
        <p>
          Estos Términos y Condiciones se rigen por las leyes de la República
          Argentina. Ante cualquier controversia serán competentes los
          tribunales ordinarios que correspondan según la normativa de defensa
          del consumidor.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
