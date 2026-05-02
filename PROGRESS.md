# PROGRESS.md

Source of truth for session-to-session continuity. Update at the end of each session.

---

## Current state

Working web app deployed on Vercel. Core flow is complete: design schema visually
→ validate → preview SQL → copy or download.

## What's done

### Canvas / data model
- React Flow canvas with custom `TableNode` (table card with column rows)
- Custom `FkEdge` (smooth-step path, "table.col → table.col" label, arrow marker,
  selection styling, ON DELETE badge)
- Tables: name, list of columns
- Columns: name, SQL type, length (VARCHAR), PRIMARY KEY / NOT NULL / UNIQUE
- Foreign keys: drag column-to-column, ON DELETE picker via right-click
- Cascade delete: orphan edges drop automatically when a node or column disappears

### UI
- Top toolbar: New table, Export SQL, Reset layout, Clear all, theme toggle, schema name input
- Right sidebar: edit selected table; PK/NN/UQ toggles per column; validation banner
- Right-click context menus on nodes (Delete) and edges (ON DELETE picker + Delete)
- Status bar: table count, relation count, issue count, schema name, dialect
- Keyboard: Delete/Backspace (remove selection), Cmd/Ctrl+S (open SQL preview)
- Confirm dialog before Clear all
- SQL preview dialog with Copy + Download

### Persistence
- localStorage auto-save (`draft-sql-schema-v1`): nodes, edges, schemaName
- Hydration in two phases to avoid wiping the saved schema on first render

### SQL generation (`lib/sql.ts`)
- All identifiers quoted with PG escaping (no injection from user names)
- `CREATE SCHEMA IF NOT EXISTS` + `SET search_path` when schema name is set
- `CREATE TABLE` with inline PK/NN/UQ (PK suppresses redundant UQ; PK implies NN)
- Composite primary keys → table-level `PRIMARY KEY (col1, col2)` constraint
- `ALTER TABLE … ADD CONSTRAINT … FOREIGN KEY … REFERENCES … ON DELETE …`

### Validation (`lib/validation.ts`)
- Empty table name, empty column name
- Duplicate table names (case-insensitive)
- Duplicate column names within a table (case-insensitive)
- Inline red borders on invalid inputs; banner with issue count
- Export button disabled while issues > 0

## File map
- `app/page.tsx` — main page, state, keyboard handlers, dialogs
- `components/TableNode.tsx` — table card on the canvas + handles + `columnIdFromHandle`
- `components/FkEdge.tsx` — custom edge with arrow + label + edgeTypes export
- `components/Sidebar.tsx` — right panel with table editor + ConstraintToggle
- `lib/schema.ts` — types (TableNodeType, FkEdgeType, ColumnDef, FkAction) + `uniqueName`
- `lib/storage.ts` — load/save/clear localStorage
- `lib/sql.ts` — `generateSql` + `downloadSql` + identifier quoting
- `lib/validation.ts` — schema validation + helpers for inline display

## Not done / possible next steps

- **Edge sidebar mode** — when an edge is selected, show its options in the sidebar
  instead of (or alongside) the right-click menu. Would also be the place to add
  ON UPDATE actions, FK names, etc.
- **DEFAULT values on columns** — CREATE TABLE clause + UI toggle
- **Indexes** — CREATE INDEX support
- **Reserved-word warning** — gentle hint when a name matches a SQL keyword
- **Column reorder** — drag-handle or up/down buttons inside a table
- **Undo/redo** — would need a small history stack
- **Self-referencing FK styling** — currently allowed but visually awkward
- **Tests** — none yet, see CLAUDE.md §13

## Known minor issues
- Select-all (Cmd+A) doesn't work on the canvas; only mouse selection
