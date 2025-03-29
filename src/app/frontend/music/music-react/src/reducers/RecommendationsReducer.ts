import {
  RecommendedSong,
  RecommendedAlbum,
  RecommendedArtist,
} from "../types/Recommendations";
import { RecommendationsState } from "../context/RecommendationsContext";

// Improve type safety for action creators with generics
export type FetchSuccessAction<T extends "songs" | "albums" | "artists"> = {
  type: "FETCH_RECOMMENDATIONS_SUCCESS";
  recommendationType: T;
  items: T extends "songs"
    ? RecommendedSong[]
    : T extends "albums"
      ? RecommendedAlbum[]
      : RecommendedArtist[];
};

export type RecommendationsAction =
  | {
      type: "FETCH_RECOMMENDATIONS_REQUEST";
      recommendationType: "songs" | "albums" | "artists";
    }
  | FetchSuccessAction<"songs" | "albums" | "artists">
  | {
      type: "FETCH_RECOMMENDATIONS_FAILURE";
      recommendationType: "songs" | "albums" | "artists";
      error: string;
    }
  | {
      type: "ADD_RECOMMENDATION";
      recommendationType: "songs" | "albums" | "artists";
      item: RecommendedSong | RecommendedAlbum | RecommendedArtist;
    }
  | {
      type: "UPDATE_RECOMMENDATION";
      recommendationType: "songs" | "albums" | "artists";
      item: RecommendedSong | RecommendedAlbum | RecommendedArtist;
      id: string;
    }
  | {
      type: "UPVOTE_RECOMMENDATION";
      recommendationType: "songs" | "albums" | "artists";
      index: number;
    }
  | {
      type: "DOWNVOTE_RECOMMENDATION";
      recommendationType: "songs" | "albums" | "artists";
      index: number;
    }
  | {
      type: "REALTIME_UPDATE_RECOMMENDATION";
      recommendationType: "songs" | "albums" | "artists";
      index: number;
      voteIncrement: number;
    };

// Helper to generate a unique ID
export const generateId = () =>
  `id_${Math.random().toString(36).substring(2, 9)}`;

// Helper to ensure each item has an ID
export function ensureIds<T>(items: T[]): (T & { id: string })[] {
  return items.map((item) => {
    if (typeof item === "object" && item !== null && !("id" in item)) {
      return { ...(item as object), id: generateId() } as T & { id: string };
    }
    return item as T & { id: string };
  });
}

