/**
 * BDFA Financial Engine Index
 *
 * This barrel module will eventually centralize exports for BDFA financial
 * engine architecture modules. Future screens should be able to consume the
 * Unified Financial Model, source-data adapters, validators, planning engine,
 * and derived output contracts from this single import surface.
 *
 * This file intentionally only re-exports existing architectural modules.
 * It contains no calculations, mock data, DOM access, or application wiring.
 */

export * from './planning-engine.js';
export * from './unified-financial-model.js';
export * from './source-data-adapters.js';
export * from './financial-model-validator.js';
export * from './derived-output-contracts.js';
export * from './mock-data-bridge.js';
export * from './unified-model-builder.js';
export * from './financial-engine-pipeline.js';
export * from './planning-state.js';
export * from './financial-truth-engine.js';
