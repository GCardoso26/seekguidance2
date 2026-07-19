/** Identificadores únicos para E2E — evita colisão em paralelismo e facilita logs. */
export function runStamp(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const seq = Math.floor(Math.random() * 900 + 100);
  return `${y}${m}${day}-${seq}`;
}

export function uniqueLabel(prefix: string): string {
  const rand = crypto.randomUUID?.().slice(0, 8) ?? Date.now().toString(36);
  return `${prefix} ${runStamp()}-${rand}`;
}

export function uniqueSku(prefix = "SKU"): string {
  return `${prefix}-${runStamp()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

export function uniqueCouponCode(prefix = "E2E"): string {
  return `${prefix}${runStamp().replace(/-/g, "").slice(-8)}${Math.random()
    .toString(36)
    .slice(2, 5)
    .toUpperCase()}`.slice(0, 20);
}
