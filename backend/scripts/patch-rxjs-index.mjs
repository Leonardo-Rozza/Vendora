import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const rxjsIndexPath = join(
  process.cwd(),
  'node_modules',
  'rxjs',
  'dist',
  'cjs',
  'index.js',
);

const operatorsIndexPath = join(
  process.cwd(),
  'node_modules',
  'rxjs',
  'dist',
  'cjs',
  'operators',
  'index.js',
);

const rxjsIndexSource = `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

const { Observable } = require("./internal/Observable");
const { Subject } = require("./internal/Subject");
const { ReplaySubject } = require("./internal/ReplaySubject");
const { defer } = require("./internal/observable/defer");
const { from } = require("./internal/observable/from");
const { EMPTY } = require("./internal/observable/empty");
const { isObservable } = require("./internal/util/isObservable");
const { lastValueFrom } = require("./internal/lastValueFrom");

module.exports = {
  Observable,
  Subject,
  ReplaySubject,
  defer,
  from,
  EMPTY,
  isObservable,
  lastValueFrom,
};
`;

const operatorsIndexSource = `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

const { mergeAll } = require("../internal/operators/mergeAll");
const { switchMap } = require("../internal/operators/switchMap");
const { map } = require("../internal/operators/map");
const { concatMap } = require("../internal/operators/concatMap");
const { catchError } = require("../internal/operators/catchError");

module.exports = {
  mergeAll,
  switchMap,
  map,
  concatMap,
  catchError,
};
`;

writeFileSync(rxjsIndexPath, rxjsIndexSource);
writeFileSync(operatorsIndexPath, operatorsIndexSource);
