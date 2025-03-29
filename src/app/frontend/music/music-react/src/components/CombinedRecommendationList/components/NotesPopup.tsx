import React, { useRef, useEffect } from "react";
import { Note } from "../types/CombinedRecommendationList.types";
import styles from "../styles/notesPopup.module.css";
import { formatRelativeTime } from "../../../utils/formatters";

interface NotesPopupProps {
  notes: Note[];
  onClose: () => void;
}

const NotesPopup: React.FC<NotesPopupProps> = ({ notes, onClose }) => {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Handle clicking outside of the popup
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  return (
    <div className={styles.popupOverlay}>
      <div className={styles.popup} ref={popupRef}>
        <div className={styles.header}>
          <h3 className={styles.title}>Notes</h3>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        {notes.length === 0 ? (
          <div className={styles.emptyState}>No notes available</div>
        ) : (
          <ul className={styles.notesList}>
            {notes.map((note, index) => (
              <li key={index} className={styles.noteItem}>
                <div className={styles.noteContent}>
                  <p className={styles.noteText}>
                    {note.note || "No note content provided."}
                  </p>
                  <div className={styles.noteFooter}>
                    <span className={styles.noteFrom}>
                      From: {note.from || "Anonymous"}
                    </span>
                    <span className={styles.noteTime}>
                      {formatRelativeTime(note.noteTimestamp)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NotesPopup;
