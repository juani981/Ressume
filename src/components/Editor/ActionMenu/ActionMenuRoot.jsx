import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useCV } from '../../../context/CVContext';
import AIExportModal from '../AIExportModal';
import VersionManagerModal from '../VersionManagerModal';
import { executeCleanPrint } from '../../../utils/staticHtmlPdfEngine';
import DesignPanel from './DesignPanel';
import {
  FileDown,
  Loader2,
  SlidersHorizontal,
  Undo2,
  Redo2,
  DatabaseSearch,
  BotMessageSquare,
  FileX,
  Globe,
  FileUp,
  ChevronRight,
  ChevronLeft,
  Pin,
  PinOff,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { BitacoraModal } from '../../Bitacora';

const HOVER_INTENT_MS = 280;
const EXIT_GRACE_MS = 350;

export const ActionMenuRoot = () => {
  const {
    cvData,
    activeLanguage,
    undo,
    redo,
    canUndo,
    canRedo,
    showToast,
    totalPages,
    deletePage,
  } = useCV();

  const [loading, setLoading] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiModalPromptId, setAiModalPromptId] = useState('recruiter_audit');
  const [isUnidirectionalOnly, setIsUnidirectionalOnly] = useState(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [isBitacoraOpen, setIsBitacoraOpen] = useState(false);
  const [isDesignMenuOpen, setIsDesignMenuOpen] = useState(false);
  const [activeDesignTab, setActiveDesignTab] = useState('typography');

  const isTestEnv =
    typeof process !== 'undefined' &&
    (process.env?.NODE_ENV === 'test' || Boolean(process.env?.VITEST));

  // Initialize isPinned from localStorage if available, or default to false in browser (true in tests)
  const [isPinned, setIsPinned] = useState(() => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return isTestEnv;
    try {
      const stored = localStorage.getItem('action_menu_pinned');
      if (stored !== null) return stored === 'true';
      return isTestEnv;
    } catch {
      return isTestEnv;
    }
  });

  const [isHoverExpanded, setIsHoverExpanded] = useState(false);
  const [isHoverPreparing, setIsHoverPreparing] = useState(false);

  const hoverIntentTimerRef = useRef(null);
  const exitGraceTimerRef = useRef(null);

  const isAtsMode = cvData?.layout?.isAtsMode === true || cvData?.layout?.type === '1-column';

  // If any modal or submenu is active, keep toolbar expanded
  const isExpanded =
    isPinned ||
    isHoverExpanded ||
    isDesignMenuOpen ||
    isAIModalOpen ||
    isVersionModalOpen ||
    isBitacoraOpen;

  const handleTogglePin = useCallback(() => {
    setIsPinned((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('action_menu_pinned', String(next));
      } catch {}
      return next;
    });
  }, []);

  const handleCollapse = useCallback(() => {
    setIsPinned(false);
    setIsHoverExpanded(false);
    setIsHoverPreparing(false);
    setIsDesignMenuOpen(false);
    try {
      localStorage.setItem('action_menu_pinned', 'false');
    } catch {}
    if (hoverIntentTimerRef.current) clearTimeout(hoverIntentTimerRef.current);
    if (exitGraceTimerRef.current) clearTimeout(exitGraceTimerRef.current);
  }, []);

  const handlePeekClick = useCallback(() => {
    setIsPinned(true);
    setIsHoverExpanded(true);
    setIsHoverPreparing(false);
    try {
      localStorage.setItem('action_menu_pinned', 'true');
    } catch {}
    if (hoverIntentTimerRef.current) clearTimeout(hoverIntentTimerRef.current);
    if (exitGraceTimerRef.current) clearTimeout(exitGraceTimerRef.current);
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (exitGraceTimerRef.current) {
      clearTimeout(exitGraceTimerRef.current);
      exitGraceTimerRef.current = null;
    }
    if (!isExpanded) {
      setIsHoverPreparing(true);
      hoverIntentTimerRef.current = setTimeout(() => {
        setIsHoverExpanded(true);
        setIsHoverPreparing(false);
      }, HOVER_INTENT_MS);
    }
  }, [isExpanded]);

  const handleMouseLeave = useCallback(() => {
    if (hoverIntentTimerRef.current) {
      clearTimeout(hoverIntentTimerRef.current);
      hoverIntentTimerRef.current = null;
    }
    setIsHoverPreparing(false);

    if (!isPinned && !isDesignMenuOpen) {
      exitGraceTimerRef.current = setTimeout(() => {
        setIsHoverExpanded(false);
      }, EXIT_GRACE_MS);
    }
  }, [isPinned, isDesignMenuOpen]);

  useEffect(() => {
    return () => {
      if (hoverIntentTimerRef.current) clearTimeout(hoverIntentTimerRef.current);
      if (exitGraceTimerRef.current) clearTimeout(exitGraceTimerRef.current);
    };
  }, []);

  const handleGeneratePDF = async () => {
    if (loading) return;
    setLoading(true);

    showToast('Generando PDF optimizado y preparando impresión...', 'loading', 0);

    let isFinished = false;
    let focusTimeout = null;
    let fallbackTimeout = null;

    const onControlReturned = () => {
      if (isFinished) return;
      isFinished = true;
      if (focusTimeout) clearTimeout(focusTimeout);
      if (fallbackTimeout) clearTimeout(fallbackTimeout);
      if (typeof window !== 'undefined') {
        window.removeEventListener('afterprint', onControlReturned);
        window.removeEventListener('print-dialog-closed', onControlReturned);
        window.removeEventListener('focus', onControlReturned);
      }
      setLoading(false);
      showToast('¡Documento PDF procesado correctamente!', 'success', 3500);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('afterprint', onControlReturned, { once: true });
      window.addEventListener('print-dialog-closed', onControlReturned, { once: true });
    }

    focusTimeout = setTimeout(() => {
      if (typeof window !== 'undefined' && !isFinished) {
        window.addEventListener('focus', onControlReturned, { once: true });
      }
    }, 1200);

    fallbackTimeout = setTimeout(() => {
      onControlReturned();
    }, 8000);

    try {
      await executeCleanPrint(cvData, activeLanguage);
    } catch (e) {
      console.warn('executeCleanPrint fallback', e);
      if (typeof window !== 'undefined') {
        window.print();
      }
      onControlReturned();
    }
  };

  return (
    <>
      {/* Streamlined Floating Action Toolbar & Full-Height Peek Rail */}
      <div
        className={`l-navbar no-print ${isExpanded ? 'is-expanded' : 'is-collapsed'} ${isHoverPreparing ? 'is-preparing' : ''}`}
        data-expanded={isExpanded}
        data-testid="action-menu-navbar"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={!isExpanded ? handlePeekClick : undefined}
        style={{
          position: 'fixed',
          left: 0,
          top: '50%',
          transform: isExpanded
            ? 'translateY(-50%) translateX(0)'
            : isHoverPreparing
            ? 'translateY(-50%) translateX(calc(-100% + 22px))'
            : 'translateY(-50%) translateX(calc(-100% + 16px))',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.6rem',
          background: isAtsMode ? 'rgba(35, 45, 65, 0.60)' : 'var(--container-color, #ffffff)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          padding: '0.65rem 0.65rem 0.85rem 0.65rem',
          borderRadius: '0 16px 16px 0',
          boxShadow: isExpanded
            ? '0 12px 32px rgba(0, 0, 0, 0.16)'
            : isHoverPreparing
            ? '0 6px 20px rgba(59, 130, 246, 0.35)'
            : '0 6px 20px rgba(0, 0, 0, 0.12)',
          borderTop: isAtsMode
            ? '1px solid rgba(255, 255, 255, 0.12)'
            : '1px solid rgba(0, 0, 0, 0.08)',
          borderRight: isHoverPreparing
            ? '2px solid #3b82f6'
            : isAtsMode
            ? '1px solid rgba(255, 255, 255, 0.15)'
            : '1px solid rgba(0, 0, 0, 0.12)',
          borderBottom: isAtsMode
            ? '1px solid rgba(255, 255, 255, 0.12)'
            : '1px solid rgba(0, 0, 0, 0.08)',
          borderLeft: 'none',
          zIndex: 100,
          cursor: isExpanded ? 'default' : 'pointer',
          transition:
            'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s ease, border-color 0.2s ease',
        }}
        title={!isExpanded ? 'Herramientas (Click para fijar, o mantén el cursor para abrir)' : undefined}
        aria-label="Barra de herramientas del editor"
      >
        {/* Full-Height Peek Handle Indicator Strip on Right Edge */}
        <div
          className="action-menu-edge-handle"
          data-testid="action-menu-peek-tab"
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            pointerEvents: isExpanded ? 'none' : 'auto',
            opacity: isExpanded ? 0 : 1,
            transition: 'opacity 0.18s ease',
          }}
          title="Herramientas (Click para fijar, o mantén el cursor para abrir)"
          aria-label="Abrir panel de herramientas"
        >
          <div
            style={{
              width: '3px',
              height: '32px',
              borderRadius: '999px',
              backgroundColor: isHoverPreparing
                ? '#3b82f6'
                : isAtsMode
                ? 'rgba(255, 255, 255, 0.35)'
                : 'rgba(0, 0, 0, 0.22)',
              transition: 'background-color 0.2s ease',
            }}
          />
          <ChevronRight
            size={12}
            color={isHoverPreparing ? '#3b82f6' : isAtsMode ? '#cbd5e1' : '#64748b'}
            style={{
              transform: isHoverPreparing ? 'translateX(1px)' : 'none',
              transition: 'transform 0.2s ease, color 0.2s ease',
            }}
          />
          <div
            style={{
              width: '3px',
              height: '32px',
              borderRadius: '999px',
              backgroundColor: isHoverPreparing
                ? '#3b82f6'
                : isAtsMode
                ? 'rgba(255, 255, 255, 0.35)'
                : 'rgba(0, 0, 0, 0.22)',
              transition: 'background-color 0.2s ease',
            }}
          />
        </div>

        {/* Inner Content Wrapper */}
        <div
          className="action-menu-inner-content"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.6rem',
            width: '100%',
            opacity: isExpanded ? 1 : 0,
            pointerEvents: isExpanded ? 'auto' : 'none',
            transition: 'opacity 0.2s ease',
          }}
        >
          {/* Header with Collapse and Pin controls */}
          <div
            className="action-menu-header"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '0 2px 2px 2px',
            }}
          >
            <button
              type="button"
              className="action-menu-control-btn action-menu-collapse-btn"
              data-testid="btn-collapse-action-menu"
              onClick={handleCollapse}
              aria-label="Ocultar barra de herramientas"
              title="Ocultar barra de herramientas"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '3px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isAtsMode ? '#94a3b8' : '#64748b',
                transition: 'background-color 0.15s ease, color 0.15s ease',
              }}
            >
              <ChevronLeft size={16} />
            </button>

            <button
              type="button"
              className={`action-menu-control-btn action-menu-pin-btn ${isPinned ? 'is-pinned' : ''}`}
              data-testid="btn-pin-action-menu"
              onClick={handleTogglePin}
              aria-label={isPinned ? 'Desanclar panel (modo auto-ocultar)' : 'Fijar panel abierto'}
              title={isPinned ? 'Desanclar panel (modo auto-ocultar)' : 'Fijar panel abierto'}
              style={{
                background: isPinned ? 'rgba(59, 130, 246, 0.15)' : 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '3px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isPinned ? '#3b82f6' : isAtsMode ? '#94a3b8' : '#64748b',
                transition: 'background-color 0.15s ease, color 0.15s ease',
              }}
            >
              {isPinned ? <Pin size={15} /> : <PinOff size={15} />}
            </button>
          </div>

          <hr
            style={{
              width: '100%',
              border: 'none',
              borderTop: isAtsMode
                ? '1px solid rgba(255, 255, 255, 0.08)'
                : '1px solid rgba(0, 0, 0, 0.08)',
              margin: '0.1rem 0',
            }}
          />
        {/* Deshacer (Undo) */}
        <div className="action-menu-btn-wrap">
          <button
            type="button"
            className="action-menu-btn"
            onClick={undo}
            disabled={!canUndo}
            style={{
              color: canUndo ? '#3b82f6' : '#94a3b8',
              opacity: canUndo ? 1 : 0.35,
              cursor: canUndo ? 'pointer' : 'not-allowed',
            }}
            aria-label="Deshacer última acción (Ctrl+Z)"
            title="Deshacer última acción (Ctrl+Z)"
          >
            <Undo2 size={20} />
          </button>
          <span className="action-menu-tooltip">Deshacer (Ctrl+Z)</span>
        </div>

        {/* Rehacer (Redo) */}
        <div className="action-menu-btn-wrap">
          <button
            type="button"
            className="action-menu-btn"
            onClick={redo}
            disabled={!canRedo}
            style={{
              color: canRedo ? '#3b82f6' : '#94a3b8',
              opacity: canRedo ? 1 : 0.35,
              cursor: canRedo ? 'pointer' : 'not-allowed',
            }}
            aria-label="Rehacer acción (Ctrl+Y)"
            title="Rehacer acción (Ctrl+Y)"
          >
            <Redo2 size={20} />
          </button>
          <span className="action-menu-tooltip">Rehacer (Ctrl+Y)</span>
        </div>

        <hr
            style={{
              width: '100%',
              border: 'none',
              borderTop: isAtsMode
                ? '1px solid rgba(255, 255, 255, 0.08)'
                : '1px solid rgba(0, 0, 0, 0.08)',
              margin: '0.1rem 0',
            }}
          />
{/* Gestor de Versiones */}
        <div className="action-menu-btn-wrap">
          <button
            type="button"
            className="version-hub-btn action-menu-hub-btn"
            id="versiones-item"
            data-testid="btn-open-version-manager"
            aria-label="Gestor de Versiones"
            title="Gestor de Versiones"
            onClick={() => setIsVersionModalOpen(true)}
          >
            <DatabaseSearch size={20} color="#3b82f6" />
          </button>
          <span className="action-menu-tooltip">Gestor de Versiones</span>
        </div>

        {/* Bitácora & Playbook de Carrera */}
        <div className="action-menu-btn-wrap">
          <button
            type="button"
            className="version-hub-btn action-menu-hub-btn"
            id="bitacora-item"
            data-testid="btn-open-bitacora"
            aria-label="Bitácora y Recursos de Carrera"
            title="Bitácora y Playbook de Carrera"
            onClick={() => setIsBitacoraOpen(true)}
          >
            <BookOpen size={20} color="#6366f1" />
          </button>
          <span className="action-menu-tooltip">Bitácora & Recursos</span>
        </div>
          {/* Ajustes de Diseño (Tipografía, Espaciado, Colores) */}
        <div className="action-menu-btn-wrap">
          <button
            type="button"
            className="version-hub-btn action-menu-hub-btn"
            id="design-item"
            data-testid="btn-open-design"
            aria-label="Ajustes de Diseño y Tipografía"
            title="Ajustes de Diseño (Tipografía, Espaciado y Colores)"
            onClick={() => setIsDesignMenuOpen((prev) => !prev)}
          >
            <SlidersHorizontal size={20} color='#b8b79a' />
          </button>
          <span className="action-menu-tooltip">
            Diseño (Colores, Espaciado, Tipografía)
          </span>
        </div>
                <hr
            style={{
              width: '100%',
              border: 'none',
              borderTop: isAtsMode
                ? '1px solid rgba(255, 255, 255, 0.08)'
                : '1px solid rgba(0, 0, 0, 0.08)',
              margin: '0.1rem 0',
            }}
          />
        {/* Grupo de Herramientas IA (Prompting & Asistencia) */}
        <div
          className="action-menu-ai-group"
          data-testid="action-menu-ai-group"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.45rem',
            width: '100%',
            padding: '0.45rem 0.25rem 0.45rem 0.25rem',
            borderRadius: '12px',
            background: isAtsMode
              ? 'linear-gradient(180deg, rgba(168, 85, 247, 0.16) 0%, rgba(99, 102, 241, 0.10) 100%)'
              : 'linear-gradient(180deg, rgba(168, 85, 247, 0.10) 0%, rgba(99, 102, 241, 0.05) 100%)',
            border: isAtsMode
              ? '1px solid rgba(168, 85, 247, 0.35)'
              : '1px solid rgba(168, 85, 247, 0.25)',
            boxShadow: isAtsMode
              ? '0 0 14px rgba(168, 85, 247, 0.16), inset 0 0 10px rgba(168, 85, 247, 0.06)'
              : '0 2px 10px rgba(147, 51, 234, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
            position: 'relative',
            transition: 'all 0.25s ease',
          }}
          >
            
          {/* Banderita / Leyenda de IA con Icono de Estrellas */}
          <div
            className="action-menu-ai-badge"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              padding: '2px 6px',
              borderRadius: '999px',
              background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
              color: '#ffffff',
              fontSize: '0.58rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              lineHeight: 1,
              boxShadow: '0 2px 6px rgba(168, 85, 247, 0.45)',
              marginBottom: '2px',
              userSelect: 'none',
            }}
            title="Herramientas y Prompts Asistidos por IA"
          >
            <Sparkles size={10} color="#ffffff" fill="#ffffff" />
            <span>IA</span>
          </div>

          {/* Generar Prompts de IA (Unidireccional: Auditoría ATS, Entrevistas, STAR) */}
          <div className="action-menu-btn-wrap">
            <button
              type="button"
              className="action-menu-btn"
              id="ia-prompts-item"
              onClick={() => {
                setAiModalPromptId('recruiter_audit');
                setIsUnidirectionalOnly(true);
                setIsAIModalOpen(true);
              }}
              style={{
                color: isAtsMode ? '#c084fc' : '#9333ea',
                borderRadius: '8px',
              }}
              aria-label="Generar Prompts de IA"
              title="Generar Prompts de IA"
            >
              <BotMessageSquare />
            </button>
            <span className="action-menu-tooltip">Generar Prompts para análisis</span>
          </div>

          {/* Traducir CV a Inglés US Tech (Modo Bidireccional Independiente 1) */}
          <div className="action-menu-btn-wrap">
            <button
              type="button"
              className="translation-hub-btn action-menu-hub-btn"
              id="translation-action-item"
              data-testid="btn-open-translation"
              onClick={() => {
                setAiModalPromptId('translate_english');
                setIsUnidirectionalOnly(false);
                setIsAIModalOpen(true);
              }}
              aria-label={`Traducir CV (Idioma actual: ${String(activeLanguage || 'es').toUpperCase()})`}
              title={`Idioma actual: ${String(activeLanguage || 'es').toUpperCase()}. Clic para traducir CV`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1px',
                padding: '0.2rem 0.35rem',
              }}
            >
              <span
                style={{
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  lineHeight: 1,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: '#10b981',
                  userSelect: 'none',
                }}
              >
                {String(activeLanguage || 'es').toUpperCase()}
              </span>
              <Globe size={18} color="#10b981" />
            </button>
            <span className="action-menu-tooltip">Idioma: {String(activeLanguage || 'es').toUpperCase()} (Traducir CV)</span>
          </div>

          {/* Trae tu propio CV (Modo Bidireccional Independiente 2: Conversor PDF a ATS) */}
          <div className="action-menu-btn-wrap">
            <button
              type="button"
              className="byo-cv-hub-btn action-menu-hub-btn"
              id="byo-cv-action-item"
              data-testid="btn-open-byo-cv"
              onClick={() => {
                setAiModalPromptId('bring_your_own_cv');
                setIsUnidirectionalOnly(false);
                setIsAIModalOpen(true);
              }}
              aria-label="Trae tu propio CV (PDF a ATS 1:1)"
              title="Trae tu propio CV (Conversor PDF a JSON ATS 1:1)"
            >
              <FileUp size={20} color="#f59e0b" />
            </button>
            <span className="action-menu-tooltip">Importar CV (Conversor ATS)</span>
          </div>
        </div>

        <hr
            style={{
              width: '100%',
              border: 'none',
              borderTop: isAtsMode
                ? '1px solid rgba(255, 255, 255, 0.08)'
                : '1px solid rgba(0, 0, 0, 0.08)',
              margin: '0.1rem 0',
            }}
          />

        {/* Acciones de Exportación: Native Print / Clean PDF Export */}
        <div className="action-menu-btn-wrap">
          <button
            type="button"
            className="action-menu-btn"
            onClick={handleGeneratePDF}
            disabled={loading}
            aria-label="Descargar / Imprimir PDF"
            title="Descargar / Imprimir PDF"
            data-testid="btn-action-native-print"
          >
            {loading ? (
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <FileDown size={20} color="#DC143C" />
            )}
          </button>
          <span className="action-menu-tooltip">Descargar/Imprimir PDF</span>
        </div>

        </div>
      </div>

      {/* Submenu 1: 'Diseño' Popover */}
      <div
        onMouseEnter={() => {
          if (exitGraceTimerRef.current) {
            clearTimeout(exitGraceTimerRef.current);
            exitGraceTimerRef.current = null;
          }
        }}
        onMouseLeave={handleMouseLeave}
      >
        <DesignPanel
          isOpen={isDesignMenuOpen}
          onClose={() => setIsDesignMenuOpen(false)}
          activeTab={activeDesignTab}
          setActiveTab={setActiveDesignTab}
        />
      </div>

      {/* Modales */}
      <AIExportModal 
        isOpen={isAIModalOpen} 
        onClose={() => setIsAIModalOpen(false)} 
        initialPromptId={aiModalPromptId}
        unidirectionalOnly={isUnidirectionalOnly}
      />
      <VersionManagerModal isOpen={isVersionModalOpen} onClose={() => setIsVersionModalOpen(false)} />
      <BitacoraModal isOpen={isBitacoraOpen} onClose={() => setIsBitacoraOpen(false)} />
    </>
  );
};

export default ActionMenuRoot;
