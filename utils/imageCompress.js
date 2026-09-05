import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';

export const MAX_PHOTO_BYTES = 1 * 1024 * 1024; // 1 MB — mountain-summit signal is often just 2G/3G, and ascent uploads get one shot before landing in the retry queue.

// expo-image-picker/expo-image-manipulator both write into the OS-managed
// cache directory, which Android and iOS are both free to reclaim at any
// time under storage pressure with no warning. That's fine for a photo
// that's uploaded within the same second it's picked, but an ascent photo
// sits around for as long as the user takes to fill in the rest of the form,
// and a *queued* (offline) ascent's photo can sit around for days across
// many app sessions — long enough that the cache file backing it can simply
// stop existing by the time the upload actually runs. That failure doesn't
// surface as "missing photo": building/sending a multipart body from a
// nonexistent local file fails at the transport level with no response at
// all, which axios reports identically to a genuine "Network Error". Moving
// the final compressed photo into the app's own document directory (never
// cleared by the OS) closes that gap at the root instead of just retrying
// around it.
const ASCENT_PHOTO_DIR = `${FileSystem.documentDirectory}ascent_photos/`;

async function ensureAscentPhotoDir() {
  const info = await FileSystem.getInfoAsync(ASCENT_PHOTO_DIR);
  if (!info.exists) await FileSystem.makeDirectoryAsync(ASCENT_PHOTO_DIR, { intermediates: true });
}

async function deleteQuietly(uri) {
  if (!uri) return;
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {}
}

// Resizing width has a far bigger effect on JPEG file size than quality
// alone once a photo is already several MB (a modern phone photo can be
// 4000px+ wide) — so each step shrinks dimensions and drops quality
// together rather than trying quality-only passes first.
const STEPS = [
  { width: 1600, compress: 0.7 },
  { width: 1280, compress: 0.6 },
  { width: 1024, compress: 0.5 },
  { width: 800, compress: 0.4 },
  { width: 640, compress: 0.35 },
];

// Compresses uri to at most maxBytes, trying progressively smaller/lower
// quality passes. Returns the original uri unchanged if it's already under
// the limit, or the best (smallest) result achieved if every step still
// leaves it slightly over — never fails outright, since a slightly-too-big
// photo is better than losing the attachment entirely. Cleans up its own
// intermediate cache files as it goes rather than leaving a trail of
// abandoned temp JPEGs behind on every pass.
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
      if (currentUri !== uri) await deleteQuietly(currentUri); // never the original picker/camera file
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

// Compresses (if needed) and copies the result into a stable, app-owned
// directory that survives cache reclamation. This is what picking an ascent
// photo should call — see the ASCENT_PHOTO_DIR comment above for why the
// plain cache uri compressImageIfNeeded() returns isn't safe to hold onto
// for the lifetime of a form fill-in, let alone an offline queue entry.
export async function persistPickedPhoto(uri) {
  const compressedUri = await compressImageIfNeeded(uri);
  try {
    await ensureAscentPhotoDir();
    const ext = (compressedUri.split('.').pop() || 'jpg').toLowerCase();
    const dest = `${ASCENT_PHOTO_DIR}${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    await FileSystem.copyAsync({ from: compressedUri, to: dest });
    // compressedUri was a throwaway cache file (ImageManipulator's output, or
    // — if no compression was needed — the picker's own cache copy); now
    // that it's duplicated into stable storage, drop the cache copy.
    if (compressedUri !== uri) await deleteQuietly(compressedUri);
    return dest;
  } catch {
    // Couldn't persist (e.g. disk full) — better to keep the cache uri than
    // lose the photo outright; it just carries the original eviction risk.
    return compressedUri;
  }
}

// Shared by the live submit path and the background retry queue — see the
// ASCENT_PHOTO_DIR comment above for why a photo's backing file can go
// missing by the time it's actually uploaded. Checking first and degrading
// to "submit without the photo" avoids a transport-layer crash on a
// nonexistent local file, which otherwise surfaces as a bare, misleading
// "Network Error" indistinguishable from an actual connectivity problem.
export async function resolvePhotoUri(uri) {
  if (!uri) return null;
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists ? uri : null;
  } catch {
    return null;
  }
}

// Best-effort cleanup once a photo's ascent has been uploaded, discarded, or
// removed by the user before submitting, and it no longer needs to survive
// in persistent storage. Scoped to our own directory so a bad/foreign uri
// can never delete something this module doesn't own.
export async function deletePersistedPhoto(uri) {
  if (!uri || !uri.startsWith(ASCENT_PHOTO_DIR)) return;
  await deleteQuietly(uri);
}
