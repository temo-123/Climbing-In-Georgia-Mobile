import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';

export const MAX_PHOTO_BYTES = 1.5 * 1024 * 1024; // 1.5 MB

// Resizing width has a far bigger effect on JPEG file size than quality
// alone once a photo is already several MB (a modern phone photo can be
// 4000px+ wide) — so each step shrinks dimensions and drops quality
// together rather than trying quality-only passes first.
const STEPS = [
  { width: 1600, compress: 0.7 },
  { width: 1280, compress: 0.6 },
  { width: 1024, compress: 0.5 },
  { width: 800, compress: 0.4 },
];

// Compresses uri to at most maxBytes, trying progressively smaller/lower
// quality passes. Returns the original uri unchanged if it's already under
// the limit, or the best (smallest) result achieved if every step still
// leaves it slightly over — never fails outright, since a slightly-too-big
// photo is better than losing the attachment entirely.
export async function compressImageIfNeeded(uri, maxBytes = MAX_PHOTO_BYTES) {
  try {
    const info = await FileSystem.getInfoAsync(uri, { size: true });
    if (!info.exists || !info.size || info.size <= maxBytes) return uri;

    let currentUri = uri;
    for (const step of STEPS) {
      const result = await ImageManipulator.manipulateAsync(
        currentUri,
        [{ resize: { width: step.width } }],
        { compress: step.compress, format: ImageManipulator.SaveFormat.JPEG },
      );
      currentUri = result.uri;
      const resultInfo = await FileSystem.getInfoAsync(currentUri, { size: true });
      if (resultInfo.exists && resultInfo.size && resultInfo.size <= maxBytes) break;
    }
    return currentUri;
  } catch {
    // Manipulation failed for any reason (corrupt image, unsupported format,
    // out of memory) — better to upload the original than lose the photo.
    return uri;
  }
}
