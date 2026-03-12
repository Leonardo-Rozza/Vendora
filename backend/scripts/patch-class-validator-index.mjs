import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const filePath = join(
  process.cwd(),
  'node_modules',
  'class-validator',
  'cjs',
  'index.js',
);

const source = `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSchema = exports.validateSync = exports.validateOrReject = exports.validate = void 0;
exports.ValidateNested = exports.IsUrl = exports.IsString = exports.IsOptional = exports.IsInt = exports.IsIn = exports.IsEnum = exports.IsEmail = exports.IsArray = exports.Min = exports.Matches = exports.MaxLength = exports.Length = exports.ArrayMinSize = void 0;
const MetadataStorage_1 = require("./metadata/MetadataStorage");
const Validator_1 = require("./validation/Validator");
const container_1 = require("./container");
var ArrayMinSize_1 = require("./decorator/array/ArrayMinSize");
Object.defineProperty(exports, "ArrayMinSize", { enumerable: true, get: function () { return ArrayMinSize_1.ArrayMinSize; } });
var IsOptional_1 = require("./decorator/common/IsOptional");
Object.defineProperty(exports, "IsOptional", { enumerable: true, get: function () { return IsOptional_1.IsOptional; } });
var IsIn_1 = require("./decorator/common/IsIn");
Object.defineProperty(exports, "IsIn", { enumerable: true, get: function () { return IsIn_1.IsIn; } });
var ValidateNested_1 = require("./decorator/common/ValidateNested");
Object.defineProperty(exports, "ValidateNested", { enumerable: true, get: function () { return ValidateNested_1.ValidateNested; } });
var Min_1 = require("./decorator/number/Min");
Object.defineProperty(exports, "Min", { enumerable: true, get: function () { return Min_1.Min; } });
var IsArray_1 = require("./decorator/typechecker/IsArray");
Object.defineProperty(exports, "IsArray", { enumerable: true, get: function () { return IsArray_1.IsArray; } });
var IsEnum_1 = require("./decorator/typechecker/IsEnum");
Object.defineProperty(exports, "IsEnum", { enumerable: true, get: function () { return IsEnum_1.IsEnum; } });
var IsInt_1 = require("./decorator/typechecker/IsInt");
Object.defineProperty(exports, "IsInt", { enumerable: true, get: function () { return IsInt_1.IsInt; } });
var IsString_1 = require("./decorator/typechecker/IsString");
Object.defineProperty(exports, "IsString", { enumerable: true, get: function () { return IsString_1.IsString; } });
var IsEmail_1 = require("./decorator/string/IsEmail");
Object.defineProperty(exports, "IsEmail", { enumerable: true, get: function () { return IsEmail_1.IsEmail; } });
var IsUrl_1 = require("./decorator/string/IsUrl");
Object.defineProperty(exports, "IsUrl", { enumerable: true, get: function () { return IsUrl_1.IsUrl; } });
var Length_1 = require("./decorator/string/Length");
Object.defineProperty(exports, "Length", { enumerable: true, get: function () { return Length_1.Length; } });
var Matches_1 = require("./decorator/string/Matches");
Object.defineProperty(exports, "Matches", { enumerable: true, get: function () { return Matches_1.Matches; } });
var MaxLength_1 = require("./decorator/string/MaxLength");
Object.defineProperty(exports, "MaxLength", { enumerable: true, get: function () { return MaxLength_1.MaxLength; } });
function validate(schemaNameOrObject, objectOrValidationOptions, maybeValidatorOptions) {
  if (typeof schemaNameOrObject === 'string') {
    return (0, container_1.getFromContainer)(Validator_1.Validator).validate(schemaNameOrObject, objectOrValidationOptions, maybeValidatorOptions);
  }

  return (0, container_1.getFromContainer)(Validator_1.Validator).validate(schemaNameOrObject, objectOrValidationOptions);
}
exports.validate = validate;
function validateOrReject(schemaNameOrObject, objectOrValidationOptions, maybeValidatorOptions) {
  if (typeof schemaNameOrObject === 'string') {
    return (0, container_1.getFromContainer)(Validator_1.Validator).validateOrReject(schemaNameOrObject, objectOrValidationOptions, maybeValidatorOptions);
  }

  return (0, container_1.getFromContainer)(Validator_1.Validator).validateOrReject(schemaNameOrObject, objectOrValidationOptions);
}
exports.validateOrReject = validateOrReject;
function validateSync(schemaNameOrObject, objectOrValidationOptions, maybeValidatorOptions) {
  if (typeof schemaNameOrObject === 'string') {
    return (0, container_1.getFromContainer)(Validator_1.Validator).validateSync(schemaNameOrObject, objectOrValidationOptions, maybeValidatorOptions);
  }

  return (0, container_1.getFromContainer)(Validator_1.Validator).validateSync(schemaNameOrObject, objectOrValidationOptions);
}
exports.validateSync = validateSync;
function registerSchema(schema) {
  (0, MetadataStorage_1.getMetadataStorage)().addValidationSchema(schema);
}
exports.registerSchema = registerSchema;
`;

writeFileSync(filePath, source);
