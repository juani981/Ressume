import React, { useState } from 'react';
import { useCV } from '../../../context/CVContext';
import AIExportModal from '../AIExportModal';
import TranslationModal from '../TranslationModal';
import VersionManagerModal from '../VersionManagerModal';
import { executeCleanPrint } from '../../../utils/staticHtmlPdfEngine';
import DesignPanel from './DesignPanel';
import {
  FileDown,
  Loader2,
  Palette,
  Undo2,
  Redo2,
  History,
  BotMessageSquare,
  FileX,
  Globe,
  FileUp,
} from 'lucide-react';

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
  const [isTranslationModalOpen, setIsTranslationModalOpen] = useState(false);
  const [isDesignMenuOpen, setIsDesignMenuOpen] = useState(false);
  const [activeDesignTab, setActiveDesignTab] = useState('typography');

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
      {/* Streamlined Floating Action Toolbar */}
      <div
        className="l-navbar no-print"
        style={{
          position: 'fixed',
          left: '1.25rem',
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.65rem',
          background: 'var(--container-color, #ffffff)',
          padding: '0.85rem 0.65rem',
          borderRadius: '14px',
          boxShadow: '0 10px 28px rgba(0, 0, 0, 0.14)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          zIndex: 100,
        }}
      >
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
            borderTop: '1px solid rgba(0, 0, 0, 0.08)',
            margin: '0.1rem 0',
          }}
        />

        {/* Ajustes de Diseño (Tipografía, Espaciado, Colores) */}
        <svg width="0" height="0" style={{ position: 'absolute' }}>
          <linearGradient id="rainbow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="red" />
            <stop offset="17%" stopColor="orange" />
            <stop offset="33%" stopColor="yellow" />
            <stop offset="50%" stopColor="green" />
            <stop offset="67%" stopColor="blue" />
            <stop offset="83%" stopColor="indigo" />
            <stop offset="100%" stopColor="violet" />
          </linearGradient>
        </svg>
        <div className="action-menu-btn-wrap">
          <button
            type="button"
            className="action-menu-btn"
            onClick={() => setIsDesignMenuOpen((prev) => !prev)}
            style={{
              color: isDesignMenuOpen ? '#3874ff' : '#6366f1',
              background: isDesignMenuOpen ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
              borderRadius: '8px',
            }}
            aria-label="Ajustes de Diseño y Tipografía"
            title="Ajustes de Diseño (Tipografía, Espaciado y Colores)"
            data-testid="btn-open-design"
          >
            <Palette size={20} stroke="url(#rainbow-gradient)" />
          </button>
          <span className="action-menu-tooltip">
            Diseño (Colores, Espaciado, Tipografía)
          </span>
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
            style={{ color: '#BE00F7' }}
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

        <hr
          style={{
            width: '100%',
            border: 'none',
            borderTop: '1px solid rgba(0, 0, 0, 0.08)',
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
            <History size={20} color="#3b82f6" />
          </button>
          <span className="action-menu-tooltip">Gestor de Versiones</span>
        </div>

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

        {/* Eliminar Página */}
        <div className="action-menu-btn-wrap">
          <button
            type="button"
            className="action-menu-btn delete-page-btn"
            onClick={() => deletePage && deletePage()}
            aria-label="Eliminar página"
            title={totalPages > 1 ? `Eliminar página (Página ${totalPages})` : 'Eliminar página'}
            data-testid="btn-delete-page"
            style={{
              color: totalPages > 1 ? '#ef4444' : '#94a3b8',
              cursor: 'pointer',
            }}
          >
            <FileX size={20} />
          </button>
          <span className="action-menu-tooltip">
            {totalPages > 1 ? `Eliminar página ${totalPages}` : 'Eliminar página'}
          </span>
        </div>
      </div>

      {/* Submenu 1: 'Diseño' Popover */}
      <DesignPanel
        isOpen={isDesignMenuOpen}
        onClose={() => setIsDesignMenuOpen(false)}
        activeTab={activeDesignTab}
        setActiveTab={setActiveDesignTab}
      />

      {/* Modales */}
      <AIExportModal 
        isOpen={isAIModalOpen} 
        onClose={() => setIsAIModalOpen(false)} 
        initialPromptId={aiModalPromptId}
        unidirectionalOnly={isUnidirectionalOnly}
      />
      <TranslationModal isOpen={isTranslationModalOpen} onClose={() => setIsTranslationModalOpen(false)} />
      <VersionManagerModal isOpen={isVersionModalOpen} onClose={() => setIsVersionModalOpen(false)} />
    </>
  );
};

export default ActionMenuRoot;
