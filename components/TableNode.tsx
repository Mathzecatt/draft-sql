import { Handle, Position, type NodeProps, type NodeTypes } from "@xyflow/react";
import type { TableNodeType } from "@/lib/schema";

// Handle id suffixes — unique per node, so left and right handles on the same
// column don't collide. Strip these to recover the column id when reading edges.
const LEFT = "-l";
const RIGHT = "-r";

// Shared classes for the column-side handles.
// Why !important on size? React Flow ships default handle styles in its CSS,
// and Tailwind's utilities lose the cascade fight without the bang. Pinning
// the colors to theme tokens keeps the dot visible in dark + light mode.
const HANDLE_CLASS =
  "!h-2 !w-2 !border !border-border !bg-muted-foreground";

// Custom node — renders a table card with its columns listed
export function TableNode({ data }: NodeProps<TableNodeType>) {
  return (
    <div className="w-52 rounded-lg border bg-card shadow-sm">
      <div className="rounded-t-lg bg-primary px-3 py-2">
        <span className="text-sm font-semibold text-primary-foreground">
          {data.name || "unnamed"}
        </span>
      </div>
      <div className="divide-y">
        {data.columns.length === 0 ? (
          <p className="px-3 py-2 text-xs text-muted-foreground">
            No columns yet.
          </p>
        ) : (
          data.columns.map((col) => (
            <div
              key={col.id}
              className="relative flex items-center justify-between px-3 py-1.5"
            >
              {/* target on the left — drop an edge here */}
              <Handle
                type="target"
                position={Position.Left}
                id={col.id + LEFT}
                className={HANDLE_CLASS}
              />
              <span className="flex items-center gap-1 text-xs font-medium">
                {col.primaryKey && (
                  <span
                    title="Primary key"
                    className="rounded bg-primary px-1 text-[9px] font-semibold text-primary-foreground"
                  >
                    PK
                  </span>
                )}
                {!col.primaryKey && col.notNull && (
                  <span
                    title="NOT NULL"
                    className="rounded border border-border px-1 text-[9px] font-semibold text-muted-foreground"
                  >
                    NN
                  </span>
                )}
                {col.unique && !col.primaryKey && (
                  <span
                    title="UNIQUE"
                    className="rounded border border-border px-1 text-[9px] font-semibold text-muted-foreground"
                  >
                    UQ
                  </span>
                )}
                {col.name || "unnamed"}
              </span>
              <span className="text-xs text-muted-foreground">
                {col.type === "VARCHAR" && col.length
                  ? `VARCHAR(${col.length})`
                  : col.type}
              </span>
              {/* source on the right — drag an edge from here */}
              <Handle
                type="source"
                position={Position.Right}
                id={col.id + RIGHT}
                className={HANDLE_CLASS}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Helper for later: reverse the suffix to recover the column id from a handle id.
export function columnIdFromHandle(handleId: string | null | undefined): string | null {
  if (!handleId) return null;
  if (handleId.endsWith(LEFT)) return handleId.slice(0, -LEFT.length);
  if (handleId.endsWith(RIGHT)) return handleId.slice(0, -RIGHT.length);
  return handleId;
}

// outside any component — prevents React Flow from re-registering node types on every render
export const nodeTypes: NodeTypes = { table: TableNode };
