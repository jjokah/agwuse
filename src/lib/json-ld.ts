/**
 * Serializes a JSON-LD object for embedding in <script type="application/ld+json">.
 *
 * JSON.stringify does not escape "<", so a value such as "</script><script>…"
 * would close the script element and inject markup. Replacing <, >, & and the
 * JS line/paragraph separators with JSON unicode escapes keeps the payload inert
 * while remaining valid JSON that parses back to the same value.
 */
const ESCAPES: Record<string, string> = Object.fromEntries(
  [0x3c, 0x3e, 0x26, 0x2028, 0x2029].map((code) => [
    String.fromCharCode(code),
    String.fromCharCode(92) + "u" + code.toString(16).padStart(4, "0"),
  ]),
);

const UNSAFE_CHARS = new RegExp(`[${Object.keys(ESCAPES).join("")}]`, "g");

export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(UNSAFE_CHARS, (char) => ESCAPES[char]);
}
