import type { StandardSchemaV1 } from "@standard-schema/spec";

/**
 * Environment for rendering an artifact inside an output-format frame
 * (e.g. an iframe hosting generated HTML).
 */
export interface FrameEnv {
  /** URLs/paths injected as `<script src>` into the frame iframe. */
  scripts: string[];
  /** CSS URLs/paths injected as `<link>`. */
  styles: string[];
  /** Inline `<style>` content appended to the reset. */
  inlineCss?: string;
  /** HTML attributes on the frame root, e.g. `data-theme`. */
  attrs?: Record<string, string>;
  /** Default frame background. Defaults to `"white"`. */
  bodyBackground?: string;
  /** Whether frame animations are allowed. Defaults to `"none"`. */
  animations: "none" | "allow";
  /** Allow per-frame `customCss` injection. Defaults to `false`. */
  customCssPassthrough: boolean;
}

/**
 * Output-format definition. `outputSchema` is a type-only Standard Schema
 * slot — validation runs through `~standard.validate`, so this package
 * stays dependency-free while any schema library (zod, valibot, arktype)
 * can supply the contract.
 */
export interface FormatDef {
  /** Unique format id, e.g. `"html-tailwind"`. */
  id: string;
  /** Profile-of another format id; env fields merge parent-first. */
  extends?: string;
  /** Validates the artifact payload (frame HTML string). */
  outputSchema?: StandardSchemaV1;
  /** Shallow partial; `resolveFormatEnv` applies defaults. */
  frameEnv: Partial<FrameEnv>;
  /** Stage name → prompt text. */
  promptSnippets?: Record<string, string>;
  /** Exporter ids supported by this format. */
  exporters?: string[];
}

export interface FormatRegistry {
  register(def: FormatDef): void;
  get(id: string): FormatDef | undefined;
  has(id: string): boolean;
  list(): FormatDef[];
}

export const createFormatRegistry = (defs: FormatDef[] = []): FormatRegistry => {
  const map = new Map<string, FormatDef>(defs.map((d) => [d.id, d]));
  return {
    register: (def) => map.set(def.id, def),
    get: (id) => map.get(id),
    has: (id) => map.has(id),
    list: () => [...map.values()],
  };
};

const ENV_DEFAULTS: FrameEnv = {
  scripts: [],
  styles: [],
  bodyBackground: "white",
  animations: "none",
  customCssPassthrough: false,
};

/**
 * Field-wise merge of two frame envs: arrays are replaced (not concat) by
 * the child, scalars are overridden by the child, and `undefined` child
 * fields keep the parent value.
 */
export const mergeFormatEnvs = (
  parent: Partial<FrameEnv>,
  child: Partial<FrameEnv>,
): Partial<FrameEnv> => {
  const merged: Partial<FrameEnv> = {};
  const assign = <K extends keyof FrameEnv>(key: K, value: FrameEnv[K] | undefined): void => {
    if (value !== undefined) merged[key] = value;
  };
  assign("scripts", child.scripts ?? parent.scripts);
  assign("styles", child.styles ?? parent.styles);
  assign("inlineCss", child.inlineCss ?? parent.inlineCss);
  if (parent.attrs || child.attrs) {
    merged.attrs = { ...parent.attrs, ...child.attrs };
  }
  assign("bodyBackground", child.bodyBackground ?? parent.bodyBackground);
  assign("animations", child.animations ?? parent.animations);
  assign("customCssPassthrough", child.customCssPassthrough ?? parent.customCssPassthrough);
  return merged;
};

/**
 * Resolve a format id into a full `FrameEnv`: the `extends` chain is walked
 * parent-first, envs merged field-wise, and defaults applied last. Cycles
 * and unknown parents throw.
 */
export const resolveFormatEnv = (registry: FormatRegistry, id: string): FrameEnv => {
  const chain = resolveExtendsChain(registry, id);

  let env: Partial<FrameEnv> = {};
  for (const def of chain.reverse()) {
    env = mergeFormatEnvs(env, def.frameEnv);
  }
  return { ...ENV_DEFAULTS, ...env, attrs: env.attrs ?? {} };
};

/**
 * Resolve the `exporters` for a format id: the leaf's own list when set,
 * otherwise the first list found walking the `extends` chain toward the
 * root. Unknown formats (or chains without any exporters) return undefined.
 */
export const resolveFormatExporters = (
  registry: FormatRegistry,
  id: string,
): string[] | undefined => {
  const chain = resolveExtendsChainLenient(registry, id);
  if (!chain) return undefined;
  return chain.find((def) => def.exporters !== undefined)?.exporters;
};

/**
 * Walk the `extends` chain of `id`, leaf-first. Throws on unknown formats
 * and on cycles.
 */
const resolveExtendsChain = (registry: FormatRegistry, id: string): FormatDef[] => {
  const chain: FormatDef[] = [];
  const seen = new Set<string>();
  let current: string | undefined = id;
  while (current) {
    if (seen.has(current)) {
      throw new Error(`format "${id}": extends cycle detected at "${current}"`);
    }
    seen.add(current);
    const def = registry.get(current);
    if (!def) {
      const path = chain.map((d) => d.id).reverse();
      throw new Error(
        `format "${id}": unknown ${chain.length === 0 ? "format" : `parent (chain: ${path.join(" -> ")})`} "${current}"`,
      );
    }
    chain.push(def);
    current = def.extends;
  }
  return chain;
};

/**
 * Like `resolveExtendsChain` but returns null instead of throwing when the
 * chain is broken (unknown parent or cycle).
 */
const resolveExtendsChainLenient = (registry: FormatRegistry, id: string): FormatDef[] | null => {
  try {
    return resolveExtendsChain(registry, id);
  } catch {
    return null;
  }
};
