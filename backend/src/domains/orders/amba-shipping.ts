const CABA_PROVINCES = new Set([
  'caba',
  'capital federal',
  'ciudad autonoma de buenos aires',
  'ciudad autónoma de buenos aires',
  'buenos aires city',
]);

const AMBA_LOCALITIES = new Set([
  'almirante brown',
  'avellaneda',
  'berazategui',
  'esteban echeverria',
  'esteban echeverría',
  'ezeiza',
  'florencio varela',
  'general san martin',
  'general san martín',
  'hurlingham',
  'ituzaingo',
  'ituzaingó',
  'jose c paz',
  'josé c paz',
  'la matanza',
  'lanus',
  'lanús',
  'lomas de zamora',
  'malvinas argentinas',
  'merlo',
  'moreno',
  'moron',
  'morón',
  'pilar',
  'quilmes',
  'san fernando',
  'san isidro',
  'san martin',
  'san martín',
  'san miguel',
  'tigre',
  'tres de febrero',
  'vicente lopez',
  'vicente lópez',
]);

export function isWithinAmbaShippingScope(input: {
  locality: string;
  province: string;
}) {
  const province = normalizeValue(input.province);
  const locality = normalizeValue(input.locality);

  if (!province || !locality) {
    return false;
  }

  if (CABA_PROVINCES.has(province)) {
    return true;
  }

  return province === 'buenos aires' && AMBA_LOCALITIES.has(locality);
}

function normalizeValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}
