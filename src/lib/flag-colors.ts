import { palette, type PaletteColor } from '../data/countries.ts';

export type FlagColor = PaletteColor & { number: number };

/** Display numbers start at one per flag; stable color IDs still control matching. */
export function flagPalette(regions: readonly { colorId: number }[]): FlagColor[] {
  const used = new Set(regions.map(region => region.colorId));
  return palette.filter(color => used.has(color.id)).map((color, index) => ({ ...color, number: index + 1 }));
}
