import { AppleMusicSong } from './apple-music-song';
import { Pagination } from './pagination';

export interface MusicHistoryResponse {
  items: AppleMusicSong[];
  pagination: Pagination;
}

