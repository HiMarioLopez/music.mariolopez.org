import React from "react";

interface SubmitButtonProps {
  onClick: () => void | Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
}

/**
 * Reusable submit button component with loading state and spinner
 */
export function SubmitButton({
  onClick,
  isLoading = false,
  disabled = false,
  children,
  loadingText,
  className = "",
}: SubmitButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`primary-button ${isLoading ? "loading" : ""} ${className}`}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <>
          <span className="spinner"></span>
          {loadingText || children}
        </>
      ) : (
        children
      )}
    </button>
  );
}
