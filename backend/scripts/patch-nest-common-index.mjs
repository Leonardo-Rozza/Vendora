import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const commonIndexPath = join(
  process.cwd(),
  'node_modules',
  '@nestjs',
  'common',
  'index.js',
);

const interfacesIndexPath = join(
  process.cwd(),
  'node_modules',
  '@nestjs',
  'common',
  'interfaces',
  'index.js',
);

const commonIndexSource = `"use strict";
require("reflect-metadata");

const { Scope } = require("./interfaces/scope-options.interface");
const { VERSION_NEUTRAL } = require("./interfaces/version-options.interface");
const { RequestMethod } = require("./enums/request-method.enum");
const { HttpStatus } = require("./enums/http-status.enum");
const { ShutdownSignal } = require("./enums/shutdown-signal.enum");
const { VersioningType } = require("./enums/version-type.enum");
const { Injectable, mixin } = require("./decorators/core/injectable.decorator");
const { Controller } = require("./decorators/core/controller.decorator");
const { Inject } = require("./decorators/core/inject.decorator");
const { Optional } = require("./decorators/core/optional.decorator");
const { SetMetadata } = require("./decorators/core/set-metadata.decorator");
const { Global } = require("./decorators/modules/global.decorator");
const { Module } = require("./decorators/modules/module.decorator");
const { Get, Post, Put, Patch, Delete, Head, Options, All } = require("./decorators/http/request-mapping.decorator");
const { Body, Query, Param, Headers, Req, Res, UploadedFile, UploadedFiles } = require("./decorators/http/route-params.decorator");
const { StreamableFile } = require("./file-stream/streamable-file");
const { ConsoleLogger } = require("./services/console-logger.service");
const { Logger } = require("./services/logger.service");
const { flatten } = require("./decorators/core/dependencies.decorator");
const { HttpException } = require("./exceptions/http.exception");
const { IntrinsicException } = require("./exceptions/intrinsic.exception");
const { BadGatewayException } = require("./exceptions/bad-gateway.exception");
const { BadRequestException } = require("./exceptions/bad-request.exception");
const { ConflictException } = require("./exceptions/conflict.exception");
const { ForbiddenException } = require("./exceptions/forbidden.exception");
const { InternalServerErrorException } = require("./exceptions/internal-server-error.exception");
const { NotFoundException } = require("./exceptions/not-found.exception");
const { PayloadTooLargeException } = require("./exceptions/payload-too-large.exception");

module.exports = {
  Scope,
  VERSION_NEUTRAL,
  RequestMethod,
  HttpStatus,
  ShutdownSignal,
  VersioningType,
  Injectable,
  mixin,
  Controller,
  Inject,
  Optional,
  SetMetadata,
  Global,
  Module,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Head,
  Options,
  All,
  Body,
  Query,
  Param,
  Headers,
  Req,
  Res,
  UploadedFile,
  UploadedFiles,
  StreamableFile,
  ConsoleLogger,
  Logger,
  flatten,
  HttpException,
  IntrinsicException,
  BadGatewayException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  PayloadTooLargeException,
};
`;

const interfacesIndexSource = `"use strict";

const { Scope } = require("./scope-options.interface");
const { VERSION_NEUTRAL } = require("./version-options.interface");

module.exports = {
  Scope,
  VERSION_NEUTRAL,
};
`;

writeFileSync(commonIndexPath, commonIndexSource);
writeFileSync(interfacesIndexPath, interfacesIndexSource);
