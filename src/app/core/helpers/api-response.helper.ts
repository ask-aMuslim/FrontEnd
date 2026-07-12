export type ApiRecord = Record<string, unknown>;

const collectionKeys = [
  '$values',
  'data',
  'Data',
  'items',
  'Items',
  'results',
  'Results',
  'events',
  'Events',
  'value',
  'Value',
  'records',
  'Records',
] as const;

const maxSearchDepth = 6;

export function asRecord(value: unknown): ApiRecord | null {
  return value && typeof value === 'object' ? (value as ApiRecord) : null;
}

export function getValue(record: ApiRecord | null, ...keys: string[]): unknown {
  if (!record) {
    return undefined;
  }

  for (const key of keys) {
    if (key in record) {
      return record[key];
    }
  }

  return undefined;
}

export function extractArray(response: unknown): readonly unknown[] {
  if (Array.isArray(response)) {
    return response;
  }

  const root = asRecord(response);
  if (!root) {
    return [];
  }

  return findArrayInRecord(root, maxSearchDepth, new Set<unknown>());
}

function findArrayInRecord(
  record: ApiRecord,
  depth: number,
  visited: Set<unknown>,
): readonly unknown[] {
  if (depth < 0 || visited.has(record)) {
    return [];
  }

  visited.add(record);

  const fromPreferredKeys = findArrayInPreferredKeys(record);
  if (fromPreferredKeys.length > 0) {
    return fromPreferredKeys;
  }

  const fromPreferredNested = findArrayInPreferredNested(record, depth, visited);
  if (fromPreferredNested.length > 0) {
    return fromPreferredNested;
  }

  return findArrayInAllValues(record, depth, visited);
}

function findArrayInPreferredKeys(record: ApiRecord): readonly unknown[] {
  for (const key of collectionKeys) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

function findArrayInPreferredNested(
  record: ApiRecord,
  depth: number,
  visited: Set<unknown>,
): readonly unknown[] {
  for (const key of collectionKeys) {
    const nested = asRecord(record[key]);
    if (!nested) {
      continue;
    }

    const nestedArray = findArrayInRecord(nested, depth - 1, visited);
    if (nestedArray.length > 0) {
      return nestedArray;
    }
  }

  return [];
}

function findArrayInAllValues(
  record: ApiRecord,
  depth: number,
  visited: Set<unknown>,
): readonly unknown[] {
  for (const value of Object.values(record)) {
    if (Array.isArray(value)) {
      return value;
    }

    const nested = asRecord(value);
    if (!nested) {
      continue;
    }

    const nestedArray = findArrayInRecord(nested, depth - 1, visited);
    if (nestedArray.length > 0) {
      return nestedArray;
    }
  }

  return [];
}

export function extractRecord(response: unknown): ApiRecord | null {
  const record = asRecord(response);
  if (!record) {
    return null;
  }

  for (const key of collectionKeys) {
    const nested = asRecord(record[key]);
    if (nested) {
      return nested;
    }
  }

  return record;
}

export function toStringValue(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

export function toNumberValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (entry && typeof entry === 'object') {
          const rec = entry as Record<string, unknown>;
          const val = rec['name'] ?? rec['Name'] ?? rec['title'] ?? rec['Title'] ?? rec['id'] ?? rec['Id'];
          return toStringValue(val);
        }
        return toStringValue(entry);
      })
      .filter((entry): entry is string => entry !== null);
  }

  if (value && typeof value === 'object') {
    const rec = value as Record<string, unknown>;
    const val = rec['name'] ?? rec['Name'] ?? rec['title'] ?? rec['Title'] ?? rec['id'] ?? rec['Id'];
    const str = toStringValue(val);
    return str ? [str] : [];
  }

  const text = toStringValue(value);
  if (!text) {
    return [];
  }

  return text
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

export function toBooleanValue(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value === 1;
  }

  if (typeof value === 'string') {
    const lowered = value.trim().toLowerCase();
    return lowered === 'true' || lowered === '1';
  }

  return false;
}
