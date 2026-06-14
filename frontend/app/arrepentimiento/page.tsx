import type { Metadata } from "next";
import {
  LegalList,
  LegalPage,
  LegalSection,
  SellerDataCard,
} from "@/components/legal/legal-page";
import { seller, STORE_NAME } from "@/lib/legal/seller";

export const metadata: Metadata = {
  title: `Botón de Arrepentimiento · ${STORE_NAME}`,
  description:
    "Ejercé tu derecho de arrepentimiento: cancelá una compra dentro de los 10 días corridos, sin costo, conforme a la Resolución 424/2020 de la Secretaría de Comercio Interior.",
};

export default function ArrepentimientoPage() {
  return (
    <LegalPage
      eyebrow="Resolución 424/2020"
      title="Botón de Arrepentimiento"
      intro={
        <>
          Tenés derecho a arrepentirte de tu compra y cancelarla dentro de los{" "}
          <strong>10 días corridos</strong> contados desde la entrega del
          producto o desde la celebración del contrato (lo que ocurra después),
          sin necesidad de expresar el motivo y <strong>sin costo alguno</strong>
          . Este derecho está garantizado por la Resolución 424/2020 de la
          Secretaría de Comercio Interior y la Ley 24.240 de Defensa del
          Consumidor.
        </>
      }
    >
      <LegalSection title="¿Cómo funciona?">
        <LegalList
          items={[
            "El plazo para arrepentirte es de 10 días corridos desde que recibís el producto o desde la celebración del contrato.",
            "Ejercer este derecho no tiene ningún costo para vos.",
            "Si pagaste, te reintegraremos el importe abonado en las condiciones previstas por la normativa.",
            "El producto debe estar sin uso y en su empaque original para poder devolverlo.",
          ]}
        />
      </LegalSection>

      <LegalSection title="Datos del pedido que tenés que informar">
        <p>
          Para gestionar tu arrepentimiento de la forma más rápida posible,
          incluí en tu solicitud:
        </p>
        <LegalList
          items={[
            "Número de pedido.",
            "Nombre y apellido del comprador.",
            "Email utilizado en la compra.",
            "Producto/s que querés cancelar o devolver.",
            "Motivo (opcional: no es obligatorio para ejercer el derecho).",
          ]}
        />
      </LegalSection>

      <LegalSection title="¿Cómo solicitarlo?">
        <p>
          Enviá tu solicitud de arrepentimiento por correo electrónico a la
          siguiente dirección, o comunicate por teléfono. Vas a recibir una
          confirmación de la recepción de tu pedido.
        </p>
        <SellerDataCard
          rows={[
            { label: "Email", value: seller.email },
            { label: "Teléfono", value: seller.phone },
            { label: "Razón social", value: seller.legalName },
            { label: "Domicilio", value: seller.address },
          ]}
        />
        <p className="text-[13px] text-ink-soft">
          Importante: el ejercicio del derecho de arrepentimiento es gratuito.
          Una vez recibida tu solicitud en tiempo y forma, gestionaremos la
          cancelación y el reintegro correspondiente.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
