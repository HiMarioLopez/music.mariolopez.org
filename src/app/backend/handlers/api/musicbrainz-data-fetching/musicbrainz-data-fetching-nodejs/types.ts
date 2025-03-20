import { SearchOptions } from './services/musicbrainz';

export interface MusicBrainzEntityOptions {
    entity: string;
    mbid?: string;
    query?: string;
    includes?: string[];
    limit?: number;
    offset?: number;
    params?: Record<string, string>;
    searchOptions?: SearchOptions;
} 