import { isCommand, type Command } from "./commands";
import { generateKeyBetween } from "./keys";
import { migrate, type Migration } from "./migrations";
import {
  isBindingRecord,
  isShapeRecord,
  type BindingRecord,
  type CanvasRecord,
  type RecordId,
  type ShapeRecord,
} from "./records";
import { createShapeRegistry, validateProps, type ShapeDef, type ShapeRegistry } from "./shapes";

export type ChangeOrigin = "user" | "agent" | "remote";

export interface ApplyOptions {
  origin: ChangeOrigin;
  /** Record an undo entry (default true; remote sync applies pass history:false). */
  history?: boolean;
}

export interface CanvasChange {
  origin: ChangeOrigin;
  commands: readonly Command[];
  /** Commands that restore the previous state — applied by undo(). */
  inverse: readonly Command[];
  added: readonly RecordId[];
  updated: readonly RecordId[];
  removed: readonly RecordId[];
}

export const CANVAS_CHANGE_EVENT = "change";

export interface CanvasSnapshot {
  version: number;
  shapes: ShapeRecord[];
  bindings: BindingRecord[];
}

export const SNAPSHOT_VERSION = 1;

export interface CanvasStoreOptions {
  defs?: ShapeDef[];
  migrations?: Migration[];
  snapshot?: CanvasSnapshot;
}

const inverseOf = (command: Command, previous: CanvasRecord | null): Command[] => {
  switch (command.op) {
    case "create-shape":
      return [{ op: "delete", id: command.record.id }];
    case "create-binding":
      return [{ op: "delete", id: command.record.id }];
    case "delete":
      if (!previous) return [];
      return [
        isShapeRecord(previous)
          ? { op: "create-shape", record: previous }
          : { op: "create-binding", record: previous as BindingRecord },
      ];
    case "update": {
      if (!previous) return [];
      const prior: Record<string, unknown> = {};
      for (const key of Object.keys(command.props)) {
        prior[key] = previous.props[key];
      }
      return [{ op: "update", id: command.id, props: prior }];
    }
    case "reparent":
      if (!previous || !isShapeRecord(previous)) return [];
      return [
        {
          op: "reparent",
          id: command.id,
          parentId: previous.parentId,
          index: previous.index,
        },
      ];
  }
};

export class CanvasStore extends EventTarget {
  #shapes = new Map<RecordId, ShapeRecord>();
  #bindings = new Map<RecordId, BindingRecord>();
  #undo: Command[][] = [];
  #redo: Command[][] = [];
  /** In-flight transaction's collected inverses; null = not transacting. */
  #transaction: Command[][] | null = null;
  #registry: ShapeRegistry;
  #migrations: Migration[];

  constructor(options: CanvasStoreOptions = {}) {
    super();
    this.#registry = createShapeRegistry(options.defs ?? []);
    this.#migrations = options.migrations ?? [];
    if (options.snapshot) this.load(options.snapshot);
  }

  get registry(): ShapeRegistry {
    return this.#registry;
  }

  get(id: RecordId): CanvasRecord | undefined {
    return this.#shapes.get(id) ?? this.#bindings.get(id);
  }

  getShape(id: RecordId): ShapeRecord | undefined {
    return this.#shapes.get(id);
  }

