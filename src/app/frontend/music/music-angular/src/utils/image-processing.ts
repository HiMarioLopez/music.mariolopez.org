/**
 * Processes the artwork URL from the API to replace the {w}x{h} placeholder
 * with actual dimensions for thumbnails
 *
 * @param url Original artwork URL from API
 * @param size Size for the artwork (default: 50x50)
 * @returns Processed URL or placeholder if URL is undefined
 */
export function getProcessedArtworkUrl(
  url: string | undefined,
  size: string = '50x50',
): string {
  if (!url) return '/angular/assets/50.png';
  return url.replace('{w}x{h}', size);
}

