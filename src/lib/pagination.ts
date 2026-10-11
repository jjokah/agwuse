export interface PageOptions {
  defaultSize?: number;
  maxSize?: number;
}

export interface ParsedPageParams {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

export interface PageMetaInput {
  totalItems: number;
  page: number;
  pageSize: number;
}

export interface PageMeta {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export type PageWindowItem = number | "ellipsis";

export type SearchParamsLike =
  | Record<string, string | string[] | undefined>
  | URLSearchParams
  | undefined
  | null;

/**
 * Safely parses `page` and `pageSize` (or `limit`) from searchParams.
 * Clamps page to >= 1, and pageSize to 1..maxSize.
 */
export function parsePageParams(
  sp: SearchParamsLike,
  options: PageOptions = {},
): ParsedPageParams {
  const defaultSize = options.defaultSize ?? 25;
  const maxSize = options.maxSize ?? 100;

  let rawPage: string | undefined;
  let rawPageSize: string | undefined;

  if (sp instanceof URLSearchParams) {
    rawPage = sp.getAll("page").length === 1 ? sp.get("page") ?? undefined : undefined;
    const key = sp.has("pageSize") ? "pageSize" : "limit";
    rawPageSize = sp.getAll(key).length === 1 ? sp.get(key) ?? undefined : undefined;
  } else if (sp && typeof sp === "object") {
    const p = sp.page;
    rawPage = Array.isArray(p) ? undefined : p;
    const ps = sp.pageSize ?? sp.limit;
    rawPageSize = Array.isArray(ps) ? undefined : ps;
  }

  const parsedPage = /^\d+$/.test(rawPage ?? "") ? Number(rawPage) : NaN;
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 && parsedPage <= 1_000_000 ? parsedPage : 1;

  const parsedSize = /^\d+$/.test(rawPageSize ?? "") ? Number(rawPageSize) : NaN;
  let pageSize = Number.isFinite(parsedSize) && parsedSize > 0 ? parsedSize : defaultSize;
  if (pageSize > maxSize) pageSize = maxSize;

  const skip = (page - 1) * pageSize;
  const take = pageSize;

  return { page, pageSize, skip, take };
}

/**
 * Computes pagination metadata given total item count and current pagination parameters.
 */
export function pageMeta({ totalItems, page, pageSize }: PageMetaInput): PageMeta {
  const safeTotal = Math.max(0, totalItems);
  const safeSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(safeTotal / safeSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  return {
    totalItems: safeTotal,
    totalPages,
    currentPage,
    pageSize: safeSize,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
}

/** Resolve a requested page from a count before fetching rows or calculating an offset. */
export function resolvePage(params: ParsedPageParams, total: number): ParsedPageParams {
  const page = pageMeta({ totalItems: total, page: params.page, pageSize: params.pageSize }).currentPage;
  return { ...params, page, skip: (page - 1) * params.pageSize };
}

/**
 * Generates a window of page numbers and ellipsis tokens for rendering pagination bars.
 */
export function pageWindow(
  currentPage: number,
  totalPages: number,
  maxVisible = 5,
): PageWindowItem[] {
  if (totalPages <= 1) return [1];

  const total = Math.max(1, totalPages);
  const current = Math.min(Math.max(1, currentPage), total);

  if (total <= maxVisible + 2) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const items: PageWindowItem[] = [];
  const sidePages = Math.floor((maxVisible - 2) / 2);

  const leftBound = Math.max(2, current - sidePages);
  const rightBound = Math.min(total - 1, current + sidePages);

  // Always include first page
  items.push(1);

  if (leftBound > 2) {
    items.push("ellipsis");
  }

  for (let p = leftBound; p <= rightBound; p++) {
    items.push(p);
  }

  if (rightBound < total - 1) {
    items.push("ellipsis");
  }

  // Always include last page
  items.push(total);

  return items;
}

/**
 * Preserves existing query params while overriding or removing specified parameters.
 * Deletes keys when value is null, undefined, or empty string.
 */
export function hrefWithParams(
  basePath: string,
  searchParams: SearchParamsLike,
  newParams: Record<string, string | number | null | undefined>,
): string {
  const params = new URLSearchParams();

  if (searchParams instanceof URLSearchParams) {
    searchParams.forEach((val, key) => {
      params.set(key, val);
    });
  } else if (searchParams && typeof searchParams === "object") {
    for (const [key, val] of Object.entries(searchParams)) {
      if (val !== undefined && val !== null) {
        if (Array.isArray(val)) {
          if (val[0]) params.set(key, val[0]);
        } else {
          params.set(key, val);
        }
      }
    }
  }

  for (const [key, val] of Object.entries(newParams)) {
    if (val === null || val === undefined || val === "" || (key === "page" && val === 1)) {
      params.delete(key);
    } else {
      params.set(key, String(val));
    }
  }

  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}
