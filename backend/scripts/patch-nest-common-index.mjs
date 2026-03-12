import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const filePath = join(process.cwd(), 'node_modules', '@nestjs', 'common', 'index.js');

const source = readFileSync(filePath, 'utf8');
const next = source
  .replace('tslib_1.__exportStar(require("./pipes"), exports);\n', '')
  .replace('tslib_1.__exportStar(require("./serializer"), exports);\n', '');

if (next !== source) {
  writeFileSync(filePath, next);
}
