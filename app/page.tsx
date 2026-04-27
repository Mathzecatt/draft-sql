"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Plus, Download, LayoutGrid } from "lucide-react";
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

type TableNodeData = {
  name: string;
  columns: { id: string; name: string; type: string }[];
};

type TableNodeType = Node<TableNodeData, "table">;

// Custom node component — renders one table card on the canvas
function TableNode({ data }: NodeProps<TableNodeType>) {
  return (
    <div className="w-48 rounded-lg border bg-card shadow-sm">
      <div className="rounded-t-lg bg-primary px-3 py-2">
        <span className="text-sm font-semibold text-primary-foreground">
          {data.name}
        </span>
      </div>
      <div className="px-3 py-2">
        <p className="text-xs text-muted-foreground">No columns yet.</p>
      </div>
    </div>
  );
}

// defined outside the component so React Flow doesn't re-register node types on every render
const nodeTypes: NodeTypes = { table: TableNode };

export default function Home() {
  const [nodes, setNodes, onNodesChange] = useNodesState<TableNodeType>([]);
  const [edges, , onEdgesChange] = useEdgesState([]);

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
        <div className="flex items-center gap-2">
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
        {/* CANVAS — ReactFlow fills 100% of this section via its own internal styles */}
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

          {/* empty-state overlay — pointer-events-none so it doesn't block canvas interaction */}
          {nodes.length === 0 && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">
                Click &quot;New table&quot; to start designing your schema
              </p>
            </div>
          )}
        </section>

        {/* RIGHT SIDEBAR */}
        <aside className="w-72 border-l p-4">
          <h2 className="mb-3 text-sm font-semibold">Table properties</h2>
          <p className="text-sm text-muted-foreground">
            Select a table on the canvas to edit its properties.
          </p>
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
