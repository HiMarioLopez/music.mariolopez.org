interface RefreshButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  title?: string;
  className?: string;
}

/**
 * Reusable refresh button component with spinning animation
 */
export function RefreshButton({
  onClick,
  isLoading = false,
  disabled = false,
  title = "Refresh",
  className = "",
}: RefreshButtonProps) {
  return (
    <button
      className={`refresh-button ${isLoading ? "spinning" : ""} ${className}`}
      onClick={onClick}
      disabled={disabled || isLoading}
      title={title}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 2v6h-6"></path>
        <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
        <path d="M3 22v-6h6"></path>
        <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
      </svg>
    </button>
  );
}
