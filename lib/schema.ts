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
