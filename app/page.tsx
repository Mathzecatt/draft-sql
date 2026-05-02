"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Download,
  LayoutGrid,
  Trash2,
  Sun,
  Moon,
  Eraser,
} from "lucide-react";
import { useTheme } from "next-themes";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  BackgroundVariant,
  addEdge,
  type Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { nodeTypes, columnIdFromHandle } from "@/components/TableNode";
import { edgeTypes } from "@/components/FkEdge";
import { Sidebar } from "@/components/Sidebar";
import type { TableNodeData, TableNodeType, FkEdgeType } from "@/lib/schema";
import { loadSchema, saveSchema, clearSchema } from "@/lib/storage";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { generateSql, downloadSql } from "@/lib/sql";

// Discriminated union — same menu, but the action depends on what was right-clicked.
type ContextMenu =
  | { kind: "node"; x: number; y: number; nodeId: string }
  | { kind: "edge"; x: number; y: number; edgeId: string }
  | null;

const MIN_SIDEBAR_WIDTH = 200;
const MAX_SIDEBAR_WIDTH = 520;
const DEFAULT_SIDEBAR_WIDTH = 288;

export default function Home() {
  const [nodes, setNodes, onNodesChange] = useNodesState<TableNodeType>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<FkEdgeType>([]);
  const [contextMenu, setContextMenu] = useState<ContextMenu>(null);
  const [schemaName, setSchemaName] = useState("my_schema");
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

  // theme toggle
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Load persisted schema once on mount. We track loaded separately from mounted
  // because we don't want to write to localStorage during the initial render
  // before we've had a chance to read what's already there — that would wipe
  // the saved schema with an empty array.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const stored = loadSchema();
    if (stored) {
      setNodes(stored.nodes);
      setEdges(stored.edges);
    }
    setHydrated(true);
  }, [setNodes, setEdges]);

  // Persist on every change, but only after hydration is done.
  useEffect(() => {
    if (!hydrated) return;
    saveSchema({ nodes, edges });
  }, [nodes, edges, hydrated]);

  // resizable sidebar
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!isResizing.current || !sidebarRef.current) return;
      const rect = sidebarRef.current.getBoundingClientRect();
      const newWidth = rect.right - e.clientX;
      setSidebarWidth(
        Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, newWidth)),
      );
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

  // close context menu when clicking anywhere outside it
  useEffect(() => {
    if (!contextMenu) return;
    function handleOutsideClick() {
      setContextMenu(null);
    }
    window.addEventListener("mousedown", handleOutsideClick);
    return () => window.removeEventListener("mousedown", handleOutsideClick);
  }, [contextMenu]);

  const selectedNode = nodes.find((n) => n.selected);

  const deleteTable = useCallback(
    (nodeId: string) => {
      setNodes((prev) => prev.filter((n) => n.id !== nodeId));
      setContextMenu(null);
    },
    [setNodes],
  );

  const updateTableData = useCallback(
    (nodeId: string, updater: (data: TableNodeData) => TableNodeData) => {
      setNodes((prev) =>
        prev.map((node) =>
          node.id === nodeId ? { ...node, data: updater(node.data) } : node,
        ),
      );
    },
    [setNodes],
  );

  const resetLayout = useCallback(() => {
    setNodes((prev) =>
      prev.map((node, idx) => ({
        ...node,
        position: {
          x: 80 + (idx % 4) * 220,
          y: 80 + Math.floor(idx / 4) * 180,
        },
      })),
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

  const onNodeContextMenu = useCallback(
    (e: React.MouseEvent, node: TableNodeType) => {
      e.preventDefault();
      setContextMenu({
        kind: "node",
        x: e.clientX,
        y: e.clientY,
        nodeId: node.id,
      });
    },
    [],
  );

  const onEdgeContextMenu = useCallback(
    (e: React.MouseEvent, edge: FkEdgeType) => {
      e.preventDefault();
      setContextMenu({
        kind: "edge",
        x: e.clientX,
        y: e.clientY,
        edgeId: edge.id,
      });
    },
    [],
  );

  const deleteEdge = useCallback(
    (edgeId: string) => {
      setEdges((prev) => prev.filter((e) => e.id !== edgeId));
      setContextMenu(null);
    },
    [setEdges],
  );

  const clearAll = useCallback(() => {
    setNodes([]);
    setEdges([]);
    clearSchema();
    setClearConfirmOpen(false);
  }, [setNodes, setEdges]);

  const exportSql = useCallback(() => {
    const sql = generateSql(nodes, edges, schemaName);
    downloadSql(sql, `${schemaName || "schema"}.sql`);
  }, [nodes, edges, schemaName]);

  const startSidebarResize = useCallback(() => {
    isResizing.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  const onConnect = useCallback(
    (connection: Connection) => {
      // Extract the real column IDs from the handle strings (e.g. "uuid-r" → "uuid")
      const sourceColumnId = columnIdFromHandle(connection.sourceHandle);
      const targetColumnId = columnIdFromHandle(connection.targetHandle);

      // All four fields must be present — React Flow can theoretically pass nulls
      if (
        !connection.source ||
        !connection.target ||
        !sourceColumnId ||
        !targetColumnId
      )
        return;

      // Build a fully-typed FkEdge so edge.data is always available downstream (SQL export, etc.)
      const newEdge: FkEdgeType = {
        id: crypto.randomUUID(),
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle ?? null,
        targetHandle: connection.targetHandle ?? null,
        type: "fk",
        data: { sourceColumnId, targetColumnId },
      };

      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges],
  );

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
          <Button size="sm" variant="outline" onClick={exportSql}>
            <Download className="mr-1 h-4 w-4" />
            Export SQL
          </Button>
          <Button size="sm" variant="outline" onClick={resetLayout}>
            <LayoutGrid className="mr-1 h-4 w-4" />
            Reset layout
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setClearConfirmOpen(true)}
            disabled={nodes.length === 0 && edges.length === 0}
          >
            <Eraser className="mr-1 h-4 w-4" />
            Clear all
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
          >
            {mounted &&
              (resolvedTheme === "dark" ? (
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
            value={schemaName}
            onChange={(e) => setSchemaName(e.target.value)}
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
            edgeTypes={edgeTypes}
            onNodeContextMenu={onNodeContextMenu}
            onEdgeContextMenu={onEdgeContextMenu}
            onPaneClick={() => setContextMenu(null)}
            onConnect={onConnect}
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

          {/* right-click context menu — fixed so it sits at the cursor regardless of scroll */}
          {contextMenu && (
            <div
              className="fixed z-50 min-w-36 rounded-md border bg-popover p-1 shadow-md"
              style={{ left: contextMenu.x, top: contextMenu.y }}
              onMouseDown={(e) => e.stopPropagation()} // prevent outside-click handler from firing
            >
              {contextMenu.kind === "node" ? (
                <button
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-accent"
                  onClick={() => deleteTable(contextMenu.nodeId)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete table
                </button>
              ) : (
                <button
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-accent"
                  onClick={() => deleteEdge(contextMenu.edgeId)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete relationship
                </button>
              )}
            </div>
          )}
        </section>

        <Sidebar
          sidebarRef={sidebarRef}
          width={sidebarWidth}
          onResizeStart={startSidebarResize}
          selectedNode={selectedNode}
          updateTableData={updateTableData}
          deleteTable={deleteTable}
        />
      </div>

      {/* STATUS BAR */}
      <footer className="flex h-7 items-center justify-between border-t px-4 text-xs text-muted-foreground">
        <span>
          {nodes.length} {nodes.length === 1 ? "table" : "tables"}
        </span>
        <span>PostgreSQL</span>
      </footer>

      {/* Confirm before clearing — wiping the whole schema is destructive
          and can't be undone (no history yet). */}
      <Dialog open={clearConfirmOpen} onOpenChange={setClearConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear all tables?</DialogTitle>
            <DialogDescription>
              This will delete all {nodes.length}{" "}
              {nodes.length === 1 ? "table" : "tables"} and{" "}
              {edges.length === 1
                ? "1 relationship"
                : `${edges.length} relationships`}
              . This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setClearConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={clearAll}>
              <Trash2 className="mr-1 h-4 w-4" />
              Clear all
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
