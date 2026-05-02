import type { TableNodeType, FkEdgeType } from "@/lib/schema";

const STORAGE_KEY = "draft-sql-schema-v1";

// Bumping this version (the -v1 suffix) is the right move if the schema shape
// ever changes incompatibly — old payloads simply won't be read.

export type StoredSchema = {
  nodes: TableNodeType[];
  edges: FkEdgeType[];
  schemaName?: string;
};

export function loadSchema(): StoredSchema | null {
  if (typeof window === "undefined") return null; // SSR guard
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSchema;
    // Minimal sanity check — if the shape is wrong, drop it instead of crashing the app.
    if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSchema(schema: StoredSchema): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(schema));
  } catch {
    // Quota exceeded or storage disabled — silently ignore. We could surface
    // a toast later but it's not worth crashing the app over.
  }
}

export function clearSchema(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
