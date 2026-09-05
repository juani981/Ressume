import React, { useState, useEffect } from 'react';

const TOUR_STORAGE_KEY = 'skip_onboarding_tour';

export function CustomTooltip({
  index = 0,
  isLastStep = false,
  step = {},
  backProps = {},
  primaryProps = {},
  skipProps = {},
  closeProps = {},
  tooltipProps = {},
  dontShowAgain: controlledDontShowAgain,
  setDontShowAgain: controlledSetDontShowAgain,
  ...rest
}) {
  // Read initial state from localStorage or from controlled prop if provided
  const [isChecked, setIsChecked] = useState(() => {
    if (typeof controlledDontShowAgain === 'boolean') {
      return controlledDontShowAgain;
    }
    try {
      return typeof window !== 'undefined' && localStorage.getItem(TOUR_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // Keep state synchronized if controlled prop updates from parent
  useEffect(() => {
    if (typeof controlledDontShowAgain === 'boolean') {
      setIsChecked(controlledDontShowAgain);
    }
  }, [controlledDontShowAgain]);

  const handleCheckboxChange = (e) => {
    const nextChecked = e.target.checked;
    setIsChecked(nextChecked);

    // Save preference directly into localStorage immediately
    try {
      if (nextChecked) {
        localStorage.setItem(TOUR_STORAGE_KEY, 'true');
      } else {
        localStorage.removeItem(TOUR_STORAGE_KEY);
      }
    } catch (err) {
      console.warn('Could not persist tour preference to localStorage:', err);
    }

    // Propagate to parent callback if passed
    if (typeof controlledSetDontShowAgain === 'function') {
      controlledSetDontShowAgain(nextChecked);
    }
  };

  const handleSkipClick = (e) => {
    if (isChecked) {
      try {
        localStorage.setItem(TOUR_STORAGE_KEY, 'true');
      } catch (_) {}
    }
    if (skipProps?.onClick) {
      skipProps.onClick(e);
    }
  };

  const handlePrimaryClick = (e) => {
    if (isLastStep && isChecked) {
      try {
        localStorage.setItem(TOUR_STORAGE_KEY, 'true');
      } catch (_) {}
    }
    if (primaryProps?.onClick) {
      primaryProps.onClick(e);
    }
  };

  return (
    <div
      className="react-joyride__tooltip"
      {...tooltipProps}
      style={{
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 8,
        maxWidth: 400,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        ...tooltipProps?.style
      }}
    >
      {/* Contenido dinámico que viene del array de pasos */}
      <div className="react-joyride__content" style={{ marginBottom: 15 }}>
        {step?.content}
      </div>

      {/* FOOTER: Checkbox + Botones */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        
        {/* Checkbox "No volver a mostrar" */}
        <label
          htmlFor="dont-show-tour-checkbox"
          data-testid="label-dont-show-again"
          onClick={(e) => e.stopPropagation()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: '14px',
            cursor: 'pointer',
            color: '#555',
            userSelect: 'none'
          }}
        >
          <input
            id="dont-show-tour-checkbox"
            data-testid="checkbox-dont-show-again"
            type="checkbox"
            checked={isChecked}
            onChange={handleCheckboxChange}
            onClick={(e) => e.stopPropagation()}
            style={{ cursor: 'pointer' }}
          />
          No volver a mostrar este tour
        </label>

        {/* Botones de Control */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
          <div>
            {index > 0 && (
              <button
                {...backProps}
                type="button"
                style={{ marginRight: 8, padding: '6px 12px', cursor: 'pointer' }}
              >
                Atrás
              </button>
            )}
            <button
              {...skipProps}
              type="button"
              onClick={handleSkipClick}
              style={{
                padding: '6px 12px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#888'
              }}
            >
              Saltar
            </button>
          </div>
          
          <button
            {...primaryProps}
            type="button"
            onClick={handlePrimaryClick}
            style={{
              padding: '6px 12px',
              backgroundColor: '#0070f3',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            {isLastStep ? 'Finalizar' : 'Siguiente'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CustomTooltip;
