export interface RecommendationNote {
  recommendationId: string; // PK, links to the recommendation
  noteId: string; // SK, UUID string
  from: string; // User who submitted (could be anonymous)
  note: string; // The note content
  isFromUser: boolean; // Whether the note is from Mario
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
  | 'APPROVED'
  | 'PENDING_REVIEW'
  | 'REJECTED'
  | 'FLAGGED';
