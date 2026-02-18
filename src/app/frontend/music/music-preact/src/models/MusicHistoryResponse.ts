import type { AppleMusicSong } from "./AppleMusicSong";
import type { Pagination } from "./Pagination";

export interface MusicHistoryResponse {
  items: AppleMusicSong[];
  pagination: Pagination;
}