  all(): CanvasRecord[] {
    return [...this.#shapes.values(), ...this.#bindings.values()];
  }

  shapes(): ShapeRecord[] {
    return [...this.#shapes.values()];
  }

  bindings(): BindingRecord[] {
    return [...this.#bindings.values()];
  }

  /** Direct children of a parent (null = root), in index order. */
  children(parentId: RecordId | null): ShapeRecord[] {
    return this.shapes()
      .filter((s) => s.parentId === parentId)
      .sort((a, b) => (a.index < b.index ? -1 : a.index > b.index ? 1 : 0));
  }

  /** Index key for a new shape appended at the end of a parent's children. */
  nextIndex(parentId: RecordId | null): string {
    const last = this.children(parentId).at(-1);
    return generateKeyBetween(last?.index ?? null, null);
  }

  get canUndo(): boolean {
    return this.#undo.length > 0;
  }

  get canRedo(): boolean {
    return this.#redo.length > 0;
  }

  apply(commands: readonly Command[], options: ApplyOptions): CanvasChange {
    const inverse: Command[] = [];
    const added: RecordId[] = [];
    const updated: RecordId[] = [];
    const removed: RecordId[] = [];

    for (const command of commands) {
      if (!isCommand(command)) throw new Error(`not a command: ${JSON.stringify(command)}`);
      const previous = this.get(commandTargetOf(command)) ?? null;
      inverse.unshift(...inverseOf(command, previous));
      this.#execute(command, previous);
      if (command.op === "create-shape" || command.op === "create-binding") {
        added.push(command.record.id);
      } else if (command.op === "delete") {
        removed.push(command.id);
      } else {
        updated.push(command.id);
      }
    }

    if (options.history ?? true) {
      if (this.#transaction) {
        this.#transaction.push(inverse);
      } else {
        this.#undo.push(inverse);
      }
      this.#redo = [];
    }

    const change: CanvasChange = {
      origin: options.origin,
      commands,
      inverse,
      added,
      updated,
      removed,
    };
    this.dispatchEvent(new CustomEvent<CanvasChange>(CANVAS_CHANGE_EVENT, { detail: change }));
    return change;
  }

  /** Batch several applies into a single undo entry. */
  transact(fn: () => void): void {
    if (this.#transaction) {
      fn();
      return;
    }
    this.#transaction = [];
    try {
      fn();
      const batches = this.#transaction;
      if (batches.length > 0) {
        this.#undo.push(batches.flat());
      }
    } finally {
      this.#transaction = null;
    }
  }

  undo(): void {
    const entry = this.#undo.pop();
    if (!entry) return;
    const change = this.apply(entry, { origin: "user", history: false });
    this.#redo.push([...change.inverse]);
  }

  redo(): void {
    const entry = this.#redo.pop();
    if (!entry) return;
    const change = this.apply(entry, { origin: "user", history: false });
    this.#undo.push([...change.inverse]);
  }

  snapshot(): CanvasSnapshot {
    return structuredClone({
      version: SNAPSHOT_VERSION,
      shapes: this.shapes(),
      bindings: this.bindings(),
    });
  }

  load(snapshot: CanvasSnapshot): void {
    const migrated = migrate(snapshot, this.#migrations);
    this.#shapes.clear();
    this.#bindings.clear();
    this.#undo = [];
    this.#redo = [];
    for (const shape of migrated.shapes) this.#shapes.set(shape.id, shape);
    for (const binding of migrated.bindings) this.#bindings.set(binding.id, binding);
    this.dispatchEvent(
      new CustomEvent<CanvasChange>(CANVAS_CHANGE_EVENT, {
        detail: {
          origin: "remote",
          commands: [],
          inverse: [],
          added: this.all().map((r) => r.id),
          updated: [],
          removed: [],
        } satisfies CanvasChange,
      }),
    );
  }

  #execute(command: Command, previous: CanvasRecord | null): void {
    switch (command.op) {
      case "create-shape": {
        if (previous) throw new Error(`record ${command.record.id} already exists`);
        validateProps(this.#registry, command.record.type, command.record.props);
        this.#shapes.set(command.record.id, command.record);
        return;
      }
      case "create-binding": {
        if (previous) throw new Error(`record ${command.record.id} already exists`);
        validateProps(this.#registry, command.record.type, command.record.props);
        this.#bindings.set(command.record.id, command.record);
        return;
      }
      case "update": {
        if (!previous) throw new Error(`record ${command.id} does not exist`);
        validateProps(this.#registry, previous.type, {
          ...previous.props,
          ...command.props,
        });
        previous.props = { ...previous.props, ...command.props };
        return;
      }
      case "delete": {
        if (!previous) throw new Error(`record ${command.id} does not exist`);
        if (isShapeRecord(previous)) this.#shapes.delete(command.id);
        else this.#bindings.delete(command.id);
        return;
      }
      case "reparent": {
        if (!previous || !isShapeRecord(previous)) {
          throw new Error(`shape ${command.id} does not exist`);
        }
        if (command.parentId && !this.#shapes.has(command.parentId)) {
          throw new Error(`parent shape ${command.parentId} does not exist`);
        }
        previous.parentId = command.parentId;
        previous.index = command.index ?? this.nextIndex(command.parentId);
        return;
      }
    }
  }
}

const commandTargetOf = (command: Command): RecordId =>
  command.op === "create-shape" || command.op === "create-binding" ? command.record.id : command.id;

export const createCanvasStore = (options: CanvasStoreOptions = {}): CanvasStore =>
  new CanvasStore(options);
