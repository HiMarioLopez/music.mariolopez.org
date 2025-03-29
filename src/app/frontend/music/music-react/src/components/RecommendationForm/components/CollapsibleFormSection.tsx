import React from "react";
import "../styles/CollapsibleFormSection.styles.css";

interface CollapsibleFormSectionProps {
  isFormExpanded: boolean;
  setIsFormExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  from: string;
  setFrom: (from: string) => void;
  note: string;
  setNote: (note: string) => void;
  formErrors: {
    from?: string;
    note?: string;
  };
}

const CollapsibleFormSection: React.FC<CollapsibleFormSectionProps> = ({
  isFormExpanded,
  setIsFormExpanded,
  from,
  setFrom,
  note,
  setNote,
  formErrors,
}) => {
  return (
    <div className="collapsible-form-section">
      <button
        type="button"
        className={`collapsible-toggle ${isFormExpanded ? "expanded" : ""}`}
        onClick={() => setIsFormExpanded((prev: boolean) => !prev)}
        aria-expanded={isFormExpanded}
        aria-controls="form-fields-container"
      >
        <span>Add a Note (Optional)</span>
        <span className="toggle-icon">▲</span>
      </button>

      <div
        id="form-fields-container"
        className={`form-fields-container ${isFormExpanded ? "expanded" : ""}`}
        aria-hidden={!isFormExpanded}
      >
        <div className="form-field">
          <div className="label-counter-row">
            <label htmlFor="recommendation-from">From (Optional)</label>
            <div className="char-counter">{from.length}/32</div>
          </div>
          <input
            id="recommendation-from"
            type="text"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            maxLength={32}
            className={formErrors.from ? "error" : ""}
          />
          {formErrors.from && (
            <div className="error-message">{formErrors.from}</div>
          )}
        </div>

        <div className="form-field">
          <div className="label-counter-row">
            <label htmlFor="recommendation-note">Note (Optional)</label>
            <div className="char-counter">{note.length}/512</div>
          </div>
          <textarea
            id="recommendation-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={512}
            rows={2}
            className={formErrors.note ? "error" : ""}
          />
          {formErrors.note && (
            <div className="error-message">{formErrors.note}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(CollapsibleFormSection);
