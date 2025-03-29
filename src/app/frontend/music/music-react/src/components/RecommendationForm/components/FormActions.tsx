import React, { useState, useEffect } from "react";
import "../styles/FormActions.styles.css";

interface FormActionsProps {
  selectedItem: any | null;
  isSubmitting?: boolean;
  status?: string | null;
}

const FormActions: React.FC<FormActionsProps> = ({ 
  selectedItem, 
  isSubmitting = false, 
  status = null 
}) => {
  const [shouldFadeOut, setShouldFadeOut] = useState(false);
  
  // Handle status message fade out after 5 seconds
  useEffect(() => {
    if (status) {
      // Reset fade state when status changes
      setShouldFadeOut(false);
      
      // After 5 seconds, start fading out
      const timer = setTimeout(() => {
        setShouldFadeOut(true);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [status]);
  
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
        
        {status && (
          <div 
            className={`status-message ${status.includes("Error") || status.includes("error") ? "error" : "success"} ${shouldFadeOut ? "fade-out" : ""}`}
          >
            {status}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(FormActions);
