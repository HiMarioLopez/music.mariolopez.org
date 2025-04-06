import { AppleMusicSong } from "./AppleMusicSong";
import { Pagination } from "./Pagination";

export interface MusicHistoryResponse {
  items: AppleMusicSong[];
  pagination: Pagination;
}
