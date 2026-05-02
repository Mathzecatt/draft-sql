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
  selected,
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

  // Resolve theme tokens for the SVG. CSS variables don't work as marker
  // fill colors in some browsers when set via class on the parent, so we
  // pass an explicit currentColor-friendly stroke and let the marker inherit.
  const stroke = selected ? "var(--primary)" : "var(--muted-foreground)";
  const strokeWidth = selected ? 2 : 1.5;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{ stroke, strokeWidth }}
        markerEnd={`url(#fk-arrow-${selected ? "selected" : "default"})`}
      />
      {/* SVG defs for the arrow marker. React Flow renders all edges into one
          SVG, so the <defs> we drop here are reachable from any edge by id. */}
      <defs>
        <marker
          id="fk-arrow-default"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--muted-foreground)" />
        </marker>
        <marker
          id="fk-arrow-selected"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--primary)" />
        </marker>
      </defs>
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
          className={
            "rounded border bg-background px-1.5 py-0.5 text-[10px] shadow-sm " +
            (selected
              ? "border-primary text-primary"
              : "text-muted-foreground")
          }
        >
          {sourceLabel} → {targetLabel}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}


// Declared outside any component so React Flow doesn't see a "new" object every render.
export const edgeTypes = { fk: FkEdge };
