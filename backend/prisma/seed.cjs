/* Foundational reference data (categories, attributes, coupon). Idempotent.
 * Wired as `prisma db seed`. These used to live inside migrations (an
 * anti-pattern); they belong in a seed. Demo products live in seed-demo.cjs. */
const { PrismaClient } = require('@prisma/client');

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

async function seedFoundations(prisma) {
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

module.exports = { seedFoundations };

if (require.main === module) {
  const prisma = new PrismaClient();
  seedFoundations(prisma)
    .then(() => console.log('Seeded foundational data (categories, attributes, coupon).'))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
