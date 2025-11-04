// Mock for the image processing utility
import { vi } from "vitest";

export const getProcessedArtworkUrl = vi.fn(
  (url: string) => `processed-${url}`,
);
