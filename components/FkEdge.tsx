import { Fragment } from "react";
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

  // Cardinality defaults: many on the source side (the FK lives there), one on
  // the target. This matches the standard "many orders → one user" convention.
  const sourceCard = data?.sourceCardinality ?? "many";
  const targetCard = data?.targetCardinality ?? "one";

  // Marker ids encode shape + selection state to allow per-edge color.
  const variant = selected ? "selected" : "default";
  const markerStart = `url(#card-${sourceCard}-${variant})`;
  const markerEnd = `url(#card-${targetCard}-${variant})`;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{ stroke, strokeWidth }}
        markerStart={markerStart}
        markerEnd={markerEnd}
      />
      {/* SVG defs for the cardinality markers. React Flow renders all edges
          into one SVG, so <defs> dropped here are reachable from any edge.
          We define 4 markers (one/many × default/selected) and reference the
          right pair per edge.
          - "one"  = perpendicular bar
          - "many" = crow's foot, apex at the entity, legs fanning along the edge
          orient="auto-start-reverse" makes the marker rotate with the path
          direction; the start marker is also flipped so its "apex" still
          points at its node. */}
      <defs>
        {(["default", "selected"] as const).map((v) => {
          const color =
            v === "selected" ? "var(--primary)" : "var(--muted-foreground)";
          return (
            <Fragment key={v}>
              <marker
                id={`card-one-${v}`}
                viewBox="0 0 12 12"
                refX="11"
                refY="6"
                markerWidth="14"
                markerHeight="14"
                orient="auto-start-reverse"
              >
                <path
                  d="M 9 1 L 9 11"
                  stroke={color}
                  strokeWidth="1.6"
                  fill="none"
                />
              </marker>
              <marker
                id={`card-many-${v}`}
                viewBox="0 0 12 12"
                refX="11"
                refY="6"
                markerWidth="14"
                markerHeight="14"
                orient="auto-start-reverse"
              >
                {/* Apex at (11, 6); legs to (1, 1), (1, 6), (1, 11) */}
                <path
                  d="M 11 6 L 1 1 M 11 6 L 1 6 M 11 6 L 1 11"
                  stroke={color}
                  strokeWidth="1.6"
                  fill="none"
                />
              </marker>
            </Fragment>
          );
        })}
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
          {data?.onDelete && data.onDelete !== "NO ACTION" && (
            <span className="ml-1 rounded bg-muted px-1 text-[9px] font-semibold uppercase tracking-wide">
              {data.onDelete}
            </span>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}


// Declared outside any component so React Flow doesn't see a "new" object every render.
export const edgeTypes = { fk: FkEdge };
