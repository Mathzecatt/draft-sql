"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Plus, Download } from "lucide-react";

type Column = {
  id: string;
  name: string;
  type: string;
};

type Table = {
  id: string;
  name: string;
  x: number;
  y: number;
  columns: Column[];
};

export default function Home() {
  const [tables, setTables] = useState<Table[]>([]);

  function addTable() {
    setTables((prev) => {
      const idx = prev.length;
      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          name: `table_${idx + 1}`,
          // stagger new tables in a 4-column grid so they don't pile up
          x: 80 + (idx % 4) * 220,
          y: 80 + Math.floor(idx / 4) * 180,
          columns: [],
        },
      ];
    });
  }

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
        {/* CANVAS */}
        <section className="relative flex-1 overflow-auto bg-muted/20 bg-[radial-gradient(circle,var(--border)_1px,transparent_1px)] bg-size-[24px_24px]">
          {tables.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted-foreground">
                Click &quot;New table&quot; to start designing your schema
              </p>
            </div>
          ) : (
            tables.map((table) => (
              <div
                key={table.id}
                style={{ left: table.x, top: table.y }}
                className="absolute w-48 rounded-lg border bg-card shadow-sm"
              >
                <div className="rounded-t-lg bg-primary px-3 py-2">
                  <span className="text-sm font-semibold text-primary-foreground">
                    {table.name}
                  </span>
                </div>
                <div className="px-3 py-2">
                  <p className="text-xs text-muted-foreground">
                    No columns yet.
                  </p>
                </div>
              </div>
            ))
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
          {tables.length} {tables.length === 1 ? "table" : "tables"}
        </span>
        <span>PostgreSQL</span>
      </footer>
    </main>
  );
}
