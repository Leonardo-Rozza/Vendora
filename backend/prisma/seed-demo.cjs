/* Demo product seed for the local stack. Idempotent (upsert by slug).
 * Categories / attributes / coupon are already seeded by the migrations. */
const { PrismaClient } = require('@prisma/client');

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

const CATEGORIES = [
  { id: 'cat_electronica', name: 'Electrónica', slug: 'electronica', parentId: null, sortOrder: 0 },
  { id: 'cat_audio', name: 'Audio', slug: 'audio', parentId: 'cat_electronica', sortOrder: 0 },
  { id: 'cat_hogar', name: 'Hogar', slug: 'hogar', parentId: null, sortOrder: 1 },
  { id: 'cat_accesorios', name: 'Accesorios', slug: 'accesorios', parentId: null, sortOrder: 2 },
];

const ATTRIBUTES = [
  {
    id: 'attr_color',
    name: 'Color',
    slug: 'color',
    values: [
      { id: 'attrv_color_negro', value: 'Negro', slug: 'negro' },
      { id: 'attrv_color_blanco', value: 'Blanco', slug: 'blanco' },
      { id: 'attrv_color_azul', value: 'Azul', slug: 'azul' },
    ],
  },
  {
    id: 'attr_material',
    name: 'Material',
    slug: 'material',
    values: [
      { id: 'attrv_material_vidrio', value: 'Vidrio', slug: 'vidrio' },
      { id: 'attrv_material_metal', value: 'Metal', slug: 'metal' },
      { id: 'attrv_material_madera', value: 'Madera', slug: 'madera' },
    ],
  },
];

async function seedFoundations() {
  // Categories (parents before children).
  for (const c of CATEGORIES) {
    await prisma.category.upsert({
      where: { id: c.id },
      update: { name: c.name, slug: c.slug, parentId: c.parentId, sortOrder: c.sortOrder },
      create: c,
    });
  }

  for (const attr of ATTRIBUTES) {
    await prisma.attribute.upsert({
      where: { id: attr.id },
      update: { name: attr.name, slug: attr.slug },
      create: { id: attr.id, name: attr.name, slug: attr.slug },
    });
    for (const v of attr.values) {
      await prisma.attributeValue.upsert({
        where: { id: v.id },
        update: { value: v.value, slug: v.slug },
        create: { id: v.id, attributeId: attr.id, value: v.value, slug: v.slug },
      });
    }
  }

  await prisma.coupon.upsert({
    where: { code: 'BIENVENIDA10' },
    update: {},
    create: {
      code: 'BIENVENIDA10',
      type: 'PERCENTAGE',
      value: '10',
      minSubtotalAmount: '0',
      isActive: true,
    },
  });
}

async function main() {
  await seedFoundations();

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

  console.log(`Seeded ${PRODUCTS.length} demo products.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
