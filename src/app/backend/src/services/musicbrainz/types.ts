/**
 * Types for MusicBrainz API interactions
 */

// MusicBrainz entity types
export type MusicBrainzEntity = 
  | 'artist' 
  | 'release' 
  | 'release-group' 
  | 'recording' 
  | 'work' 
  | 'label' 
  | 'area' 
  | 'place' 
  | 'event' 
  | 'url' 
  | 'tag' 
  | 'genre';

// Search options interface
export interface SearchOptions {
  query: string;
  limit?: number;
  offset?: number;
  dismax?: boolean;
  version?: number;
  [key: string]: any; // For additional Lucene filters
}

// Lookup parameters interface
export interface LookupOptions {
  includes?: string[];
}

// Browse parameters interface
export interface BrowseOptions {
  params: Record<string, string>;
  limit?: number;
  offset?: number;
}

// Combined options interface
export interface MusicBrainzEntityOptions {
  entity: MusicBrainzEntity;
  mbid?: string;
  query?: string;
  includes?: string[];
  params?: Record<string, string>;
  limit?: number;
  offset?: number;
  searchOptions?: SearchOptions;
}

// Error response from MusicBrainz
export interface MusicBrainzError {
  error: string;
  status: number;
  message?: string;
}

// MusicBrainz API response types
export interface MusicBrainzResponse {
  [key: string]: any;
}
