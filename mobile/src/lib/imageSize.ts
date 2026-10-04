// Photo compression settings: a 3–5 MB phone photo becomes about 200–300 KB,
// and the catalogue grid uses a ~30 KB thumbnail.
export const FULL_MAX_SIDE = 1600;
export const FULL_QUALITY = 0.78;
export const THUMB_MAX_SIDE = 400;
export const THUMB_QUALITY = 0.7;

/** The resize needed so the longest side fits within maxSide, or null if it already fits. */
export function fitWithin(
  width: number,
  height: number,
  maxSide: number,
): { width: number } | { height: number } | null {
  if (width <= maxSide && height <= maxSide) return null;
  return width >= height ? { width: maxSide } : { height: maxSide };
}
