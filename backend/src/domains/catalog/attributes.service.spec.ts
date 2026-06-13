import { parseAttributeFilter } from './attributes.service';

test('parseAttributeFilter parses grouped attribute selections', () => {
  expect(parseAttributeFilter('color:negro,azul;material:vidrio')).toEqual([
    { slug: 'color', values: ['negro', 'azul'] },
    { slug: 'material', values: ['vidrio'] },
  ]);
});

test('parseAttributeFilter ignores empty/malformed groups', () => {
  expect(parseAttributeFilter('color:;:vidrio;material:metal,')).toEqual([
    { slug: 'material', values: ['metal'] },
  ]);
});

test('parseAttributeFilter returns an empty list for blank input', () => {
  expect(parseAttributeFilter(undefined)).toEqual([]);
  expect(parseAttributeFilter('')).toEqual([]);
});
