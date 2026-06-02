import { describe, it, expect } from "vitest";

import { highlightExcerptHtml, sanitizeSourceUrl } from "@/lib/highlight-excerpt";



describe("highlightExcerptHtml", () => {

  it("escapes HTML when no highlight terms", () => {

    const out = highlightExcerptHtml('<script>alert("x")</script>', []);

    expect(out).not.toContain("<script>");

    expect(out).toContain("&lt;script&gt;");

  });



  it("escapes HTML inside matched highlight segments", () => {

    const out = highlightExcerptHtml("regra <b>banimento</b> aplicada", ["banimento"]);

    expect(out).not.toContain("<b>");

    expect(out).toContain("&lt;b&gt;");

    expect(out).toContain("<mark");

  });

});



describe("sanitizeSourceUrl", () => {

  it("allows https URLs", () => {

    expect(sanitizeSourceUrl("https://example.com/doc")).toBe("https://example.com/doc");

  });



  it("blocks javascript URLs", () => {

    expect(sanitizeSourceUrl("javascript:alert(1)")).toBeNull();

  });

});


