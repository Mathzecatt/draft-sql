import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  useNodes,
  type EdgeProps,
} from "@xyflow/react";
import type { FkEdgeType, TableNodeType } from "@/lib/schema";

// Resolve a column id to a "table.column" label by scanning all nodes.
// Returns "?" on lookup failure so the edge keeps rendering even if a node
// or column was just deleted.
function labelFor(
  nodes: TableNodeType[],
  columnId: string | undefined,
): string {
  if (!columnId) return "?";
  for (const node of nodes) {
    const col = node.data.columns.find((c) => c.id === columnId);
    if (col) return `${node.data.name || "?"}.${col.name || "?"}`;
  }
  return "?";
}

// Custom edge for foreign-key relationships.
// Renders the path between two column handles + a "table.col → table.col" label.
export function FkEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps<FkEdgeType>) {
  // useNodes() re-runs this component on any node change — needed so column
  // renames update the label live.
  const nodes = useNodes<TableNodeType>();

  const sourceLabel = labelFor(nodes, data?.sourceColumnId);
  const targetLabel = labelFor(nodes, data?.targetColumnId);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge id={id} path={edgePath} />
      <EdgeLabelRenderer>
        {/* The double translate is React Flow's standard label-positioning trick:
            the first translate centers the div on itself, the second moves it
            to the (labelX, labelY) point on the canvas. */}
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "all",
          }}
          className="rounded border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground shadow-sm"
        >
          {sourceLabel} → {targetLabel}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

// Declared outside any component so React Flow doesn't see a "new" object every render.
export const edgeTypes = { fk: FkEdge };
