"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Download, LayoutGrid, Trash2, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  BackgroundVariant,
  type Node,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

const SQL_TYPES = [
  "CHAR",
  "VARCHAR",
  "INTEGER",
  "BOOLEAN",
  "TIMESTAMP",
  "UUID",
  "NUMERIC",
] as const;

type ColumnDef = {
  id: string;
  name: string;
  type: string;
  length?: number; // only relevant for VARCHAR
};

type TableNodeData = {
  name: string;
  columns: ColumnDef[];
};

type TableNodeType = Node<TableNodeData, "table">;

// Custom node — renders a table card with its columns listed
function TableNode({ data }: NodeProps<TableNodeType>) {
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
              className="flex items-center justify-between px-3 py-1.5"
            >
              <span className="text-xs font-medium">
                {col.name || "unnamed"}
              </span>
              <span className="text-xs text-muted-foreground">
                {col.type === "VARCHAR" && col.length
                  ? `VARCHAR(${col.length})`
                  : col.type}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// outside component — prevents React Flow from re-registering node types on every render
const nodeTypes: NodeTypes = { table: TableNode };

const MIN_SIDEBAR_WIDTH = 200;
const MAX_SIDEBAR_WIDTH = 520;
const DEFAULT_SIDEBAR_WIDTH = 288;

export default function Home() {
  const [nodes, setNodes, onNodesChange] = useNodesState<TableNodeType>([]);
  const [edges, , onEdgesChange] = useEdgesState([]);

  // theme toggle
  const { resolvedTheme, setTheme } = useTheme();
  // next-themes reads from the DOM, so it's not available on the first server render.
  // mounting guard prevents a hydration mismatch on the icon.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // resizable sidebar
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!isResizing.current || !sidebarRef.current) return;
      const rect = sidebarRef.current.getBoundingClientRect();
      const newWidth = rect.right - e.clientX;
      setSidebarWidth(Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, newWidth)));
    }
    function onMouseUp() {
      isResizing.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  // derive selected node from React Flow's own `selected` flag — no extra state needed
  const selectedNode = nodes.find((n) => n.selected);

  const updateTableData = useCallback(
    (nodeId: string, updater: (data: TableNodeData) => TableNodeData) => {
      setNodes((prev) =>
        prev.map((node) =>
          node.id === nodeId ? { ...node, data: updater(node.data) } : node
        )
      );
    },
    [setNodes]
  );

  const resetLayout = useCallback(() => {
    setNodes((prev) =>
      prev.map((node, idx) => ({
        ...node,
        position: {
          x: 80 + (idx % 4) * 220,
          y: 80 + Math.floor(idx / 4) * 180,
        },
      }))
    );
  }, [setNodes]);

  const addTable = useCallback(() => {
    setNodes((prev) => {
      const idx = prev.length;
      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: "table" as const,
          position: {
            x: 80 + (idx % 4) * 220,
            y: 80 + Math.floor(idx / 4) * 180,
          },
          data: { name: `table_${idx + 1}`, columns: [] },
        },
      ];
    });
  }, [setNodes]);

  return (
    <main className="flex h-screen flex-col bg-background text-foreground">
      {/* TOP TOOLBAR */}
      <header className="flex h-14 items-center justify-between border-b px-4">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Draft_SQL</h1>
          <Separator orientation="vertical" className="h-6" />
          <Button size="sm" variant="default" onClick={addTable}>
            <Plus className="mr-1 h-4 w-4" />
            New table
          </Button>
          <Button size="sm" variant="outline">
            <Download className="mr-1 h-4 w-4" />
            Export SQL
          </Button>
          <Button size="sm" variant="outline" onClick={resetLayout}>
            <LayoutGrid className="mr-1 h-4 w-4" />
            Reset layout
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            {mounted && (resolvedTheme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            ))}
          </Button>
          <Label
            htmlFor="schema-name"
            className="text-sm text-muted-foreground"
          >
            Schema:
          </Label>
          <Input
            id="schema-name"
            defaultValue="my_schema"
            className="h-8 w-48"
          />
        </div>
      </header>

      {/* MAIN AREA: canvas + sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* CANVAS */}
        <section className="relative flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
          >
            <Background variant={BackgroundVariant.Dots} gap={24} />
            <Controls />
          </ReactFlow>

          {nodes.length === 0 && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">
                Click &quot;New table&quot; to start designing your schema
              </p>
            </div>
          )}
        </section>

        {/* RIGHT SIDEBAR */}
        <aside
          ref={sidebarRef}
          style={{ width: sidebarWidth }}
          className="relative flex shrink-0 flex-col gap-4 overflow-y-auto border-l p-4"
        >
          {/* drag handle — thin strip on the left edge */}
          <div
            className="absolute left-0 top-0 h-full w-1 cursor-col-resize hover:bg-border"
            onMouseDown={(e) => {
              e.preventDefault();
              isResizing.current = true;
              document.body.style.cursor = "col-resize";
              // prevent text selection while dragging
              document.body.style.userSelect = "none";
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
                <Input
                  id="table-name"
                  value={selectedNode.data.name}
                  onChange={(e) =>
                    updateTableData(selectedNode.id, (d) => ({
                      ...d,
                      name: e.target.value,
                    }))
                  }
                  className="h-8"
                />
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
                            type: "TEXT",
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
                  <p className="text-xs text-muted-foreground">
                    No columns yet.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {selectedNode.data.columns.map((col) => (
                      <div key={col.id} className="flex items-center gap-1">
                        <Input
                          value={col.name}
                          onChange={(e) =>
                            updateTableData(selectedNode.id, (d) => ({
                              ...d,
                              columns: d.columns.map((c) =>
                                c.id === col.id
                                  ? { ...c, name: e.target.value }
                                  : c
                              ),
                            }))
                          }
                          className="h-7 min-w-0 flex-1 text-xs"
                        />
                        <Select
                          value={col.type}
                          onValueChange={(type) =>
                            updateTableData(selectedNode.id, (d) => ({
                              ...d,
                              columns: d.columns.map((c) =>
                                // clear length when switching away from VARCHAR
                                c.id === col.id ? { ...c, type, length: undefined } : c
                              ),
                            }))
                          }
                        >
                          <SelectTrigger className="h-7 w-24 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SQL_TYPES.map((t) => (
                              <SelectItem key={t} value={t} className="text-xs">
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
                              updateTableData(selectedNode.id, (d) => ({
                                ...d,
                                columns: d.columns.map((c) =>
                                  c.id === col.id
                                    ? {
                                        ...c,
                                        length: e.target.value
                                          ? Number(e.target.value)
                                          : undefined,
                                      }
                                    : c
                                ),
                              }))
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
                              columns: d.columns.filter((c) => c.id !== col.id),
                            }))
                          }
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </aside>
      </div>

      {/* STATUS BAR */}
      <footer className="flex h-7 items-center justify-between border-t px-4 text-xs text-muted-foreground">
        <span>
          {nodes.length} {nodes.length === 1 ? "table" : "tables"}
        </span>
        <span>PostgreSQL</span>
      </footer>
    </main>
  );
}
