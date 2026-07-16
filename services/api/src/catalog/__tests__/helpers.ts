/** Tiny helper exported for tests / mappers. */
export function mapCardFinishes(finishes: string[] | undefined): string[] {
  return [...(finishes ?? [])];
}
