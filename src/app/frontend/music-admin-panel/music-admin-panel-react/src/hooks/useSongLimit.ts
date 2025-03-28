import { useState, useEffect } from "react";
import { updateSongLimit, getSongLimit } from "../utils/api";

interface SongLimitState {
  value: number;
  status: string;
  isLoading: boolean;
}

interface SongLimitActions {
  setValue: (value: number) => void;
  handleUpdate: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useSongLimit(): [SongLimitState, SongLimitActions] {
  const [value, setValue] = useState(25); // Default value
  const [status, setStatus] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentLimit = async () => {
    try {
      setIsLoading(true);
      const response = await getSongLimit();
      setValue(response.songLimit);
    } catch (error) {
      console.error("Error fetching song limit:", error);
      setStatus("Error: Failed to fetch current song limit");
    } finally {
      setIsLoading(false);
    }
  };

  const validateSongLimit = (value: number): string | null => {
    if (value < 5) return "Song limit must be at least 5";
    if (value > 30) return "Song limit cannot exceed 30";
    return null;
  };

  const handleUpdate = async () => {
    try {
      const error = validateSongLimit(value);
      if (error) {
        setStatus(`Error: ${error}`);
        return;
      }

      await updateSongLimit(value);
      setStatus("Song limit updated successfully");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update song limit";
      console.error("Error:", error);
      setStatus(`Error: ${errorMessage}`);
    }
  };

  useEffect(() => {
    fetchCurrentLimit();
  }, []);

  return [
    { value, status, isLoading },
    { setValue, handleUpdate, refresh: fetchCurrentLimit },
  ];
}
