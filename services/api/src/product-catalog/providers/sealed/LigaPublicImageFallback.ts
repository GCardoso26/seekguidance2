/**
 * Liga* public image fallback — Priority 3 only.
 * Extracts og:image / product image from public HTML.
 * Never copies prices, descriptions, editorial, or private areas.
 */

export const LIGA_PORTALS: Record<string, { baseUrl: string; game: string }> = {
  ligamagic: { baseUrl: "https://www.ligamagic.com.br", game: "MTG" },
  ligapokemon: { baseUrl: "https://www.ligapokemon.com.br", game: "POKEMON" },
  ligalorcana: { baseUrl: "https://www.ligalorcana.com.br", game: "LORCANA" },
  ligaonepiece: { baseUrl: "https://www.ligaonepiece.com.br", game: "ONE_PIECE" },
  ligafab: { baseUrl: "https://www.ligafab.com.br", game: "FAB" },
  ligadigimon: { baseUrl: "https://www.ligadigimon.com.br", game: "DIGIMON" },
  ligadragonball: { baseUrl: "https://www.ligadragonball.com.br", game: "DBFW" },
  ligastarwars: { baseUrl: "https://www.ligastarwars.com.br", game: "SWU" },
  ligayugioh: { baseUrl: "https://www.ligayugioh.com.br", game: "YUGIOH" },
  ligariftbound: { baseUrl: "https://www.ligariftbound.com.br", game: "RIFTBOUND" },
};

export interface LigaPublicProductMeta {
  name: string | null;
  expansion: string | null;
  productType: string | null;
  imageUrl: string | null;
}

const META_RE = (prop: string) =>
  new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i");
const META_RE_ALT = (prop: string) =>
  new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${prop}["']`, "i");

function metaContent(html: string, prop: string): string | null {
  const m = html.match(META_RE(prop)) ?? html.match(META_RE_ALT(prop));
  return m?.[1]?.trim() || null;
}

/** Strip price-looking and description blocks — we only keep title/image/type/expansion. */
export function parseLigaPublicProductHtml(html: string): LigaPublicProductMeta {
  const imageUrl =
    metaContent(html, "og:image") ||
    html.match(/<img[^>]+class=["'][^"']*produto[^"']*["'][^>]+src=["']([^"']+)["']/i)?.[1] ||
    html.match(/<img[^>]+src=["']([^"']+)["'][^>]+class=["'][^"']*produto[^"']*["']/i)?.[1] ||
    null;

  const name =
    metaContent(html, "og:title") ||
    html.match(/<h1[^>]*>([^<]+)<\/h1>/i)?.[1]?.trim() ||
    null;

  const expansion =
    html.match(/expans[aã]o[^:]*:\s*<[^>]+>([^<]+)/i)?.[1]?.trim() ||
    html.match(/data-expansion=["']([^"']+)["']/i)?.[1]?.trim() ||
    null;

  const productType =
    html.match(/tipo[^:]*:\s*<[^>]+>([^<]+)/i)?.[1]?.trim() ||
    html.match(/data-product-type=["']([^"']+)["']/i)?.[1]?.trim() ||
    null;

  return {
    name: name && !/r\$|preço|price/i.test(name) ? name : name?.replace(/R\$.*$/i, "").trim() || null,
    expansion,
    productType,
    imageUrl,
  };
}

export async function fetchLigaPublicProductPage(
  url: string,
  fetchImpl: typeof fetch = fetch,
): Promise<LigaPublicProductMeta> {
  if (!/^https:\/\//i.test(url)) throw new Error("liga_url_must_be_https");
  // Never follow login / private paths
  if (/login|signin|conta|carrinho|checkout|admin/i.test(url)) {
    throw new Error("liga_private_path_forbidden");
  }
  const res = await fetchImpl(url, {
    headers: {
      Accept: "text/html",
      "User-Agent": "JudgeTCG-CatalogImageBot/1.0 (+https://judgetcg.com.br; public-images-only)",
    },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`liga_http_${res.status}`);
  const html = await res.text();
  return parseLigaPublicProductHtml(html);
}
