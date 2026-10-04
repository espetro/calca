import type { BindingRecord, Command, ShapeRecord } from "@calca/canvas-base";
import { generateKeyBetween } from "@calca/canvas-base";
import {
  applyNodeChanges,
  ReactFlow,
  type Connection,
  type Node,
  type NodeChange,
  type ReactFlowProps,
} from "@xyflow/react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useCanvasStore } from "./store-context";
import type { CanvasViews } from "./types";
import { useCanvasNodes } from "./use-canvas-nodes";

interface FlowCanvasProps<C> extends Omit<ReactFlowProps, "nodes" | "edges"> {
  /** Record-type → React Flow node/edge views. */
  views: CanvasViews<C>;
  /** Opaque context handed to every view's data/selectors. */
  data: C;
  /** React Flow `nodeTypes` map (components live outside the adapter). */
  nodeTypes: ReactFlowProps["nodeTypes"];
  /**
   * Called after RF changes have been translated into commands and applied
   * to the store (origin "user"). Use it to keep host state (e.g. jotai
   * persistence) in sync with position/removal changes.
   */
  onCommandsApplied?: (commands: Command[], changes: NodeChange[]) => void;
  /** Selection is UI state, not document state — surfaced via callback. */
  onSelectionChange?: ReactFlowProps["onSelectionChange"];
}

/**
 * Generic store → React Flow adapter. The document is the source of truth;
 * RF transient state (in-progress drags, selection) stays local.
 */
export const FlowCanvas = <C,>({
  views,
  data,
  nodeTypes,
  onCommandsApplied,
  onSelectionChange,
  children,
  ...rfProps
}: FlowCanvasProps<C>) => {
  const store = useCanvasStore();
  if (!store) {
    throw new Error("FlowCanvas must render inside a CanvasStoreProvider");
  }

  const projected = useCanvasNodes(views, data, store);
  const [nodes, setNodes] = useState<Node[]>(projected.nodes);

  // Re-sync from the document while preserving RF transient drag/selection.
  useEffect(() => {
    setNodes((prev) => {
      const byId = new Map(prev.map((n) => [n.id, n]));
      return projected.nodes.map((n) => {
        const existing = byId.get(n.id);
        if (!existing) return n;
        return {
          ...n,
          position: existing.position,
          selected: existing.selected,
          data: { ...n.data, isDragging: existing.data?.isDragging ?? false },
        };
      });
    });
  }, [projected.nodes]);

  const shapeById = useMemo(() => {
    const map = new Map<string, ShapeRecord>();
    for (const s of store.shapes()) map.set(s.id, s);
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, projected]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((prev) => applyNodeChanges(changes, prev));

      const applied: Command[] = [];
      for (const change of changes) {
        if (change.type !== "position" && change.type !== "remove") continue;
        const record = shapeById.get(change.id);
        if (!record) continue;
        const view = views.shapes?.[record.type];
        if (change.type === "position" && change.position) {
          const props = view?.writePosition?.(record, change.position) ?? {
            position: change.position,
          };
          const command: Command = { op: "update", id: change.id, props };
          applied.push(command);
          // Intermediate drag positions stay out of undo history.
          store.apply([command], { origin: "user", history: change.dragging === false });
        } else if (change.type === "remove") {
          const command: Command = { op: "delete", id: change.id };
          applied.push(command);
          store.apply([command], { origin: "user" });
        }
      }

      if (applied.length > 0) onCommandsApplied?.(applied, changes);
    },
    [shapeById, store, views, onCommandsApplied],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      const record: BindingRecord = {
        id: `binding-${crypto.randomUUID()}`,
        type: "edge",
        fromId: connection.source,
        toId: connection.target,
        index: generateKeyBetween(null, null),
        props: {},
      };
      store.apply([{ op: "create-binding", record }], { origin: "user" });
    },
    [store],
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={projected.edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onConnect={onConnect}
      onSelectionChange={onSelectionChange}
      {...rfProps}
    >
      {children}
    </ReactFlow>
  );
};
