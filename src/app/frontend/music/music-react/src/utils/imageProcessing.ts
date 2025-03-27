import placeholderAlbumArt from "../assets/50.png";

/**
 * Processes the artwork URL from the API to replace the {w}x{h} placeholder
 * with actual dimensions for thumbnails
 *
 * @param url Original artwork URL from API
 * @param size Size for the artwork (default: 50x50)
 * @returns Processed URL or placeholder if URL is undefined
 */
export const getProcessedArtworkUrl = (
  url: string | undefined,
  size: string = "50x50",
) => {
  if (!url) return placeholderAlbumArt;
  return url.replace("{w}x{h}", size);
};
