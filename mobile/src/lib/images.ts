import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { base64ToBytes } from './base64';
import {
  FULL_MAX_SIDE,
  FULL_QUALITY,
  THUMB_MAX_SIDE,
  THUMB_QUALITY,
  fitWithin,
} from './imageSize';

export interface CompressedPhoto {
  uri: string;
  bytes: Uint8Array;
}

async function compress(uri: string, maxSide: number, quality: number): Promise<CompressedPhoto> {
  const original = await ImageManipulator.manipulate(uri).renderAsync();
  const resize = fitWithin(original.width, original.height, maxSide);
  const image = resize
    ? await ImageManipulator.manipulate(original).resize(resize).renderAsync()
    : original;
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: quality, base64: true });
  if (!saved.base64) throw new Error('Could not read the compressed photo.');
  return { uri: saved.uri, bytes: base64ToBytes(saved.base64) };
}

/** Makes the full-size photo and the catalogue thumbnail on the phone, before upload. */
export async function preparePhoto(uri: string): Promise<{ full: CompressedPhoto; thumb: CompressedPhoto }> {
  const full = await compress(uri, FULL_MAX_SIDE, FULL_QUALITY);
  const thumb = await compress(full.uri, THUMB_MAX_SIDE, THUMB_QUALITY);
  return { full, thumb };
}
