import React, { useEffect } from 'react';
import './Modal.css';

const Modal = ({ title, children, onClose }) => {
  // Close modal when Escape key is pressed
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscKey);
    
    // Prevent body scrolling when modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleEscKey);
      // Re-enable scrolling when modal is closed
      document.body.style.overflow = 'auto';
    };
  }, [onClose]);

  // Close modal when clicking outside the content
  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-container">
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal; 