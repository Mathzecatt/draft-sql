# Draft_SQL - https://draft-sql.vercel.app/

Web-based visual database schema designer. Drag tables onto a canvas, define
columns and constraints, draw foreign-key relationships, and export ready-to-run
PostgreSQL DDL.

No backend, no account, no signup — everything lives in your browser's
localStorage. Open the page, build a schema, copy the SQL, paste into psql.

## Features

- **Visual canvas** built on React Flow: pan, zoom, drag tables, snap nothing.
- **Tables and columns** with types: CHAR, VARCHAR (with length), INTEGER,
  BOOLEAN, TIMESTAMP, UUID, NUMERIC.
- **Constraints per column**: PRIMARY KEY, NOT NULL, UNIQUE.
- **Foreign keys**: drag from a column's right handle to another column's left
  handle. Edges show a `table.column → table.column` label and an arrow at the
  target end.
- **SQL export**: preview, copy to clipboard, or download as `.sql`. Generates
  `CREATE SCHEMA`, `CREATE TABLE`, and `ALTER TABLE … ADD CONSTRAINT … FOREIGN KEY`
  statements with all identifiers properly quoted.
- **Validation**: duplicate or empty table/column names are flagged inline and
  block the export until fixed.
- **Persistence**: schema auto-saves to localStorage and restores on reload.
- **Keyboard**: `Delete` / `Backspace` removes the selected nodes or edges.
- **Theme**: light/dark toggle.

## Stack

- Next.js 16 (App Router, Turbopack)
- TypeScript (strict)
- Tailwind CSS 4
- shadcn/ui (Radix primitives, Mira theme)
- @xyflow/react

## Local development

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## Deploy

Pushes to `main` auto-deploy to Vercel.
