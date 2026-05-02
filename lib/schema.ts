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

export type FkEdgeData = {
  sourceColumnId: string;
  targetColumnId: string;
};

export type FkEdgeType = Edge<FkEdgeData, "fk">;
