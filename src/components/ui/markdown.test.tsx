import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Markdown } from "./markdown";

const html = (src: string) => renderToStaticMarkup(<Markdown source={src} />);

describe("Markdown", () => {
  it("renders headings, lists and inline formatting", () => {
    const out = html("## Title\n\n- **one**\n- *two*\n\n1. a\n2. b\n\nText with `code`.");
    expect(out).toContain("<h2");
    expect(out).toContain("<strong>one</strong>");
    expect(out).toContain("<em>two</em>");
    expect(out).toContain("<ol");
    expect(out).toContain("<code");
  });

  it("never injects raw HTML", () => {
    const out = html('<script>alert(1)</script> <img src=x onerror="x">');
    expect(out).not.toContain("<script>");
    expect(out).not.toContain("<img");
    expect(out).toContain("&lt;script&gt;");
  });

  it("drops unsafe link protocols", () => {
    expect(html("[bad](javascript:alert(1))")).not.toContain("href");
    expect(html("[ok](https://example.com)")).toContain('href="https://example.com"');
    expect(html("[local](/faq)")).toContain('href="/faq"');
    expect(html("[proto-relative](//evil.com)")).not.toContain("href");
  });
});
