import { describe, it, expect } from "vitest";
import { sanitizeHtml } from "@/lib/sanitize";

describe("HTML Sanitization", () => {
  it("strips script tags and malicious code", () => {
    const malicious = '<p>Hello</p><script>alert("xss")</script>';
    expect(sanitizeHtml(malicious)).toBe("<p>Hello</p>");
  });

  it("strips dangerous event handlers", () => {
    const malicious = '<img src="x" onerror="alert(1)" /><p>Text</p>';
    expect(sanitizeHtml(malicious)).not.toContain("onerror");
  });

  it("strips javascript: URIs in links", () => {
    const malicious = '<a href="javascript:alert(1)">Click me</a>';
    expect(sanitizeHtml(malicious)).not.toContain("javascript:");
  });

  it("preserves safe HTML tags", () => {
    const safe = "<h1>Title</h1><p>This is <strong>bold</strong> and <em>italic</em>.</p>";
    expect(sanitizeHtml(safe)).toBe(safe);
  });
});
