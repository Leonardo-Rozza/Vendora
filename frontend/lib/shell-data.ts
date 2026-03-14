import type {
  AdminWorkspace,
  CatalogProductDetail,
  StorefrontHighlight,
} from "@/lib/contracts";

export const storefrontHighlights: StorefrontHighlight[] = [
  {
    title: "Catalog browsing",
    description: "Structured collection rails and editorial spots ready for product APIs.",
    href: "#catalog",
  },
  {
    title: "Product detail",
    description: "Variant-aware cards mirror the backend catalog shape without hiding business rules in the UI.",
    href: "#featured-products",
  },
  {
    title: "Checkout entry",
    description: "A clear handoff area marks where Mercado Pago checkout will attach in later phases.",
    href: "#checkout-entry",
  },
];

export const featuredProducts: CatalogProductDetail[] = [
  {
    id: "foundation-speaker",
    slug: "aurora-portable-speaker",
    name: "Aurora Portable Speaker",
    description: "Compact room-to-room audio with weather-ready casing and variant-led stock tracking.",
    status: "draft-foundation",
    category: "ELECTRONICA",
    variants: [
      {
        id: "aurora-onyx",
        sku: "AUR-ONX-01",
        name: "Onyx",
        priceAmount: "129900",
        currencyCode: "ARS",
      },
      {
        id: "aurora-sand",
        sku: "AUR-SND-01",
        name: "Sand",
        priceAmount: "129900",
        currencyCode: "ARS",
      },
    ],
    images: [
      {
        id: "aurora-image",
        assetUrl: "https://res.cloudinary.com/demo/image/upload/v1/vendora/aurora-speaker",
        assetKey: "vendora/aurora-speaker",
        altText: "Aurora portable speaker in neutral finish",
        sortOrder: 0,
      },
    ],
  },
  {
    id: "foundation-lamp",
    slug: "halo-desk-lamp",
    name: "Halo Desk Lamp",
    description: "A warm-light workspace accent that signals future home gadget merchandising.",
    status: "draft-foundation",
    category: "HOGAR",
    variants: [
      {
        id: "halo-brass",
        sku: "HAL-BRS-01",
        name: "Brass",
        priceAmount: "84900",
        currencyCode: "ARS",
      },
    ],
    images: [
      {
        id: "halo-image",
        assetUrl: "https://res.cloudinary.com/demo/image/upload/v1/vendora/halo-lamp",
        assetKey: "vendora/halo-lamp",
        altText: "Halo desk lamp with brushed brass base",
        sortOrder: 0,
      },
    ],
  },
  {
    id: "foundation-kettle",
    slug: "pulse-smart-kettle",
    name: "Pulse Smart Kettle",
    description: "Kitchen hardware placeholder for future inventory, media, and order seams.",
    status: "draft-foundation",
    category: "HOGAR",
    variants: [
      {
        id: "pulse-matte",
        sku: "PLS-MTT-01",
        name: "Matte Black",
        priceAmount: "99900",
        currencyCode: "ARS",
      },
    ],
    images: [
      {
        id: "pulse-image",
        assetUrl: "https://res.cloudinary.com/demo/image/upload/v1/vendora/pulse-kettle",
        assetKey: "vendora/pulse-kettle",
        altText: "Pulse smart kettle in matte black",
        sortOrder: 0,
      },
    ],
  },
];

export const adminWorkspaces: AdminWorkspace[] = [
  {
    title: "Catalog",
    description: "Products, variants, and merchandising metadata land here once CRUD flows arrive.",
    status: "Structure ready",
  },
  {
    title: "Media",
    description: "Cloudinary-backed image references and upload signatures stay isolated from binary storage concerns.",
    status: "Provider seam ready",
  },
  {
    title: "Inventory",
    description: "Variant-level stock and reservation visibility will connect here without leaking into payments.",
    status: "Domain seam ready",
  },
  {
    title: "Orders",
    description: "Operational monitoring for status, paid-order locking, and webhook outcomes belongs in this workspace.",
    status: "Payment boundary ready",
  },
];
