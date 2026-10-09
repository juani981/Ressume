import React, { useEffect } from 'react';
import { useCV } from '../../context/CVContext';
import { Columns, FileText, Lightbulb, LightbulbOff, HelpCircle } from 'lucide-react';
import { useTourManager, TOUR_IDS } from '../../context/TourContext';

/**
 * LayoutModeToggle
 * 
 * Prominent top-center mode switcher placed between the screen top and #area-cv.
 * 
 * When two-column mode is enabled (via VITE_ENABLE_TWO_COLUMN_MODE=true in .env or enableTwoColumn prop),
 * displays the interactive toggle switcher between "Diseño Tradicional" (2 Columnas) and "Optimizado ATS" (1 Columna).
 * 
 * When two-column mode is disabled (default in pre-alpha),
 * gracefully hides the two-column mode selector and displays the harmonious
 * "MODO OPTIMIZADO ATS" badge legend with active indicator.
 */
const LayoutModeToggle = ({ enableTwoColumn }) => {
  const { cvData, updateLayout, showAITips, toggleAITips } = useCV();
  const { resetTourStatus } = useTourManager();

  const handleRestartTour = () => {
    if (resetTourStatus) {
      resetTourStatus(TOUR_IDS.ONBOARDING);
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('skip_onboarding_tour');
        localStorage.removeItem('seen_main_tour');
        localStorage.removeItem('seen_sidebar_tour');
        localStorage.removeItem('seen_import_cv_tour');
      } catch (_) {}
      window.dispatchEvent(
        new CustomEvent('start-cv-tour', {
          detail: { tour: 'main' },
        })
      );
    }
  };

  const isTwoColumnFeatureEnabled = typeof enableTwoColumn === 'boolean'
    ? enableTwoColumn
    : import.meta.env?.VITE_ENABLE_TWO_COLUMN_MODE === 'true';

  const isAtsMode = cvData?.layout?.isAtsMode === true || cvData?.layout?.type === '1-column';

  // Automatically synchronize to ATS mode if two-column mode is deactivated
  useEffect(() => {
    if (!isTwoColumnFeatureEnabled && !isAtsMode && updateLayout) {
      updateLayout({ type: '1-column', isAtsMode: true });
    }
  }, [isTwoColumnFeatureEnabled, isAtsMode, updateLayout]);

  const setVisualMode = () => {
    updateLayout({ type: '2-column', isAtsMode: false });
  };

  const setAtsMode = () => {
    updateLayout({ type: '1-column', isAtsMode: true });
  };

  const handleToggle = () => {
    if (isAtsMode) {
      setVisualMode();
    } else {
      setAtsMode();
    }
  };

  return (
    <div 
      className="layout-mode-toggle-container no-print"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '0.85rem',
        width: '100%',
        padding: '0.75rem 1rem 1.25rem 1rem',
        userSelect: 'none',
        zIndex: 50
      }}
    >
      {isTwoColumnFeatureEnabled ? (
        <div 
          className="layout-mode-toggle-pill"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.85rem',
            padding: '0.5rem 1rem',
            borderRadius: '9999px',
            backgroundColor: isAtsMode ? 'rgba(30, 41, 59, 0.92)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow: isAtsMode
              ? '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.12)'
              : '0 10px 30px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.06)',
            transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {/* Left Option: Diseño Tradicional (2 Columnas) */}
          <button
            type="button"
            onClick={setVisualMode}
            className={`layout-mode-label-btn ${!isAtsMode ? 'active' : ''}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: !isAtsMode ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
              color: !isAtsMode ? '#4f46e5' : (isAtsMode ? '#94a3b8' : '#64748b'),
              border: 'none',
              padding: '0.45rem 0.85rem',
              borderRadius: '9999px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: !isAtsMode ? 700 : 500,
              transition: 'all 0.25s ease'
            }}
            title="Cambiar a Diseño Libre (2 Columnas)"
            aria-pressed={!isAtsMode}
          >
            <Columns size={17} strokeWidth={!isAtsMode ? 2.5 : 1.75} color={!isAtsMode ? '#6366f1' : '#94a3b8'} />
            <span>Diseño Tradicional</span>
          </button>

          {/* Center: Large Toggle Switch (ON / OFF) */}
          <button
            type="button"
            role="switch"
            aria-checked={isAtsMode}
            aria-label={isAtsMode ? 'Cambiar a Diseño Tradicional (2 Columnas)' : 'Cambiar a Optimizado ATS'}
            title={isAtsMode ? 'Modo actual: Optimizado ATS. Click para cambiar a Diseño Tradicional.' : 'Modo actual: Diseño Tradicional. Click para cambiar a Optimizado ATS.'}
            data-testid="ats-mode-toggle"
            onClick={handleToggle}
            className="layout-mode-switch-btn"
            style={{
              position: 'relative',
              width: '60px',
              height: '32px',
              borderRadius: '9999px',
              background: isAtsMode 
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              border: 'none',
              padding: '3px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              boxShadow: isAtsMode
                ? 'inset 0 2px 4px rgba(0, 0, 0, 0.25), 0 0 12px rgba(16, 185, 129, 0.4)'
                : 'inset 0 2px 4px rgba(0, 0, 0, 0.25), 0 0 12px rgba(99, 102, 241, 0.4)',
              transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.35)',
                transform: isAtsMode ? 'translateX(28px)' : 'translateX(0px)',
                transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {isAtsMode ? (
                <FileText size={14} color="#059669" strokeWidth={2.5} />
              ) : (
                <Columns size={14} color="#4f46e5" strokeWidth={2.5} />
              )}
            </div>
          </button>

          {/* Right Option: Optimizado ATS (1 Columna) */}
          <button
            type="button"
            onClick={setAtsMode}
            className={`layout-mode-label-btn ${isAtsMode ? 'active' : ''}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: isAtsMode ? 'rgba(16, 185, 129, 0.18)' : 'transparent',
              color: isAtsMode ? '#34d399' : '#64748b',
              border: 'none',
              padding: '0.45rem 0.85rem',
              borderRadius: '9999px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: isAtsMode ? 700 : 500,
              transition: 'all 0.25s ease'
            }}
            title="Cambiar a Optimizado ATS"
            aria-pressed={isAtsMode}
          >
            <FileText size={17} strokeWidth={isAtsMode ? 2.5 : 1.75} color={isAtsMode ? '#10b981' : '#94a3b8'} />
            <span style={{ color: isAtsMode ? '#34d399' : (isAtsMode ? '#e2e8f0' : '#64748b') }}>Optimizado ATS</span>
          </button>
        </div>
      ) : (
        /* Harmonious ATS Optimized Mode Legend Pill */
        <div
          className="layout-mode-toggle-pill layout-mode-static-badge"
          data-testid="ats-mode-legend"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.5rem 1.15rem',
            borderRadius: '9999px',
            backgroundColor: 'rgba(30, 41, 59, 0.92)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35)',
            transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          title="Modo activo: Optimizado ATS (1 Columna estándar)"
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              color: '#10b981',
              flexShrink: 0
            }}
          >
            <FileText size={13} strokeWidth={2.5} color="#10b981" />
          </span>
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              color: '#e2e8f0',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.55rem'
            }}
          >
            <span>MODO OPTIMIZADO ATS</span>
            <span
              style={{
                display: 'inline-block',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                boxShadow: '0 0 8px #10b981'
              }}
              title="Activo"
            />
          </span>
        </div>
      )}

      {/* Global Master AI Tips Toggle */}
      <button
        type="button"
        role="switch"
        aria-checked={Boolean(showAITips)}
        data-testid="master-tips-toggle"
        onClick={() => toggleAITips && toggleAITips()}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.65rem',
          padding: '0.5rem 1.15rem',
          borderRadius: '9999px',
          backgroundColor: showAITips
            ? (isAtsMode ? 'rgba(234, 179, 8, 0.22)' : 'rgba(254, 240, 138, 0.45)')
            : (isAtsMode ? 'rgba(30, 41, 59, 0.92)' : 'rgba(255, 255, 255, 0.95)'),
          border: showAITips
            ? (isAtsMode ? '1px solid rgba(234, 179, 8, 0.5)' : '1px solid rgba(234, 179, 8, 0.65)')
            : (isAtsMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.08)'),
          color: showAITips ? (isAtsMode ? '#fde047' : '#854d0e') : (isAtsMode ? '#94a3b8' : '#64748b'),
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: '0.875rem',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: isAtsMode
            ? '0 10px 30px rgba(0, 0, 0, 0.5)'
            : '0 10px 30px rgba(0, 0, 0, 0.06)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        title={showAITips ? 'Ocultar todos los consejos IA' : 'Mostrar todos los consejos IA'}
      >
        {showAITips ? (
          <Lightbulb
            size={18}
            color="#eab308"
            fill="#facc15"
            strokeWidth={2.4}
            style={{
              filter: 'drop-shadow(0 0 6px #eab308) drop-shadow(0 0 12px rgba(250, 204, 21, 0.75))',
              transform: 'scale(1.1)',
              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          />
        ) : (
          <LightbulbOff
            size={18}
            color={isAtsMode ? '#94a3b8' : '#64748b'}
            strokeWidth={2}
            style={{
              opacity: 0.75,
              transition: 'all 0.3s ease',
            }}
          />
        )}
        <span>Sugerencias</span>
        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: '999px',
            backgroundColor: showAITips ? '#eab308' : (isAtsMode ? 'rgba(148, 163, 184, 0.25)' : 'rgba(148, 163, 184, 0.2)'),
            color: showAITips ? '#ffffff' : (isAtsMode ? '#cbd5e1' : '#64748b'),
            transition: 'all 0.25s ease'
          }}
        >
          {showAITips ? 'ON' : 'OFF'}
        </span>
      </button>

      {/* Botón de Ayuda para relanzar el tutorial completo */}
      <button
        type="button"
        id="btn-restart-tour"
        data-testid="btn-restart-tour"
        onClick={handleRestartTour}
        className="layout-mode-help-btn"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem',
          padding: '0.5rem 1.15rem',
          borderRadius: '9999px',
          backgroundColor: isAtsMode ? 'rgba(30, 41, 59, 0.92)' : 'rgba(255, 255, 255, 0.95)',
          border: isAtsMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.08)',
          color: isAtsMode ? '#cbd5e1' : '#475569',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: '0.875rem',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: isAtsMode
            ? '0 10px 30px rgba(0, 0, 0, 0.5)'
            : '0 10px 30px rgba(0, 0, 0, 0.06)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        title="Volver a iniciar el tutorial completo"
        aria-label="Volver a iniciar el tutorial completo"
      >
        <HelpCircle
          size={18}
          color={isAtsMode ? '#38bdf8' : '#0284c7'}
          strokeWidth={2.2}
        />
        <span>Tutorial</span>
      </button>
    </div>
  );
};

export default LayoutModeToggle;
