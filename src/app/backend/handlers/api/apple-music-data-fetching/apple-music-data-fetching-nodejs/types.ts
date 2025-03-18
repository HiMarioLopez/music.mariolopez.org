export interface CacheEntry {
    data: any;
    expiry: number;
}

export interface CacheKeyOptions {
    stripPrefix?: string;
    includeMethod?: boolean;
    includeQuery?: boolean;
} 