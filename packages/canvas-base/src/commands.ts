import type { BindingRecord, CanvasRecord, RecordId, ShapeRecord } from "./records";

export interface CreateShapeCommand {
  op: "create-shape";
  record: ShapeRecord;
}

export interface CreateBindingCommand {
  op: "create-binding";
  record: BindingRecord;
}

export interface UpdateRecordCommand {
  op: "update";
  id: RecordId;
  /** Shallow-merged into the record's props. */
  props: Record<string, unknown>;
}

export interface DeleteRecordCommand {
  op: "delete";
  id: RecordId;
}

export interface ReparentCommand {
  op: "reparent";
  id: RecordId;
  parentId: RecordId | null;
  /** New sibling index; when omitted a key after the last sibling is generated. */
  index?: string;
}

export type Command =
  | CreateShapeCommand
  | CreateBindingCommand
  | UpdateRecordCommand
  | DeleteRecordCommand
  | ReparentCommand;

export const isCommand = (value: unknown): value is Command =>
  typeof value === "object" &&
  value !== null &&
  "op" in value &&
  ["create-shape", "create-binding", "update", "delete", "reparent"].includes(
    (value as Command).op,
  );

export const commandTargets = (command: Command): RecordId => {
  switch (command.op) {
    case "create-shape":
    case "create-binding":
      return command.record.id;
    default:
      return command.id;
  }
};

export const commandCreates = (
  command: Command,
): command is CreateShapeCommand | CreateBindingCommand =>
  command.op === "create-shape" || command.op === "create-binding";

export const createdRecord = (command: Command): CanvasRecord | null =>
  commandCreates(command) ? command.record : null;
