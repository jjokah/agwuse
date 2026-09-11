import { describe, it, expect } from "vitest";
import { escapeCsvCell, toCsv } from "@/lib/csv";

describe("escapeCsvCell", () => {
  it("leaves normal text alone", () => {
    expect(escapeCsvCell("Hello World")).toBe("Hello World");
  });

  it("leaves plain numbers alone", () => {
    expect(escapeCsvCell("42")).toBe("42");
    expect(escapeCsvCell("-3.14")).toBe("-3.14");
    expect(escapeCsvCell("0")).toBe("0");
  });

  it("prefixes cells starting with =", () => {
    expect(escapeCsvCell("=SUM(A1:A10)")).toBe("'=SUM(A1:A10)");
  });

  it("prefixes cells starting with +", () => {
    expect(escapeCsvCell("+cmd|' /C calc'!A0")).toBe("'+cmd|' /C calc'!A0");
  });

  it("prefixes cells starting with -", () => {
    // Negative numbers are left alone
    expect(escapeCsvCell("-42")).toBe("-42");
    // But text starting with - is prefixed
    expect(escapeCsvCell("-cmd")).toBe("'-cmd");
  });

  it("prefixes cells starting with @", () => {
    expect(escapeCsvCell("@SUM(A1)")).toBe("'@SUM(A1)");
  });

  it("prefixes cells starting with tab", () => {
    expect(escapeCsvCell("\tcmd")).toBe("'\tcmd");
  });

  it("returns empty string as-is", () => {
    expect(escapeCsvCell("")).toBe("");
  });
});

describe("toCsv", () => {
  it("generates CSV with headers and rows", () => {
    const rows = [
      { name: "Alice", amount: "100" },
      { name: "Bob", amount: "200" },
    ];
    const csv = toCsv(rows);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("name,amount");
    expect(lines[1]).toBe("Alice,100");
    expect(lines[2]).toBe("Bob,200");
  });

  it("escapes dangerous values in output", () => {
    const rows = [{ formula: "=SUM(A1)" }];
    const csv = toCsv(rows);
    expect(csv).toContain("'=SUM(A1)");
  });

  it("handles values with commas", () => {
    const rows = [{ name: "Last, First" }];
    const csv = toCsv(rows);
    expect(csv).toContain('"Last, First"');
  });

  it("returns empty string for no rows", () => {
    expect(toCsv([])).toBe("");
  });
});
