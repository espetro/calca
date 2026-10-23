/**
 * Format seam — format definitions, registry, frame-env resolution, and
 * declarative manifest parsing. Zero runtime dependencies.
 */
export type { FrameEnv, FormatDef, FormatRegistry } from "./format";
export { createFormatRegistry, mergeFormatEnvs, resolveFormatEnv } from "./format";
export type { FormatManifest } from "./manifest";
export { parseManifest } from "./manifest";
export type {
  DiscoveredFormat,
  DiscoverFormatDirsOptions,
  ResolveFormatsResult,
} from "./discovery";
export { discoverFormatDirs, loadFormatsFromDir, resolveFormats } from "./discovery";

/**
 * Id of the built-in `html-tailwind` output format. Runtime-neutral — the
 * concrete definition lives in `@calca/format-html-tailwind`; the MCP seam
 * only needs the id so manifests can `extends` it.
 */
export const HTML_TAILWIND_FORMAT_ID = "html-tailwind";
