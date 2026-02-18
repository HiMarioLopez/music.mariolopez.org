export const openUrlInNewTab = (url: string | undefined): void => {
  if (url) {
    window.open(url, "_blank", "noopener,noreferrer");
  }
};
