import { useState, useEffect } from "react";
import { updateSpotifySongLimit, getSpotifySongLimit } from "../utils/api";

interface SpotifySongLimitState {
  value: number;
  status: string;
  isLoading: boolean;
}

interface SpotifySongLimitActions {
  setValue: (value: number) => void;
  handleUpdate: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useSpotifySongLimit(): [
  SpotifySongLimitState,
  SpotifySongLimitActions
] {
  const [value, setValue] = useState(20); // Default value
  const [status, setStatus] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentLimit = async () => {
    try {
      setIsLoading(true);
      const response = await getSpotifySongLimit();
      setValue(response.songLimit);
    } catch (error) {
      console.error("Error fetching Spotify song limit:", error);
      setStatus("Error: Failed to fetch current Spotify song limit");
    } finally {
      setIsLoading(false);
    }
  };

  const validateSongLimit = (value: number): string | null => {
    if (value < 1) return "Song limit must be at least 1";
    if (value > 50) return "Song limit cannot exceed 50";
    return null;
  };

  const handleUpdate = async () => {
    try {
      const error = validateSongLimit(value);
      if (error) {
        setStatus(`Error: ${error}`);
        return;
      }

      await updateSpotifySongLimit(value);
      setStatus("Spotify song limit updated successfully");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update Spotify song limit";
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
