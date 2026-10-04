import type { StandardSchemaV1 } from "@standard-schema/spec";

/**
 * Shape-type definition. `schema` is a type-only Standard Schema slot —
 * validation runs through `~standard.validate`, so this package stays
 * dependency-free while any schema library (zod, valibot, arktype) can
 * supply the contract.
 */
export interface ShapeDef<P = Record<string, unknown>> {
  type: string;
  schema?: StandardSchemaV1<P, P>;
  defaultProps?: () => P;
}

export interface ShapeRegistry {
  register(def: ShapeDef): void;
  get(type: string): ShapeDef | undefined;
  has(type: string): boolean;
}

export const createShapeRegistry = (defs: ShapeDef[] = []): ShapeRegistry => {
  const map = new Map<string, ShapeDef>(defs.map((d) => [d.type, d]));
  return {
    register: (def) => map.set(def.type, def),
    get: (type) => map.get(type),
    has: (type) => map.has(type),
  };
};

export const validateProps = (registry: ShapeRegistry, type: string, props: unknown): void => {
  const schema = registry.get(type)?.schema;
  if (!schema) return;
  const result = schema["~standard"].validate(props);
  if (result instanceof Promise) {
    throw new Error(`shape "${type}": async schemas are not supported in canvas records`);
  }
  if (result.issues) {
    const detail = result.issues.map((i) => i.message).join("; ");
    throw new Error(`shape "${type}" props failed schema validation: ${detail}`);
  }
};
