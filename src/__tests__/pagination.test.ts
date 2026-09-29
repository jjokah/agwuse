import { describe, it, expect } from "vitest";
import {
  parsePageParams,
  pageMeta,
  pageWindow,
  hrefWithParams,
} from "@/lib/pagination";

describe("parsePageParams", () => {
  it("defaults to page 1 and defaultSize 25 when empty", () => {
    const result = parsePageParams(undefined);
    expect(result).toEqual({ page: 1, pageSize: 25, skip: 0, take: 25 });
  });

  it("parses valid page and pageSize numbers", () => {
    const result = parsePageParams({ page: "3", pageSize: "10" });
    expect(result).toEqual({ page: 3, pageSize: 10, skip: 20, take: 10 });
  });

  it("supports limit as alternative to pageSize", () => {
    const result = parsePageParams({ page: "2", limit: "50" });
    expect(result).toEqual({ page: 2, pageSize: 50, skip: 50, take: 50 });
  });

  it("handles URLSearchParams instance", () => {
    const sp = new URLSearchParams("page=4&pageSize=15");
    const result = parsePageParams(sp);
    expect(result).toEqual({ page: 4, pageSize: 15, skip: 45, take: 15 });
  });

  it("clamps invalid, non-numeric, or negative page to 1", () => {
    expect(parsePageParams({ page: "-5" }).page).toBe(1);
    expect(parsePageParams({ page: "0" }).page).toBe(1);
    expect(parsePageParams({ page: "abc" }).page).toBe(1);
  });

  it("clamps pageSize to maxSize", () => {
    const result = parsePageParams({ pageSize: "500" }, { maxSize: 50 });
    expect(result.pageSize).toBe(50);
  });

  it("clamps negative or zero pageSize to defaultSize", () => {
    const result = parsePageParams({ pageSize: "0" }, { defaultSize: 20 });
    expect(result.pageSize).toBe(20);
  });
});

describe("pageMeta", () => {
  it("calculates totalPages and boundaries correctly", () => {
    const meta = pageMeta({ totalItems: 95, page: 2, pageSize: 25 });
    expect(meta.totalPages).toBe(4);
    expect(meta.currentPage).toBe(2);
    expect(meta.hasNextPage).toBe(true);
    expect(meta.hasPrevPage).toBe(true);
    expect(meta.totalItems).toBe(95);
  });

  it("handles empty results (0 items)", () => {
    const meta = pageMeta({ totalItems: 0, page: 1, pageSize: 25 });
    expect(meta.totalPages).toBe(1);
    expect(meta.currentPage).toBe(1);
    expect(meta.hasNextPage).toBe(false);
    expect(meta.hasPrevPage).toBe(false);
  });

  it("handles first and last page boundaries", () => {
    const first = pageMeta({ totalItems: 50, page: 1, pageSize: 25 });
    expect(first.hasNextPage).toBe(true);
    expect(first.hasPrevPage).toBe(false);

    const last = pageMeta({ totalItems: 50, page: 2, pageSize: 25 });
    expect(last.hasNextPage).toBe(false);
    expect(last.hasPrevPage).toBe(true);
  });
});

describe("pageWindow", () => {
  it("returns [1] when totalPages is 1", () => {
    expect(pageWindow(1, 1)).toEqual([1]);
  });

  it("returns full list when totalPages <= maxVisible + 2", () => {
    expect(pageWindow(3, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("includes right ellipsis when near the beginning", () => {
    const window = pageWindow(2, 10, 5);
    expect(window).toEqual([1, 2, 3, "ellipsis", 10]);
  });

  it("includes left ellipsis when near the end", () => {
    const window = pageWindow(9, 10, 5);
    expect(window).toEqual([1, "ellipsis", 8, 9, 10]);
  });

  it("includes both ellipses when in the middle", () => {
    const window = pageWindow(5, 10, 5);
    expect(window).toEqual([1, "ellipsis", 4, 5, 6, "ellipsis", 10]);
  });
});

describe("hrefWithParams", () => {
  it("generates clean URL preserving existing query params", () => {
    const result = hrefWithParams("/admin/users", { search: "john", role: "MEMBER" }, { page: 2 });
    expect(result).toBe("/admin/users?search=john&role=MEMBER&page=2");
  });

  it("omits page=1 from the URL for cleaner links", () => {
    const result = hrefWithParams("/admin/users", { search: "john", page: "3" }, { page: 1 });
    expect(result).toBe("/admin/users?search=john");
  });

  it("removes keys when given null or empty string", () => {
    const result = hrefWithParams(
      "/admin/users",
      { search: "john", role: "MEMBER" },
      { role: null, page: 2 },
    );
    expect(result).toBe("/admin/users?search=john&page=2");
  });

  it("handles URLSearchParams input", () => {
    const sp = new URLSearchParams("type=TITHE&page=2");
    const result = hrefWithParams("/admin/finance", sp, { page: 3 });
    expect(result).toBe("/admin/finance?type=TITHE&page=3");
  });

  it("returns basePath when no query params remain", () => {
    const result = hrefWithParams("/admin/users", { page: "2" }, { page: 1 });
    expect(result).toBe("/admin/users");
  });
});
