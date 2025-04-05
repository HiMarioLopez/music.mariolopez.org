export interface RecommendationNote {
  recommendationId: string; // PK, links to the recommendation
  noteId: string; // SK, UUID or timestamp string
  from: string; // User who submitted (could be anonymous)
  note: string; // The note content
  isFromMario: boolean; // Whether the note is from Mario
  noteTimestamp: string; // ISO timestamp of note creation
  moderationStatus: ModerationStatus;
  moderationDetails?: {
    flaggedCategories?: string[];
    flaggedTimestamp?: string;
    reviewedBy?: string;
    reviewedTimestamp?: string;
  };
}

export type ModerationStatus =
  | 'approved'
  | 'pending_review'
  | 'rejected';
