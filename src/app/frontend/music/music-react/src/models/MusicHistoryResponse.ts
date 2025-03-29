import { MusicItem } from "./MusicItem";
import { Pagination } from "./Pagination";

export interface MusicHistoryResponse {
  items: MusicItem[];
  pagination: Pagination;
}
