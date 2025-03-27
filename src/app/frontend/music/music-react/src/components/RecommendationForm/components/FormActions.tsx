import React from "react";
import "../styles/FormActions.styles.css";

interface FormActionsProps {
  selectedItem: any | null;
}

const FormActions: React.FC<FormActionsProps> = ({ selectedItem }) => {
  return (
    <div className="form-actions">
      <button type="submit" className="submit-button" disabled={!selectedItem}>
        Submit Recommendation
      </button>
    </div>
  );
};

export default React.memo(FormActions);
