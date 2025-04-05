export interface PaginatedResponse {
  items: any[];
  pagination: {
    count: number;
    hasMore: boolean;
    nextToken?: string;
  };
}