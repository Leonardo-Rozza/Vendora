/**
 * Datos del vendedor usados en las páginas legales (Términos, Privacidad,
 * Botón de Arrepentimiento, Defensa al Consumidor).
 *
 * Centralizamos estos datos en un único lugar para que se completen una sola
 * vez. Mientras no tengamos la información real, dejamos placeholders bien
 * visibles con la sintaxis {{...}}.
 *
 * TODO: completar con datos reales del vendedor.
 */
export interface SellerLegalInfo {
  /** Razón social / nombre legal de la empresa o persona responsable. */
  legalName: string;
  /** CUIT/CUIL del vendedor. */
  cuit: string;
  /** Domicilio legal/comercial. */
  address: string;
  /** Email de contacto para consultas legales, datos y arrepentimiento. */
  email: string;
  /** Teléfono de contacto. */
  phone: string;
}

// TODO: completar con datos reales del vendedor.
export const seller: SellerLegalInfo = {
  legalName: "{{RAZÓN SOCIAL}}",
  cuit: "{{CUIT}}",
  address: "{{DOMICILIO}}",
  email: "{{EMAIL DE CONTACTO}}",
  phone: "{{TELÉFONO}}",
};

/** Nombre comercial de la tienda (no es un placeholder: marca conocida). */
export const STORE_NAME = "Vendora";
