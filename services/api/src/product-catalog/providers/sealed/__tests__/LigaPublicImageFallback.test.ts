import { describe, expect, it } from "vitest";
import { parseLigaPublicProductHtml } from "../LigaPublicImageFallback.js";

describe("LigaPublicImageFallback", () => {
  it("extracts only name, expansion, type and og:image — ignores prices", () => {
    const html = `
      <html><head>
        <meta property="og:title" content="Booster Box Final Fantasy" />
        <meta property="og:image" content="https://cdn.example.com/box.jpg" />
      </head><body>
        <div>Preço: R$ 899,90</div>
        <div>Expansão: <span>Final Fantasy</span></div>
        <div>Tipo: <span>Booster Box</span></div>
        <p>Descrição editorial longa que não deve ser copiada.</p>
      </body></html>
    `;
    const meta = parseLigaPublicProductHtml(html);
    expect(meta.imageUrl).toBe("https://cdn.example.com/box.jpg");
    expect(meta.name).toBe("Booster Box Final Fantasy");
    expect(meta.expansion).toBe("Final Fantasy");
    expect(meta.productType).toBe("Booster Box");
    expect(JSON.stringify(meta)).not.toMatch(/899/);
    expect(JSON.stringify(meta)).not.toMatch(/editorial/);
  });

  it("rejects empty when no image", () => {
    const meta = parseLigaPublicProductHtml("<html><h1>Only title</h1></html>");
    expect(meta.imageUrl).toBeNull();
  });
});
