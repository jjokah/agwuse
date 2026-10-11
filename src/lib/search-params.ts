import type { SearchParamsLike } from "@/lib/pagination";

/** Repeated scalar parameters are invalid; never choose the first or last value. */
export function scalarParam(params: SearchParamsLike, key: string): string | undefined {
  if (params instanceof URLSearchParams) {
    const values = params.getAll(key);
    return values.length === 1 ? values[0] : undefined;
  }
  const value = params?.[key];
  return typeof value === "string" ? value : undefined;
}

export function normalizeSearchParams(params: SearchParamsLike): Record<string, string | undefined> {
  const keys = params instanceof URLSearchParams ? [...params.keys()] : Object.keys(params ?? {});
  return Object.fromEntries(keys.map((key) => [key, scalarParam(params, key)]));
}

export function enumParam<T extends string>(value: string | undefined, values: readonly T[]): T | undefined {
  return values.includes(value as T) ? value as T : undefined;
}
