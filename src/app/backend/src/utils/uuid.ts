import crypto from 'crypto';
import { v7 } from 'uuid';

export function generateUUID(): string {
  return v7();
}

export function generateRecommendationId(
  entityType: string,
  artistName: string,
  songTitle?: string,
  albumTitle?: string
) {
  // Normalize and concatenate fields
  let base = `${entityType}:${artistName.trim().toLowerCase()}`;
  if (songTitle) base += `:${songTitle.trim().toLowerCase()}`;
  if (albumTitle) base += `:${albumTitle.trim().toLowerCase()}`;
  // Hash for compactness
  return crypto.createHash('sha256').update(base).digest('hex');
}