export function recommendationsReducer(
  state: RecommendationsState,
  action: RecommendationsAction,
): RecommendationsState {
  switch (action.type) {
    case "FETCH_RECOMMENDATIONS_REQUEST":
      return {
        ...state,
        [action.recommendationType]: {
          ...state[action.recommendationType],
          loading: true,
          error: null,
        },
      };
    case "FETCH_RECOMMENDATIONS_SUCCESS": {
      let typedItems;
      if (action.recommendationType === "songs") {
        typedItems = ensureIds(action.items as RecommendedSong[]);
      } else if (action.recommendationType === "albums") {
        typedItems = ensureIds(action.items as RecommendedAlbum[]);
      } else {
        typedItems = ensureIds(action.items as RecommendedArtist[]);
      }

      return {
        ...state,
        [action.recommendationType]: {
          items: typedItems,
          loading: false,
          error: null,
          loaded: true,
        },
      };
    }
    case "FETCH_RECOMMENDATIONS_FAILURE":
      return {
        ...state,
        [action.recommendationType]: {
          ...state[action.recommendationType],
          loading: false,
          error: action.error,
          loaded: true,
        },
      };
    case "ADD_RECOMMENDATION":
      return {
        ...state,
        [action.recommendationType]: {
          ...state[action.recommendationType],
          items: [
            { ...action.item, votes: 1, id: generateId() }, // Initialize new recommendations with 1 vote and an ID
            ...state[action.recommendationType].items,
          ],
        },
      };
    case "UPDATE_RECOMMENDATION": {
      // Find index of item with matching ID
      const index = state[action.recommendationType].items.findIndex(
        (item) => item.id === action.id,
      );

      // If item not found, return state unchanged
      if (index === -1) {
        return state;
      }

      // Create a new items array with the updated item
      const items = [...state[action.recommendationType].items];
      const existingItem = items[index];

      // Special handling for notes array to ensure proper merging
      let mergedNotes = existingItem.notes || [];

      // If the incoming item has notes, merge them
      if (action.item.notes && Array.isArray(action.item.notes)) {
        // Only add notes that don't already exist in the array
        // We're considering a note unique if it has the same from+note+timestamp combination
        action.item.notes.forEach((newNote) => {
          const noteExists = mergedNotes.some(
            (existingNote) =>
              existingNote.from === newNote.from &&
              existingNote.note === newNote.note &&
              existingNote.noteTimestamp === newNote.noteTimestamp,
          );

          if (!noteExists) {
            mergedNotes = [...mergedNotes, newNote];
          }
        });
      }

      // Update the item with merged properties
      items[index] = {
        ...existingItem,
        ...action.item,
        // Preserve the existing ID and use votes from action if provided, otherwise keep existing
        id: existingItem.id,
        votes:
          action.item.votes !== undefined
            ? action.item.votes
            : existingItem.votes,
        // Use our merged notes array
        notes: mergedNotes,
      };

      return {
        ...state,
        [action.recommendationType]: {
          ...state[action.recommendationType],
          items,
        },
      };
    }
    case "UPVOTE_RECOMMENDATION": {
      const items = [...state[action.recommendationType].items];
      const item = items[action.index];
      let newVotes = item.votes || 0;

      // If already upvoted, remove the upvote (reset)
      if (
        state[action.recommendationType].items[action.index].userVoted === "up"
      ) {
        items[action.index] = {
          ...item,
          votes: Math.max(0, newVotes - 1),
          userVoted: undefined,
        };

        // Sort items by votes
        items.sort((a, b) => (b.votes || 0) - (a.votes || 0));

        return {
          ...state,
          [action.recommendationType]: {
            ...state[action.recommendationType],
            items,
          },
        };
      }

      // If previously downvoted, add 2 (remove the downvote and add an upvote)
      if (
        state[action.recommendationType].items[action.index].userVoted ===
        "down"
      ) {
        newVotes += 2;
      } else {
        // Otherwise just add 1
        newVotes += 1;
      }

      // Update vote count and userVoted status
      items[action.index] = {
        ...item,
        votes: newVotes,
        userVoted: "up",
      };

      // Sort items by votes
      items.sort((a, b) => (b.votes || 0) - (a.votes || 0));

      return {
        ...state,
        [action.recommendationType]: {
          ...state[action.recommendationType],
          items,
        },
      };
    }
    case "DOWNVOTE_RECOMMENDATION": {
      const items = [...state[action.recommendationType].items];
      const item = items[action.index];
      let newVotes = item.votes || 0;

      // If already downvoted, remove the downvote (reset)
      if (
        state[action.recommendationType].items[action.index].userVoted ===
        "down"
      ) {
        items[action.index] = {
          ...item,
          votes: (item.votes || 0) + 1, // Always add 1 when removing a downvote
          userVoted: undefined,
        };

        // Sort items by votes
        items.sort((a, b) => (b.votes || 0) - (a.votes || 0));

        return {
          ...state,
          [action.recommendationType]: {
            ...state[action.recommendationType],
            items,
          },
        };
      }

      // If previously upvoted, subtract 2 (remove the upvote and add a downvote)
      if (
        state[action.recommendationType].items[action.index].userVoted === "up"
      ) {
        newVotes -= 2;
      } else {
        // Otherwise just subtract 1
        newVotes -= 1;
      }

      // Ensure votes don't go below 0
      newVotes = Math.max(0, newVotes);

      // Update vote count and userVoted status
      items[action.index] = {
        ...item,
        votes: newVotes,
        userVoted: "down",
      };

      // Sort items by votes
      items.sort((a, b) => (b.votes || 0) - (a.votes || 0));

      return {
        ...state,
        [action.recommendationType]: {
          ...state[action.recommendationType],
          items,
        },
      };
    }
    case "REALTIME_UPDATE_RECOMMENDATION": {
      const items = [...state[action.recommendationType].items];
      const item = items[action.index];
      const newVotes = (item.votes || 0) + action.voteIncrement;

      // Update vote count
      items[action.index] = {
        ...item,
        votes: newVotes,
      };

      // Sort items by votes after real-time update
      items.sort((a, b) => (b.votes || 0) - (a.votes || 0));

      return {
        ...state,
        [action.recommendationType]: {
          ...state[action.recommendationType],
          items,
        },
      };
    }
    default:
      return state;
  }
}
