/**
 * Server-side CSV generation with injection protection.
 *
 * Cells starting with = + - @ \t \r are prefixed with a single quote
 * to prevent formula injection when the CSV is opened in Excel.
 * Plain numbers are left alone.
 */

const DANGEROUS_PREFIXES = ["=", "+", "-", "@", "\t", "\r"];

export function escapeCsvCell(value: string): string {
  if (!value) return value;
  // Plain numbers are safe
  if (/^-?\d+(\.\d+)?$/.test(value)) return value;
  if (DANGEROUS_PREFIXES.some((p) => value.startsWith(p))) {
    return `'${value}`;
  }
  return value;
}

/**
 * Convert an array of objects to a CSV string.
 * All cell values are run through escapeCsvCell.
 */
export function toCsv(
  rows: Record<string, string | number | null | undefined>[],
  columns?: string[],
): string {
  const keys = columns ?? (rows.length > 0 ? Object.keys(rows[0]) : []);
  if (keys.length === 0) return "";
  // With explicit columns, an empty result still yields a header row

  const header = keys.map((k) => escapeCsvValue(k)).join(",");
  const body = rows
    .map((row) =>
      keys
        .map((k) => {
          const raw = row[k];
          const str = raw == null ? "" : String(raw);
          return escapeCsvValue(escapeCsvCell(str));
        })
        .join(","),
    )
    .join("\n");

  return rows.length > 0 ? `${header}\n${body}` : header;
}

/** Wrap a value in double quotes if it contains commas, quotes or newlines. */
function escapeCsvValue(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Client-side CSV download trigger. Uses toCsv to ensure cell values
 * are protected against formula injection.
 */
export function exportToCSV(
  data: Record<string, string | number | null | undefined>[],
  filename: string,
): void {
  const csv = toCsv(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
