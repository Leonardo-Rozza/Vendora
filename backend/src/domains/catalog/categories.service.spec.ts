import { buildCategoryTree, collectBranchIds } from './categories.service';

const CATEGORIES = [
  {
    id: 'electronica',
    name: 'Electrónica',
    slug: 'electronica',
    parentId: null,
    sortOrder: 0,
  },
  {
    id: 'audio',
    name: 'Audio',
    slug: 'audio',
    parentId: 'electronica',
    sortOrder: 0,
  },
  {
    id: 'auriculares',
    name: 'Auriculares',
    slug: 'auriculares',
    parentId: 'audio',
    sortOrder: 0,
  },
  { id: 'hogar', name: 'Hogar', slug: 'hogar', parentId: null, sortOrder: 1 },
];

test('buildCategoryTree nests children under their parents', () => {
  const tree = buildCategoryTree(CATEGORIES);

  expect(tree.map((node) => node.slug)).toEqual(['electronica', 'hogar']);
  const electronica = tree.find((node) => node.slug === 'electronica');
  expect(electronica?.children.map((child) => child.slug)).toEqual(['audio']);
  expect(electronica?.children[0]?.children.map((child) => child.slug)).toEqual(
    ['auriculares'],
  );
});

test('collectBranchIds returns the category and all its descendants', () => {
  expect(collectBranchIds(CATEGORIES, 'electronica').sort()).toEqual(
    ['audio', 'auriculares', 'electronica'].sort(),
  );
  expect(collectBranchIds(CATEGORIES, 'audio').sort()).toEqual(
    ['audio', 'auriculares'].sort(),
  );
  expect(collectBranchIds(CATEGORIES, 'hogar')).toEqual(['hogar']);
});

test('collectBranchIds returns an empty list for an unknown slug', () => {
  expect(collectBranchIds(CATEGORIES, 'inexistente')).toEqual([]);
});
