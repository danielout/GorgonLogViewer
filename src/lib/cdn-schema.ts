/** Inferred type for a JSON field */
export type FieldType = "string" | "number" | "boolean" | "null" | "object" | "array" | "mixed";

export interface FieldInfo {
  name: string;
  types: Set<string>;
  /** How many entries have this field */
  count: number;
  /** Total entries analyzed */
  total: number;
  /** Sample values (up to 3) */
  samples: string[];
  /** Child fields if this is an object */
  children?: FieldInfo[];
}

export interface CdnSchemaInfo {
  /** Name of the CDN file */
  fileName: string;
  /** Whether the root is an object (keyed) or array */
  rootType: "object" | "array";
  /** Number of top-level entries */
  entryCount: number;
  /** Fields found across all entries */
  fields: FieldInfo[];
}

function inferType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function collectSample(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string") return value.length > 50 ? value.slice(0, 50) + "..." : value;
  if (typeof value === "object") return Array.isArray(value) ? `[${(value as unknown[]).length} items]` : "{...}";
  return String(value);
}

function analyzeFields(entries: unknown[], maxSamples = 3): FieldInfo[] {
  const fieldMap = new Map<string, { types: Set<string>; count: number; samples: string[]; childEntries: unknown[] }>();

  for (const entry of entries) {
    if (typeof entry !== "object" || entry === null) continue;
    const obj = entry as Record<string, unknown>;
    for (const [key, value] of Object.entries(obj)) {
      let info = fieldMap.get(key);
      if (!info) {
        info = { types: new Set(), count: 0, samples: [], childEntries: [] };
        fieldMap.set(key, info);
      }
      info.types.add(inferType(value));
      info.count++;
      if (info.samples.length < maxSamples) {
        info.samples.push(collectSample(value));
      }
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        info.childEntries.push(value);
      }
    }
  }

  const total = entries.length;
  const fields: FieldInfo[] = [];

  for (const [name, info] of fieldMap) {
    const field: FieldInfo = {
      name,
      types: info.types,
      count: info.count,
      total,
      samples: info.samples,
    };
    // Recurse into object children (only 1 level deep to keep it manageable)
    if (info.childEntries.length > 0 && info.types.has("object")) {
      field.children = analyzeFields(info.childEntries, 2);
    }
    fields.push(field);
  }

  // Sort: required fields first (count === total), then by frequency
  fields.sort((a, b) => {
    if (a.count === total && b.count !== total) return -1;
    if (b.count === total && a.count !== total) return 1;
    return b.count - a.count;
  });

  return fields;
}

/** Analyze a parsed CDN JSON and produce schema info */
export function analyzeCdnSchema(data: unknown, fileName: string): CdnSchemaInfo {
  const isArray = Array.isArray(data);
  let entries: unknown[];

  if (isArray) {
    entries = data as unknown[];
  } else if (typeof data === "object" && data !== null) {
    entries = Object.values(data as Record<string, unknown>);
  } else {
    return { fileName, rootType: "object", entryCount: 0, fields: [] };
  }

  return {
    fileName,
    rootType: isArray ? "array" : "object",
    entryCount: entries.length,
    fields: analyzeFields(entries),
  };
}
