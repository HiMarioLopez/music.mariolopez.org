import React from "react";
import "../styles/FormActions.styles.css";

interface FormActionsProps {
  selectedItem: any | null;
  isSubmitting?: boolean;
}

const FormActions: React.FC<FormActionsProps> = ({
  selectedItem,
  isSubmitting = false,
}) => {
  return (
    <div className="form-actions">
      <div className="button-container">
        <button
          type="submit"
          className={`submit-button ${isSubmitting ? "loading" : ""}`}
          disabled={!selectedItem || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="spinner"></span>
              Submitting...
            </>
          ) : (
            "Submit Recommendation"
          )}
        </button>
      </div>
    </div>
  );
};

export default React.memo(FormActions);
