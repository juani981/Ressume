import React from 'react';
import { HelpCircle } from 'lucide-react';
import { useTourManager } from '../../context/TourContext';

/**
 * ModalHelpButton
 *
 * Compact '?' button for modal headers. Clicking it opens the
 * dedicated step-by-step tutorial dialog for that modal.
 *
 * @param {Object} props
 * @param {string} props.tourId - Identifier from TOUR_IDS
 * @param {boolean} [props.isDark=false] - Whether dark mode styling applies
 * @param {string} [props.className=''] - Additional class names
 * @param {Object} [props.style={}] - Additional inline styles
 */
export const ModalHelpButton = ({
  tourId,
  isDark = false,
  className = '',
  style = {},
}) => {
  const { openModalHelp } = useTourManager();

  if (!tourId) return null;

  return (
    <button
      type="button"
      onClick={() => openModalHelp(tourId)}
      data-testid="btn-modal-help"
      aria-label="Abrir guía paso a paso de esta sección"
      title="Guía de uso y pasos recomendados"
      className={`modal-help-btn ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '32px',
        height: '32px',
        borderRadius: '8px',
        border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
        backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
        color: isDark ? '#93c5fd' : '#2563eb',
        cursor: 'pointer',
        transition: 'all 0.18s ease',
        ...style,
      }}
    >
      <HelpCircle size={17} />
    </button>
  );
};

export default ModalHelpButton;
