import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Plus, Download } from "lucide-react";

export default function Home() {
  return (
    <main className="flex h-screen flex-col bg-background text-foreground">
      {/* TOP TOOLBAR */}
      <header className="flex h-14 items-center justify-between border-b px-4">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Draft_SQL</h1>
          <Separator orientation="vertical" className="h-6" />
          <Button size="sm" variant="default">
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
        <section className="relative flex-1 bg-muted/20 bg-[radial-gradient(circle,var(--border)_1px,transparent_1px)] bg-size-[24px_24px]">
          {" "}
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Click &quot;New table&quot; to start designing your schema
            </p>
          </div>
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
        <span>0 tables</span>
        <span>PostgreSQL</span>
      </footer>
    </main>
  );
}
