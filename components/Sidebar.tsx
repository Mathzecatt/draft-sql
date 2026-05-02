import type { RefObject } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SQL_TYPES,
  type SqlType,
  type TableNodeData,
  type TableNodeType,
} from "@/lib/schema";

// Tiny toggle pill for column constraints (PK / NN / UQ).
// Why a custom component instead of shadcn's Toggle? Toggle isn't installed,
// and this is small enough that pulling in another Radix primitive isn't worth it.
function ConstraintToggle({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        "h-5 rounded border px-1.5 text-[10px] font-medium transition-colors " +
        (active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:bg-accent") +
        (disabled ? " cursor-not-allowed opacity-60" : " cursor-pointer")
      }
    >
      {label}
    </button>
  );
}

type SidebarProps = {
  sidebarRef: RefObject<HTMLDivElement | null>;
  width: number;
  onResizeStart: () => void;
  selectedNode: TableNodeType | undefined;
  updateTableData: (
    nodeId: string,
    updater: (data: TableNodeData) => TableNodeData
  ) => void;
  deleteTable: (nodeId: string) => void;
};

export function Sidebar({
  sidebarRef,
  width,
  onResizeStart,
  selectedNode,
  updateTableData,
  deleteTable,
}: SidebarProps) {
  return (
    <aside
      ref={sidebarRef}
      style={{ width }}
      className="relative flex shrink-0 flex-col gap-4 overflow-y-auto border-l p-4"
    >
      {/* drag handle */}
      <div
        className="absolute left-0 top-0 h-full w-1 cursor-col-resize hover:bg-border"
        onMouseDown={(e) => {
          e.preventDefault();
          onResizeStart();
        }}
      />

      <h2 className="text-sm font-semibold">Table properties</h2>

      {!selectedNode ? (
        <p className="text-sm text-muted-foreground">
          Select a table on the canvas to edit its properties.
        </p>
      ) : (
        <>
          {/* Table name */}
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="table-name"
              className="text-xs text-muted-foreground"
            >
              Table name
            </Label>
            <div className="flex items-center gap-1">
              <Input
                id="table-name"
                value={selectedNode.data.name}
                onChange={(e) =>
                  updateTableData(selectedNode.id, (d) => ({
                    ...d,
                    name: e.target.value,
                  }))
                }
                className="h-8 flex-1"
              />
              <Button
                size="sm"
                variant="destructive"
                className="h-8 shrink-0"
                onClick={() => deleteTable(selectedNode.id)}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Delete
              </Button>
            </div>
          </div>

          {/* Columns */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Columns</span>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs"
                onClick={() =>
                  updateTableData(selectedNode.id, (d) => ({
                    ...d,
                    columns: [
                      ...d.columns,
                      {
                        id: crypto.randomUUID(),
                        name: "column_name",
                        type: "INTEGER",
                      },
                    ],
                  }))
                }
              >
                <Plus className="mr-1 h-3 w-3" />
                Add column
              </Button>
            </div>

            {selectedNode.data.columns.length === 0 ? (
              <p className="text-xs text-muted-foreground">No columns yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {selectedNode.data.columns.map((col) => {
                  // Local helper — every per-column edit goes through the same
                  // updateTableData -> columns.map mapper. Captured per-iteration
                  // so it closes over the right `col.id`.
                  const patchColumn = (patch: Partial<typeof col>) =>
                    updateTableData(selectedNode.id, (d) => ({
                      ...d,
                      columns: d.columns.map((c) =>
                        c.id === col.id ? { ...c, ...patch } : c,
                      ),
                    }));

                  return (
                    <div key={col.id} className="flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        <Input
                          value={col.name}
                          onChange={(e) => patchColumn({ name: e.target.value })}
                          className="h-7 min-w-0 flex-1 text-xs"
                        />
                        <Select
                          value={col.type}
                          onValueChange={(type) =>
                            patchColumn({
                              type: type as SqlType,
                              length: undefined,
                            })
                          }
                        >
                          <SelectTrigger className="h-7 w-24 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SQL_TYPES.map((t) => (
                              <SelectItem
                                key={t}
                                value={t}
                                className="text-xs"
                              >
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {col.type === "VARCHAR" && (
                          <Input
                            type="number"
                            min={1}
                            max={65535}
                            placeholder="255"
                            value={col.length ?? ""}
                            onChange={(e) =>
                              patchColumn({
                                length: e.target.value
                                  ? Number(e.target.value)
                                  : undefined,
                              })
                            }
                            className="h-7 w-14 text-xs"
                          />
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 shrink-0"
                          onClick={() =>
                            updateTableData(selectedNode.id, (d) => ({
                              ...d,
                              columns: d.columns.filter(
                                (c) => c.id !== col.id,
                              ),
                            }))
                          }
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Constraint toggles. Active = filled; inactive = outline.
                          PK is special: enabling it disables NN (PK implies NOT NULL
                          at the SQL level, so a separate toggle would be redundant). */}
                      <div className="flex gap-1 pl-1">
                        <ConstraintToggle
                          label="PK"
                          active={!!col.primaryKey}
                          onClick={() =>
                            patchColumn({ primaryKey: !col.primaryKey })
                          }
                        />
                        <ConstraintToggle
                          label="NN"
                          active={!!col.notNull || !!col.primaryKey}
                          disabled={!!col.primaryKey}
                          onClick={() => patchColumn({ notNull: !col.notNull })}
                        />
                        <ConstraintToggle
                          label="UQ"
                          active={!!col.unique}
                          onClick={() => patchColumn({ unique: !col.unique })}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </aside>
  );
}
