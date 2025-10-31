import React from 'react';

interface StatusMessageProps {
  status: string | null;
  shouldFadeOut?: boolean;
  className?: string;
}

/**
 * Reusable status message component with fade-out animation support
 */
export function StatusMessage({
  status,
  shouldFadeOut = false,
  className = "",
}: StatusMessageProps) {
  if (!status) return null;

  const isError = status.includes("Error");

  return (
    <div
      className={`status-message ${
        isError ? "error" : "success"
      } ${shouldFadeOut ? "fade-out" : ""} ${className}`}
    >
      {status}
    </div>
  );
}

