import type { TableNodeType } from "@/lib/schema";

// Each issue points to a specific spot the user can fix. The shape is flat
// (rather than nested per-table) so the consumer can decide how to display
// them — top-level banner, inline marker, etc.
export type ValidationIssue =
  | { kind: "duplicate-table"; name: string; nodeIds: string[] }
  | {
      kind: "duplicate-column";
      nodeId: string;
      tableName: string;
      columnName: string;
      columnIds: string[];
    }
  | { kind: "empty-table-name"; nodeId: string }
  | { kind: "empty-column-name"; nodeId: string; columnId: string };

// Group items by a key, keeping only buckets with more than one entry.
function findDuplicates<T>(items: T[], keyOf: (item: T) => string): Map<string, T[]> {
  const buckets = new Map<string, T[]>();
  for (const item of items) {
    const key = keyOf(item);
    if (!key) continue; // empty names are checked separately
    const bucket = buckets.get(key) ?? [];
    bucket.push(item);
    buckets.set(key, bucket);
  }
  for (const [key, bucket] of buckets) {
    if (bucket.length < 2) buckets.delete(key);
  }
  return buckets;
}

export function validateSchema(nodes: TableNodeType[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Empty table names
  for (const node of nodes) {
    if (!node.data.name.trim()) {
      issues.push({ kind: "empty-table-name", nodeId: node.id });
    }
  }

  // Duplicate table names (case-insensitive — PostgreSQL folds unquoted
  // identifiers but quoted ones are case-sensitive; for UX we treat any
  // case-insensitive collision as a problem since users almost never
  // intend two tables that differ only by case).
  const tableDupes = findDuplicates(nodes, (n) => n.data.name.trim().toLowerCase());
  for (const [name, dupedNodes] of tableDupes) {
    issues.push({
      kind: "duplicate-table",
      name,
      nodeIds: dupedNodes.map((n) => n.id),
    });
  }

  // Per-table column checks
  for (const node of nodes) {
    for (const col of node.data.columns) {
      if (!col.name.trim()) {
        issues.push({
          kind: "empty-column-name",
          nodeId: node.id,
          columnId: col.id,
        });
      }
    }
    const colDupes = findDuplicates(node.data.columns, (c) =>
      c.name.trim().toLowerCase(),
    );
    for (const [name, dupedCols] of colDupes) {
      issues.push({
        kind: "duplicate-column",
        nodeId: node.id,
        tableName: node.data.name,
        columnName: name,
        columnIds: dupedCols.map((c) => c.id),
      });
    }
  }

  return issues;
}

// Convenience selector for the sidebar — gives a column-id-keyed set
// of "this column is invalid" so the input can show a red border.
export function invalidColumnIds(
  issues: ValidationIssue[],
  nodeId: string,
): Set<string> {
  const ids = new Set<string>();
  for (const issue of issues) {
    if (issue.kind === "duplicate-column" && issue.nodeId === nodeId) {
      for (const id of issue.columnIds) ids.add(id);
    }
    if (issue.kind === "empty-column-name" && issue.nodeId === nodeId) {
      ids.add(issue.columnId);
    }
  }
  return ids;
}

export function isTableNameInvalid(
  issues: ValidationIssue[],
  nodeId: string,
  tableName: string,
): boolean {
  const normalized = tableName.trim().toLowerCase();
  return issues.some(
    (i) =>
      (i.kind === "empty-table-name" && i.nodeId === nodeId) ||
      (i.kind === "duplicate-table" && i.name === normalized),
  );
}
