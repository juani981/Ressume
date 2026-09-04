import React from 'react';
import { useCV } from '../../context/CVContext';
import { Columns, FileText } from 'lucide-react';

/**
 * LayoutModeToggle
 * 
 * Prominent top-center mode switcher placed between the screen top and #area-cv.
 * Displays always-visible labels and icons on both sides:
 * - Left: "Diseño Tradicional" (2 Columnas)
 * - Center: Large interactive tactile toggle switch (ON / OFF)
 * - Right: "Optimizado ATS" (1 Columna)
 * Triggers a noticeable darker background when transitioning to ATS mode.
 */
const LayoutModeToggle = () => {
  const { cvData, updateLayout } = useCV();

  const isAtsMode = cvData.layout?.isAtsMode === true || cvData.layout?.type === '1-column';

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
        width: '100%',
        padding: '0.75rem 1rem 1.25rem 1rem',
        userSelect: 'none',
        zIndex: 50
      }}
    >
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
          {/* <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: '999px',
              background: !isAtsMode ? '#6366f1' : 'rgba(148, 163, 184, 0.2)',
              color: !isAtsMode ? '#ffffff' : (isAtsMode ? '#94a3b8' : '#64748b'),
              letterSpacing: '0.02em',
              transition: 'all 0.25s ease'
            }}
          >
            2 Col
          </span> */}
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
          {/* <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: '999px',
              background: isAtsMode ? '#10b981' : 'rgba(148, 163, 184, 0.2)',
              color: isAtsMode ? '#ffffff' : '#64748b',
              letterSpacing: '0.02em',
              transition: 'all 0.25s ease'
            }}
          >
            1 Col
          </span> */}
        </button>
      </div>
    </div>
  );
};

export default LayoutModeToggle;
