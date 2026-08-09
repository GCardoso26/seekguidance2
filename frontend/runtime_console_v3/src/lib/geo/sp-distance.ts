/** Distância em km até o centro de São Paulo (−23.5505, −46.6333). */

export const SP_CENTER = { lat: -23.5505, lng: -46.6333 } as const;

const EARTH_KM = 6371;

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function distanceFromSpCenterKm(lat: number, lng: number): number {
  return haversineKm(lat, lng, SP_CENTER.lat, SP_CENTER.lng);
}

/** Formata distância: "menos de 1 km" | "3 km" | "42 km" (sem casas se ≥ 5). */
export function formatDistanceKm(km: number): string {
  if (!Number.isFinite(km) || km < 0) return "";
  if (km < 1) return "menos de 1 km";
  if (km < 5) return `${km.toFixed(1).replace(".", ",")} km`;
  return `${Math.round(km)} km`;
}

export function digitsOnlyCep(cep: string): string {
  return cep.replace(/\D/g, "").slice(0, 8);
}

export function formatCepMask(cep: string): string {
  const d = digitsOnlyCep(cep);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

type CepLookup = {
  city: string | null;
  state: string | null;
  lat: number | null;
  lng: number | null;
};

const cepCache = new Map<string, CepLookup | null>();

export async function lookupCep(cep: string): Promise<CepLookup | null> {
  const digits = digitsOnlyCep(cep);
  if (digits.length !== 8) return null;
  if (cepCache.has(digits)) return cepCache.get(digits) ?? null;
  try {
    const res = await fetch(`/api/geo/cep/${digits}`);
    if (!res.ok) {
      cepCache.set(digits, null);
      return null;
    }
    const data = (await res.json()) as CepLookup;
    cepCache.set(digits, data);
    return data;
  } catch {
    cepCache.set(digits, null);
    return null;
  }
}

export async function distanceLabelFromCep(cep: string | null | undefined): Promise<string | null> {
  if (!cep) return null;
  const geo = await lookupCep(cep);
  if (!geo || geo.lat == null || geo.lng == null) return null;
  return formatDistanceKm(distanceFromSpCenterKm(geo.lat, geo.lng));
}
