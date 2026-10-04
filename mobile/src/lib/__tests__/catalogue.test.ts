import { describe, expect, it } from 'vitest';

import { EMPTY_FILTER, addTag, collectTags, filterDresses, isFilterActive, parseTags } from '../catalogue';

const dresses = [
  { code: 'WG-001', name: 'Green anarkali', tags: ['green', 'silk'], price: 3500 },
  { code: 'WG-002', name: 'Red lehenga', tags: ['red', 'silk'], price: 9000 },
  { code: 'WG-003', name: 'Blue gown', tags: ['blue'], price: null },
  { code: 'WG-004', name: 'Red saree', tags: ['red'], price: 5000 },
];

describe('tags', () => {
  it('cleans typed tags', () => {
    expect(parseTags(' Red, green ,SILK, red,, ')).toEqual(['red', 'green', 'silk']);
    expect(parseTags('dark   blue')).toEqual(['dark blue']);
  });

  it('adds a tag only once', () => {
    expect(addTag(['red'], 'Red ')).toEqual(['red']);
    expect(addTag(['red'], 'green')).toEqual(['red', 'green']);
  });

  it('lists the most used tags first', () => {
    expect(collectTags(dresses)).toEqual(['red', 'silk', 'blue', 'green']);
  });
});

describe('filterDresses', () => {
  const codes = (f: Partial<typeof EMPTY_FILTER>) =>
    filterDresses(dresses, { ...EMPTY_FILTER, ...f }).map((d) => d.code);

  it('shows everything with no filter', () => {
    expect(codes({})).toHaveLength(4);
    expect(isFilterActive(EMPTY_FILTER)).toBe(false);
  });

  it('searches name and code', () => {
    expect(codes({ search: 'red' })).toEqual(['WG-002', 'WG-004']);
    expect(codes({ search: 'wg-003' })).toEqual(['WG-003']);
  });

  it('matches any selected tag', () => {
    expect(codes({ tags: ['green', 'blue'] })).toEqual(['WG-001', 'WG-003']);
  });

  it('filters by price range and leaves out dresses with no price', () => {
    expect(codes({ minPrice: 4000 })).toEqual(['WG-002', 'WG-004']);
    expect(codes({ maxPrice: 5000 })).toEqual(['WG-001', 'WG-004']);
    expect(codes({ minPrice: 3000, maxPrice: 6000, tags: ['red'] })).toEqual(['WG-004']);
  });
});
