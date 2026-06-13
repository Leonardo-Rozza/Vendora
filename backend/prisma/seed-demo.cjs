/* Local demo seed: foundational data (from seed.cjs) + demo products.
 * Idempotent (upsert by slug). For local development only. */
const { PrismaClient } = require('@prisma/client');
const { seedFoundations } = require('./seed.cjs');

const prisma = new PrismaClient();

const img = (publicId) =>
  `https://res.cloudinary.com/demo/image/upload/w_800,h_800,c_fill/${publicId}.jpg`;

const PRODUCTS = [
  {
    slug: 'auriculares-aurora',
    name: 'Auriculares Aurora',
    description: 'Auriculares inalámbricos con cancelación de ruido y 30h de batería.',
    categoryId: 'cat_audio',
    image: 'cld-sample',
    attrs: ['attrv_color_negro', 'attrv_color_blanco'],
    variants: [
      { sku: 'AUR-NEG', name: 'Negro', price: '129900', qty: 8 },
      { sku: 'AUR-BLA', name: 'Blanco', price: '129900', qty: 4 },
    ],
  },
  {
    slug: 'parlante-halo',
    name: 'Parlante Halo',
    description: 'Parlante portátil resistente al agua con sonido 360°.',
    categoryId: 'cat_audio',
    image: 'cld-sample-2',
    attrs: ['attrv_color_azul'],
    variants: [{ sku: 'HAL-AZ', name: 'Azul', price: '84900', qty: 12 }],
  },
  {
    slug: 'lampara-solina',
    name: 'Lámpara Solina',
    description: 'Lámpara de mesa de madera con luz cálida regulable.',
    categoryId: 'cat_hogar',
    image: 'cld-sample-3',
    attrs: ['attrv_material_madera'],
    variants: [{ sku: 'SOL-1', name: 'Estándar', price: '59900', qty: 6 }],
  },
  {
    slug: 'mate-imperial',
    name: 'Mate Imperial',
    description: 'Mate de acero con base antideslizante y terminación premium.',
    categoryId: 'cat_hogar',
    image: 'cld-sample-4',
    attrs: ['attrv_material_metal'],
    variants: [{ sku: 'MAT-1', name: 'Acero', price: '34900', qty: 20 }],
  },
  {
    slug: 'mochila-trek',
    name: 'Mochila Trek',
    description: 'Mochila urbana 22L con compartimento acolchado para notebook.',
    categoryId: 'cat_accesorios',
    image: 'cld-sample-5',
    attrs: ['attrv_color_negro'],
    variants: [{ sku: 'TRK-NEG', name: 'Negro', price: '74900', qty: 0 }],
  },
  {
    slug: 'botella-vidrio',
    name: 'Botella de Vidrio',
    description: 'Botella reutilizable de vidrio borosilicato con funda de silicona.',
    categoryId: 'cat_accesorios',
    image: 'sample',
    attrs: ['attrv_material_vidrio'],
    variants: [{ sku: 'BOT-1', name: '750ml', price: '18900', qty: 30 }],
  },
];

async function main() {
  await seedFoundations(prisma);

  for (const p of PRODUCTS) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: { status: 'ACTIVE' },
      create: {
        slug: p.slug,
        name: p.name,
        description: p.description,
        status: 'ACTIVE',
        categoryId: p.categoryId,
        images: {
          create: [{ assetUrl: img(p.image), altText: p.name, sortOrder: 0 }],
        },
        attributeValues: {
          create: p.attrs.map((attributeValueId) => ({ attributeValueId })),
        },
        variants: {
          create: p.variants.map((v) => ({
            sku: v.sku,
            name: v.name,
            priceAmount: v.price,
            currencyCode: 'ARS',
            inventoryItem: { create: { availableQuantity: v.qty } },
          })),
        },
      },
    });
  }

  console.log(`Seeded foundational data + ${PRODUCTS.length} demo products.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
