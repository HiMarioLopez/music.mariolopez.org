import placeholderAlbumArt from "../assets/album-placeholder.svg";

export const getProcessedArtworkUrl = (
  url: string | undefined,
  size: string = "50x50",
): string => {
  if (!url) return placeholderAlbumArt;
  return url.replace("{w}x{h}", size);
};
