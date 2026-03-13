import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const filePath = join(process.cwd(), 'node_modules', '@nestjs', 'core', 'index.js');
const serializedGraphPath = join(
  process.cwd(),
  'node_modules',
  '@nestjs',
  'core',
  'inspector',
  'serialized-graph.js',
);

const source = `"use strict";
require("reflect-metadata");

const { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } = require("./constants");
const { NestFactory } = require("./nest-factory");

module.exports = {
  APP_FILTER,
  APP_GUARD,
  APP_INTERCEPTOR,
  APP_PIPE,
  NestFactory,
};
`;

writeFileSync(filePath, source);

const serializedGraphSource = `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SerializedGraph = void 0;

class SerializedGraph {
  constructor() {
    this.nodes = new Map();
    this.edges = new Map();
    this.entrypoints = new Map();
    this.extras = {
      orphanedEnhancers: [],
      attachedEnhancers: [],
    };
    this._status = 'complete';
  }

  set status(status) {
    this._status = status;
  }

  set metadata(metadata) {
    this._metadata = metadata;
  }

  insertNode(nodeDefinition) {
    if (this.nodes.has(nodeDefinition.id)) {
      return this.nodes.get(nodeDefinition.id);
    }

    this.nodes.set(nodeDefinition.id, nodeDefinition);
    return nodeDefinition;
  }

  insertEdge(edgeDefinition) {
    const id =
      edgeDefinition.id ??
      edgeDefinition.source + '_' + edgeDefinition.target + '_' + this.edges.size;
    const edge = {
      ...edgeDefinition,
      id,
    };

    this.edges.set(id, edge);
    return edge;
  }

  insertEntrypoint(definition, parentId) {
    const existing = this.entrypoints.get(parentId);
    if (existing) {
      existing.push(definition);
      return;
    }

    this.entrypoints.set(parentId, [definition]);
  }

  insertOrphanedEnhancer(entry) {
    this.extras.orphanedEnhancers.push(entry);
  }

  insertAttachedEnhancer(nodeId) {
    this.extras.attachedEnhancers.push({ nodeId });
  }

  getNodeById(id) {
    return this.nodes.get(id);
  }

  toJSON() {
    const json = {
      nodes: Object.fromEntries(this.nodes),
      edges: Object.fromEntries(this.edges),
      entrypoints: Object.fromEntries(this.entrypoints),
      extras: this.extras,
    };

    if (this._status) {
      json.status = this._status;
    }

    if (this._metadata) {
      json.metadata = this._metadata;
    }

    return json;
  }

  toString() {
    return JSON.stringify(this.toJSON(), null, 2);
  }
}

SerializedGraph.INTERNAL_PROVIDERS = [];
exports.SerializedGraph = SerializedGraph;
`;

writeFileSync(serializedGraphPath, serializedGraphSource);
