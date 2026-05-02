import type { Node, Edge } from "@xyflow/react";

export const SQL_TYPES = [
  "CHAR",
  "VARCHAR",
  "INTEGER",
  "BOOLEAN",
  "TIMESTAMP",
  "UUID",
  "NUMERIC",
] as const;

export type SqlType = (typeof SQL_TYPES)[number];

export type ColumnDef = {
  id: string;
  name: string;
  type: SqlType;
  length?: number; // only relevant for VARCHAR
  // Constraint flags. All optional; absence means false. Stored separately
  // (rather than as a "constraints" array) because the trio is bounded and
  // toggling a single one stays a simple boolean flip.
  primaryKey?: boolean;
  notNull?: boolean;
  unique?: boolean;
};

export type TableNodeData = {
  name: string;
  columns: ColumnDef[];
};

export type TableNodeType = Node<TableNodeData, "table">;

// Standard PostgreSQL referential actions. NO ACTION is the default and
// emits no clause (PostgreSQL behaves that way implicitly).
export const FK_ACTIONS = [
  "NO ACTION",
  "CASCADE",
  "RESTRICT",
  "SET NULL",
  "SET DEFAULT",
] as const;
export type FkAction = (typeof FK_ACTIONS)[number];

// Cardinality at each end of a relationship. "one" = perpendicular bar marker,
// "many" = crow's foot. Default convention is many-on-source / one-on-target,
// matching the typical FK pattern (many orders reference one user).
export const CARDINALITIES = ["one", "many"] as const;
export type Cardinality = (typeof CARDINALITIES)[number];

export type FkEdgeData = {
  sourceColumnId: string;
  targetColumnId: string;
  onDelete?: FkAction;
  sourceCardinality?: Cardinality;
  targetCardinality?: Cardinality;
};

export type FkEdgeType = Edge<FkEdgeData, "fk">;

// Generate a name like "table_3" that doesn't collide with any name in `existing`.
// Used when creating new tables/columns so the user doesn't immediately get a
// validation error. Comparison is case-insensitive to match the validator.
export function uniqueName(base: string, existing: string[]): string {
  const taken = new Set(existing.map((n) => n.trim().toLowerCase()));
  let i = 1;
  while (taken.has(`${base}_${i}`.toLowerCase())) i++;
  return `${base}_${i}`;
}
