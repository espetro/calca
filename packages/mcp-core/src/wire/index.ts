import type { Command } from "@calca/canvas-base";

/**
 * Wire DSL — SCAFFOLD ONLY.
 *
 * `wire` is the compact, ID-anchored node-tree format agents emit instead
 * of HTML (~0.13× the tokens of Tailwind HTML). The op schema, grammar,
 * and compiler land in Phase 3 (issue #41); these signatures pin the API
 * surface so `@calca/mcp` can wire its plumbing now.
 */

/** Parsed Wire document: an ordered tree of ID'd nodes. Shape TBD in Phase 3. */
export interface WireDocument {
  readonly nodes: readonly unknown[];
}

/** Parse `wire` source into a document. Not implemented until Phase 3. */
export const parseWire = (_source: string): WireDocument => {
  throw new Error("parseWire is not implemented — Wire compiler lands in Phase 3 (#41)");
};

/** Print a Wire document back to source. Not implemented until Phase 3. */
export const printWire = (_doc: WireDocument): string => {
  throw new Error("printWire is not implemented — Wire compiler lands in Phase 3 (#41)");
};

/** Compile a Wire document into canvas commands. Not implemented until Phase 3. */
export const compileWire = (_doc: WireDocument): Command[] => {
  throw new Error("compileWire is not implemented — Wire compiler lands in Phase 3 (#41)");
};
