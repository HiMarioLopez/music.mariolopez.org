export type Note = {
  noteId: string;
  from: string;
  note: string;
  isFromUser: boolean;
  noteTimestamp: string;
  moderationStatus: ModerationStatus;
  moderationDetails?: {
    flaggedCategories?: string[];
    flaggedTimestamp?: string;
    reviewedBy?: string;
    reviewedTimestamp?: string;
  };
};

export type ModerationStatus = "APPROVED" | "PENDING_REVIEW" | "REJECTED";
