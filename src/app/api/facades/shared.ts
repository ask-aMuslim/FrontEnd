import { Observable, map } from 'rxjs';

interface Envelope<T> {
    data?: T | null;
}

type JsonRecord = Record<string, unknown>;

const collectionKeys = ['data', 'Data', 'items', 'Items', '$values', 'value', 'Value', 'results', 'Results'] as const;
const maxDepth = 6;

export function extractData<T>(source: Observable<unknown>, fallback: T): Observable<T> {
    return source.pipe(
        map((value) => {
            const arrayFallback = Array.isArray(fallback);

            if (arrayFallback) {
                const extractedArray = extractArrayValue(value);
                if (Array.isArray(extractedArray)) {
                    return extractedArray as T;
                }
            }

            const extractedRecord = extractRecordValue<T>(value);
            return extractedRecord ?? fallback;
        })
    );
}

export function asArray<T>(value: T[] | null | undefined): T[] {
    return Array.isArray(value) ? value : [];
}

function extractArrayValue(value: unknown): unknown[] | null {
    if (Array.isArray(value)) {
        return value;
    }

    const record = asRecord(value);
    if (!record) {
        return null;
    }

    return findArray(record, maxDepth, new Set<unknown>());
}

function extractRecordValue<T>(value: unknown): T | null {
    const record = asRecord(value);
    if (!record) {
        return (value as T | null | undefined) ?? null;
    }

    for (const key of collectionKeys) {
        const nested = asRecord(record[key]);
        if (nested) {
            return nested as T;
        }
    }

    if ('data' in record) {
        const envelope = record as Envelope<T>;
        return envelope.data ?? null;
    }

    return record as T;
}

function findArray(record: JsonRecord, depth: number, visited: Set<unknown>): unknown[] | null {
    if (depth < 0 || visited.has(record)) {
        return null;
    }

    visited.add(record);

    const fromPreferredKeys = findArrayInPreferredKeys(record);
    if (fromPreferredKeys) {
        return fromPreferredKeys;
    }

    const fromPreferredNested = findArrayInPreferredNested(record, depth, visited);
    if (fromPreferredNested) {
        return fromPreferredNested;
    }

    return findArrayInObjectValues(record, depth, visited);
}

function findArrayInPreferredKeys(record: JsonRecord): unknown[] | null {
    for (const key of collectionKeys) {
        const value = record[key];
        if (Array.isArray(value)) {
            return value;
        }
    }

    return null;
}

function findArrayInPreferredNested(
    record: JsonRecord,
    depth: number,
    visited: Set<unknown>,
): unknown[] | null {
    for (const key of collectionKeys) {
        const nested = asRecord(record[key]);
        if (!nested) {
            continue;
        }

        const nestedArray = findArray(nested, depth - 1, visited);
        if (nestedArray) {
            return nestedArray;
        }
    }

    return null;
}

function findArrayInObjectValues(
    record: JsonRecord,
    depth: number,
    visited: Set<unknown>,
): unknown[] | null {
    for (const value of Object.values(record)) {
        if (Array.isArray(value)) {
            return value;
        }

        const nested = asRecord(value);
        if (!nested) {
            continue;
        }

        const nestedArray = findArray(nested, depth - 1, visited);
        if (nestedArray) {
            return nestedArray;
        }
    }

    return null;
}

function asRecord(value: unknown): JsonRecord | null {
    return value && typeof value === 'object' ? (value as JsonRecord) : null;
}
