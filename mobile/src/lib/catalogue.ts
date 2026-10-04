import type { Dress } from './types';

/** Turns typed tags ("Red, green ,SILK") into clean, unique, lower-case tags. */
export function parseTags(input: string): string[] {
  const seen = new Set<string>();
  for (const raw of input.split(/[,\n]/)) {
    const tag = raw.trim().replace(/\s+/g, ' ').toLowerCase();
    if (tag) seen.add(tag);
  }
  return [...seen];
}

/** Adds a tag to a list, keeping it clean and unique. */
export function addTag(tags: string[], tag: string): string[] {
  return parseTags([...tags, tag].join(','));
}

/** All tags used in a set of dresses, most used first, then A–Z. */
export function collectTags(dresses: Pick<Dress, 'tags'>[]): string[] {
  const counts = new Map<string, number>();
  for (const d of dresses) for (const t of d.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([t]) => t);
}

export interface CatalogueFilter {
  /** Matches the dress name or code. */
  search: string;
  /** A dress matches if it has any of these tags (e.g. red OR green). */
  tags: string[];
  minPrice: number | null;
  maxPrice: number | null;
}

export const EMPTY_FILTER: CatalogueFilter = { search: '', tags: [], minPrice: null, maxPrice: null };

export function isFilterActive(f: CatalogueFilter): boolean {
  return f.search.trim() !== '' || f.tags.length > 0 || f.minPrice !== null || f.maxPrice !== null;
}

export function filterDresses<T extends Pick<Dress, 'name' | 'code' | 'tags' | 'price'>>(
  dresses: T[],
  f: CatalogueFilter,
): T[] {
  const search = f.search.trim().toLowerCase();
  const usesPrice = f.minPrice !== null || f.maxPrice !== null;
  return dresses.filter((d) => {
    if (search && !d.name.toLowerCase().includes(search) && !d.code.toLowerCase().includes(search)) return false;
    if (f.tags.length > 0 && !f.tags.some((t) => d.tags.includes(t))) return false;
    if (usesPrice) {
      if (d.price === null) return false;
      if (f.minPrice !== null && d.price < f.minPrice) return false;
      if (f.maxPrice !== null && d.price > f.maxPrice) return false;
    }
    return true;
  });
}
