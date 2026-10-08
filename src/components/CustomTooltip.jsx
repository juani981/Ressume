import React, { useState, useEffect } from 'react';
import { useTourManager, TOUR_STORAGE_PREFIX, TOUR_IDS } from '../context/TourContext';
import { useModalTheme } from '../hooks/useModalTheme';

const DEFAULT_TOUR_STORAGE_KEY = 'skip_onboarding_tour';

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
  tourId = TOUR_IDS.ONBOARDING,
  ...rest
}) {
  const { markTourCompleted } = useTourManager ? (function() {
    try {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useTourManager();
    } catch (_) {
      return {};
    }
  })() : {};

  let isDark = false;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const themeState = useModalTheme();
    isDark = themeState?.isDark || false;
  } catch (_) {
    isDark = false;
  }

  const storageKey = tourId === TOUR_IDS.ONBOARDING 
    ? DEFAULT_TOUR_STORAGE_KEY 
    : `${TOUR_STORAGE_PREFIX}${tourId}`;

  // Read initial state from localStorage or from controlled prop if provided
  const [isChecked, setIsChecked] = useState(() => {
    if (typeof controlledDontShowAgain === 'boolean') {
      return controlledDontShowAgain;
    }
    try {
      return typeof window !== 'undefined' && localStorage.getItem(storageKey) === 'true';
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
        localStorage.setItem(storageKey, 'true');
        if (tourId === TOUR_IDS.ONBOARDING) {
          localStorage.setItem(DEFAULT_TOUR_STORAGE_KEY, 'true');
        }
      } else {
        localStorage.removeItem(storageKey);
        if (tourId === TOUR_IDS.ONBOARDING) {
          localStorage.removeItem(DEFAULT_TOUR_STORAGE_KEY);
        }
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
        localStorage.setItem(storageKey, 'true');
        if (tourId === TOUR_IDS.ONBOARDING) {
          localStorage.setItem(DEFAULT_TOUR_STORAGE_KEY, 'true');
        }
      } catch (_) {}
    }
    if (skipProps?.onClick) {
      skipProps.onClick(e);
    }
  };

  const handlePrimaryClick = (e) => {
    if (isLastStep && isChecked) {
      try {
        localStorage.setItem(storageKey, 'true');
        if (tourId === TOUR_IDS.ONBOARDING) {
          localStorage.setItem(DEFAULT_TOUR_STORAGE_KEY, 'true');
        }
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
        borderRadius: 12,
        maxWidth: step?.maxWidth || 400,
        boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
        border: '1px solid rgba(0,0,0,0.06)',
        ...tooltipProps?.style
      }}
    >
      {/* Contenido dinámico que viene del array de pasos */}
      <div className="react-joyride__content" style={{ marginBottom: 16 }}>
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
            fontSize: '13px',
            cursor: 'pointer',
            color: isDark ? '#94a3b8' : '#64748b',
            userSelect: 'none',
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          <div>
            {index > 0 && (
              <button
                {...backProps}
                type="button"
                style={{
                  marginRight: 8,
                  padding: '6px 12px',
                  cursor: 'pointer',
                  backgroundColor: isDark ? '#334155' : '#e2e8f0',
                  color: isDark ? '#f1f5f9' : '#334155',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                Atrás
              </button>
            )}
            <button
              {...skipProps}
              type="button"
              onClick={handleSkipClick}
              style={{
                padding: '6px 10px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: isDark ? '#94a3b8' : '#64748b',
                fontSize: '13px',
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
              padding: '7px 16px',
              backgroundColor: '#3874ff',
              color: '#ffffff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px',
              boxShadow: '0 2px 6px rgba(56, 116, 255, 0.35)',
            }}
          >
            {isLastStep ? 'Finalizar' : (index === 0 && step?.isWelcome ? 'Comenzar recorrido' : 'Siguiente')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CustomTooltip;
