import React, { useState } from 'react';
import { useCV } from '../../context/CVContext';
import AIExportModal from './AIExportModal';
import TranslationModal from './TranslationModal';
import VersionManagerModal from './VersionManagerModal';
import ColorPickerSwatch from './ColorPickerSwatch';
import { executeCleanPrint } from '../../utils/staticHtmlPdfEngine';
import { 
  Columns, 
  FileText,
  FileDown,
  Loader2,
  SlidersHorizontal,
  Palette,
  X,
  Undo2,
  Redo2,
  RotateCcw,
  Info,
  History,
  BotMessageSquare,
  Languages,
  FolderDown
} from 'lucide-react';

const ActionMenu = () => {
  const { 
    cvData, 
    updateLayout, 
    activeLanguage, 
    undo, 
    redo, 
    canUndo, 
    canRedo, 
    resetToDefault,
    showToast 
  } = useCV();

  const [loading, setLoading] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  
  // Grouped Submenus State (Epic 3)
  const [isDesignMenuOpen, setIsDesignMenuOpen] = useState(false);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const [isTranslationModalOpen, setIsTranslationModalOpen] = useState(false);
  const [activeDesignTab, setActiveDesignTab] = useState('typography');

  const isAtsMode = cvData.layout?.isAtsMode === true || cvData.layout?.type === '1-column';
  const is2Col = cvData.layout?.type === '2-column' && !cvData.layout?.isAtsMode;

  const toggleAtsMode = () => {
    if (isAtsMode) {
      updateLayout({ type: '2-column', isAtsMode: false });
    } else {
      updateLayout({ type: '1-column', isAtsMode: true });
    }
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cvData, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `cv-state-${activeLanguage || 'es'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleGeneratePDF = async () => {
    if (loading) return;
    setLoading(true);

    // 1. Inicia toast de carga con spinner
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
      // 2. Notificación de confirmación tras cerrar el diálogo o retomar el control
      showToast('¡Documento PDF procesado correctamente!', 'success', 3500);
    };

    // Escuchar eventos de cierre de impresión y foco del usuario
    if (typeof window !== 'undefined') {
      window.addEventListener('afterprint', onControlReturned, { once: true });
      window.addEventListener('print-dialog-closed', onControlReturned, { once: true });
    }

    focusTimeout = setTimeout(() => {
      if (typeof window !== 'undefined' && !isFinished) {
        window.addEventListener('focus', onControlReturned, { once: true });
      }
    }, 1200);

    // Fallback de seguridad en caso de entornos donde no se disparen eventos de ventana
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

  const currentFontFamily = cvData.layout?.fontFamily || 'Poppins';
  const fontScale = cvData.layout?.fontScale ?? 1.0;
  const titleScale = cvData.layout?.titleScale ?? 1.0;
  const bodyScale = cvData.layout?.bodyScale ?? 1.0;
  const listScale = cvData.layout?.listScale ?? 1.0;
  const lineHeight = cvData.layout?.lineHeight ?? 1.45;
  const pagePadding = cvData.layout?.pagePadding ?? 24;
  const sectionGap = cvData.layout?.sectionGap ?? 20;
  const itemGap = cvData.layout?.itemGap ?? 8;
  const leftColumnWidth = cvData.layout?.leftColumnWidth || 33;

  return (
    <>
      {/* Streamlined Floating Action Toolbar (Epic 3) */}
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
          zIndex: 100 
        }}
      >
        {/* 1. Modo ATS Switch */}
        <div 
          className="ats-toggle-container action-menu-btn-wrap" 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: '3px', 
            paddingBottom: '0.2rem' 
          }}
        >
          <button
            type="button"
            aria-pressed={isAtsMode}
            onClick={toggleAtsMode}
            className="action-menu-btn ats-switch-btn"
            style={{
              width: '42px',
              height: '24px',
              borderRadius: '999px',
              background: isAtsMode ? '#10b981' : '#6366f1',
              border: 'none',
              padding: '2px',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background-color 0.25s ease',
              display: 'flex',
              alignItems: 'center',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)'
            }}
            aria-label={isAtsMode ? 'Cambiar a 2 Columnas (Visual)' : 'Cambiar a 1 Columna (Lineal ATS)'}
            title={isAtsMode ? 'Cambiar a 2 Columnas (Visual)' : 'Cambiar a 1 Columna (Lineal ATS)'}
            data-testid="action-menu-ats-toggle"
          >
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: '#ffffff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                transform: isAtsMode ? 'translateX(18px)' : 'translateX(0px)',
                transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {isAtsMode ? (
                <FileText size={12} color="#10b981" />
              ) : (
                <Columns size={12} color="#6366f1" />
              )}
            </div>
          </button>
          <span style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: isAtsMode ? '#059669' : '#6366f1' }}>
            {isAtsMode ? 'ATS' : '2-COL'}
          </span>
          <span className="action-menu-tooltip">
            {isAtsMode ? 'Modo ATS (Activo) - Cambiar a 2 Columnas' : 'Modo 2 Columnas (Activo) - Cambiar a ATS'}
          </span>
        </div>

        <hr style={{ width: '100%', border: 'none', borderTop: '1px solid rgba(0, 0, 0, 0.08)', margin: '0.1rem 0' }} />

        {/* 2. Deshacer (Undo) */}
        <div className="action-menu-btn-wrap">
          <button 
            type="button"
            className="action-menu-btn"
            onClick={undo}
            disabled={!canUndo}
            style={{ 
              color: canUndo ? '#3b82f6' : '#94a3b8', 
              opacity: canUndo ? 1 : 0.35, 
              cursor: canUndo ? 'pointer' : 'not-allowed' 
            }}
            aria-label="Deshacer última acción (Ctrl+Z)"
            title="Deshacer última acción (Ctrl+Z)"
          >
            <Undo2 size={20} />
          </button>
          <span className="action-menu-tooltip">
            Deshacer (Ctrl+Z)
          </span>
        </div>

        {/* 3. Rehacer (Redo) */}
        <div className="action-menu-btn-wrap">
          <button 
            type="button"
            className="action-menu-btn"
            onClick={redo}
            disabled={!canRedo}
            style={{ 
              color: canRedo ? '#3b82f6' : '#94a3b8', 
              opacity: canRedo ? 1 : 0.35, 
              cursor: canRedo ? 'pointer' : 'not-allowed' 
            }}
            aria-label="Rehacer acción (Ctrl+Y)"
            title="Rehacer acción (Ctrl+Y)"
          >
            <Redo2 size={20} />
          </button>
          <span className="action-menu-tooltip">
            Rehacer (Ctrl+Y)
          </span>
        </div>

        {/* 4. Restablecer CV Original */}
        <div className="action-menu-btn-wrap">
          <button 
            type="button"
            className="action-menu-btn"
            onClick={() => {
              if (window.confirm('¿Restablecer el CV con los datos y contacto originales? Puedes deshacer con Ctrl+Z.')) {
                resetToDefault();
              }
            }}
            style={{ color: '#f59e0b' }}
            aria-label="Restablecer CV original (Juan Ignacio Carrizo)"
            title="Restablecer CV original (Juan Ignacio Carrizo)"
          >
            <RotateCcw size={20} />
          </button>
          <span className="action-menu-tooltip">
            Restablecer CV
          </span>
        </div>

        {/* 5. Idiomas y Traducción */}
        <div className="action-menu-btn-wrap">
          <button 
            type="button"
            className="action-menu-btn"
            onClick={() => setIsTranslationModalOpen(true)}
            style={{ color: '#0ea5e9' }}
            aria-label="Idiomas y Traducción"
            title="Idiomas y Traducción del CV"
          >
            <Languages size={20} />
          </button>
          <span className="action-menu-tooltip">
            Idiomas y Traducción
          </span>
        </div>

        <hr style={{ width: '100%', border: 'none', borderTop: '1px solid rgba(0, 0, 0, 0.08)', margin: '0.1rem 0' }} />

        {/* 6. Generar Prompts de IA */}
        <div className="action-menu-btn-wrap">
          <button 
            type="button"
            className="action-menu-btn"
            id='ia-prompts-item'
            onClick={() => setIsAIModalOpen(true)} 
            style={{ color: '#BE00F7' }}
            aria-label="Generar Prompts de IA"
            title="Generar Prompts de IA"
          >
            <BotMessageSquare/>
          </button>
          <span className="action-menu-tooltip">
            Generar Prompts para análisis
          </span>
        </div>

        {/* Gestor de Versiones */}
        <div className="action-menu-btn-wrap">
          <button
            type="button"
            className="version-hub-btn action-menu-hub-btn"
            id='versiones-item'
            data-testid="btn-open-version-manager"
            aria-label="Gestor de Versiones"
            title="Gestor de Versiones"
            onClick={() => setIsVersionModalOpen(true)}
          >
            <History size={20} color="#3b82f6" />
          </button>
          <span className="action-menu-tooltip">Gestor de Versiones</span>
        </div>

        <hr style={{ width: '100%', border: 'none', borderTop: '1px solid rgba(0, 0, 0, 0.08)', margin: '0.1rem 0' }} />

        {/* 7. Ajustes de Diseño (Tipografía, Espaciado, Colores) */}
        <div className="action-menu-btn-wrap">
          <button 
            type="button"
            className="action-menu-btn"
            onClick={() => {
              setIsDesignMenuOpen(prev => {
                if (!prev) setIsActionsMenuOpen(false);
                return !prev;
              });
            }} 
            style={{ 
              color: isDesignMenuOpen ? '#3874ff' : '#6366f1',
              background: isDesignMenuOpen ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
              borderRadius: '8px'
            }}
            aria-label="Ajustes de Diseño y Tipografía"
            title="Ajustes de Diseño (Tipografía, Espaciado y Colores)"
            data-testid="btn-open-design"
          >
            <Palette size={20} />
          </button>
          <span className="action-menu-tooltip">
            Diseño (Colores, Espaciado, Tipografía)
          </span>
        </div>

        {/* 8. Acciones de Exportación */}
        <div className="action-menu-btn-wrap">
          <button 
            type="button"
            className="action-menu-btn"
            onClick={() => {
              setIsActionsMenuOpen(prev => {
                if (!prev) setIsDesignMenuOpen(false);
                return !prev;
              });
            }} 
            style={{ 
              color: isActionsMenuOpen ? '#3874ff' : '#e11d48',
              background: isActionsMenuOpen ? 'rgba(225, 29, 72, 0.1)' : 'transparent',
              borderRadius: '8px'
            }}
            aria-label="Acciones y Exportación"
            title="Acciones y Exportación (PDF, JSON)"
            data-testid="btn-open-actions"
          >
            <FolderDown size={20} />
          </button>
          <span className="action-menu-tooltip">
            Acciones de Exportación
          </span>
        </div>
      </div>

      {/* =========================================================================
          Grouped Submenu 1: 'Diseño' Popover (Colors, Spacing, Typography)
          ========================================================================= */}
      <div 
        className="design-popover no-print"
        style={{
          position: 'fixed',
          left: '4.75rem',
          top: '50%',
          transform: isDesignMenuOpen ? 'translateY(-50%) scale(1)' : 'translateY(-50%) scale(0.96)',
          background: 'var(--container-color, #ffffff)',
          borderRadius: '14px',
          padding: '1.25rem',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          width: '320px',
          maxHeight: '90vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          opacity: isDesignMenuOpen ? 1 : 0,
          pointerEvents: isDesignMenuOpen ? 'auto' : 'none',
          transition: 'opacity 0.2s ease, transform 0.2s ease'
        }}
        data-testid="design-submenu"
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.08)', paddingBottom: '0.5rem' }}>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--title-color, #111)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Palette size={18} color="#6366f1" /> Ajustes de Diseño
          </span>
          <button 
            type="button"
            onClick={() => setIsDesignMenuOpen(false)}
            aria-label="Cerrar panel de diseño"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: '4px', display: 'flex' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Submenu Navigation Tabs */}
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.04)', padding: '3px', borderRadius: '8px' }}>
          <button
            type="button"
            onClick={() => setActiveDesignTab('typography')}
            style={{
              flex: 1,
              padding: '0.35rem 0.4rem',
              borderRadius: '6px',
              border: 'none',
              background: activeDesignTab === 'typography' ? '#ffffff' : 'transparent',
              color: activeDesignTab === 'typography' ? '#4f46e5' : '#64748b',
              fontWeight: activeDesignTab === 'typography' ? 600 : 500,
              fontSize: '0.78rem',
              cursor: 'pointer',
              boxShadow: activeDesignTab === 'typography' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease'
            }}
            data-testid="tab-typography"
          >
            Tipografía
          </button>

          <button
            type="button"
            onClick={() => {
              setIsDesignMenuOpen(true);
              setActiveDesignTab('spacing');
            }}
            aria-label="Ajustes de Márgenes y Espaciado"
            style={{
              flex: 1,
              padding: '0.35rem 0.4rem',
              borderRadius: '6px',
              border: 'none',
              background: activeDesignTab === 'spacing' ? '#ffffff' : 'transparent',
              color: activeDesignTab === 'spacing' ? '#4f46e5' : '#64748b',
              fontWeight: activeDesignTab === 'spacing' ? 600 : 500,
              fontSize: '0.78rem',
              cursor: 'pointer',
              boxShadow: activeDesignTab === 'spacing' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease'
            }}
            data-testid="tab-spacing"
          >
            Espaciado
          </button>

          <button
            type="button"
            onClick={() => setActiveDesignTab('colors')}
            style={{
              flex: 1,
              padding: '0.35rem 0.4rem',
              borderRadius: '6px',
              border: 'none',
              background: activeDesignTab === 'colors' ? '#ffffff' : 'transparent',
              color: activeDesignTab === 'colors' ? '#4f46e5' : '#64748b',
              fontWeight: activeDesignTab === 'colors' ? 600 : 500,
              fontSize: '0.78rem',
              cursor: 'pointer',
              boxShadow: activeDesignTab === 'colors' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease'
            }}
            data-testid="tab-colors"
          >
            Colores
          </button>
        </div>

        {/* TAB 1: Typography Section */}
        <div style={{ display: activeDesignTab === 'typography' ? 'flex' : 'none', flexDirection: 'column', gap: '1rem' }}>
          {/* Font Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-color)' }}>
              Tipo de Letra (Fuente Universal)
            </label>
            <select
              value={currentFontFamily}
              onChange={(e) => updateLayout('fontFamily', e.target.value)}
              aria-label="Selector de Tipo de Letra"
              style={{
                width: '100%',
                padding: '0.45rem 0.6rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                background: '#ffffff',
                color: '#1e293b',
                cursor: 'pointer'
              }}
            >
              <option value="Poppins">Poppins (Moderna y Geométrica)</option>
              <option value="Inter">Inter (Estándar ATS y Legibilidad)</option>
              <option value="Roboto">Roboto (Clásica y Equilibrada)</option>
              <option value="Merriweather">Merriweather (Ejecutiva Serif)</option>
              <option value="JetBrains Mono">JetBrains Mono (Técnica y Código)</option>
            </select>
          </div>

          {/* Categorized Font Sizing */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(99, 102, 241, 0.04)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.12)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Tamaño por Categoría
            </div>

            {/* Titles Scale */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                <span style={{ fontWeight: 500 }}>Títulos (Encabezados)</span>
                <b style={{ color: '#4f46e5' }}>{titleScale.toFixed(2)}x</b>
              </div>
              <input 
                type="range" 
                min={0.80} 
                max={1.40} 
                step={0.05}
                value={titleScale} 
                onChange={(e) => updateLayout('titleScale', Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
                aria-label="Control de Tamaño de Títulos"
                data-testid="slider-title-scale"
              />
            </div>

            {/* Body Scale */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                <span style={{ fontWeight: 500 }}>Cuerpo (Descripciones)</span>
                <b style={{ color: '#4f46e5' }}>{bodyScale.toFixed(2)}x</b>
              </div>
              <input 
                type="range" 
                min={0.80} 
                max={1.30} 
                step={0.05}
                value={bodyScale} 
                onChange={(e) => updateLayout('bodyScale', Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
                aria-label="Control de Tamaño de Cuerpo de Texto"
                data-testid="slider-body-scale"
              />
            </div>

            {/* List Scale */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                <span style={{ fontWeight: 500 }}>Listas (Viñetas / Habilidades)</span>
                <b style={{ color: '#4f46e5' }}>{listScale.toFixed(2)}x</b>
              </div>
              <input 
                type="range" 
                min={0.80} 
                max={1.30} 
                step={0.05}
                value={listScale} 
                onChange={(e) => updateLayout('listScale', Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
                aria-label="Control de Tamaño de Listas"
                data-testid="slider-list-scale"
              />
            </div>
          </div>

          {/* Master Font Scale & Line Height */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Ajustes Generales
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                <span>Escala General (Multiplicador)</span>
                <b>{fontScale.toFixed(2)}x</b>
              </div>
              <input 
                type="range" 
                min={0.85} 
                max={1.25} 
                step={0.05}
                value={fontScale} 
                onChange={(e) => updateLayout('fontScale', Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
                aria-label="Control de Escala de Fuente"
                data-testid="slider-font-scale"
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                <span>Altura de Línea</span>
                <b>{lineHeight.toFixed(2)}x</b>
              </div>
              <input 
                type="range" 
                min={1.25} 
                max={1.85} 
                step={0.05}
                value={lineHeight} 
                onChange={(e) => updateLayout('lineHeight', Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
                aria-label="Control de Altura de Línea"
                data-testid="slider-line-height"
              />
            </div>
          </div>

          {/* Reset Typography Button */}
          <button
            type="button"
            data-testid="btn-reset-typography"
            aria-label="Restaurar Tipografía por Defecto"
            onClick={() => {
              updateLayout({
                fontScale: 1.0,
                titleScale: 1.0,
                bodyScale: 1.0,
                listScale: 1.0,
                lineHeight: 1.45
              });
            }}
            style={{
              padding: '0.45rem 0.6rem',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              color: '#64748b',
              fontSize: '0.78rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'background 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#f8fafc'}
          >
            <RotateCcw size={13} /> Reiniciar Tipografía
          </button>
        </div>

        {/* TAB 2: Spacing & Margins Section */}
        <div style={{ display: activeDesignTab === 'spacing' ? 'flex' : 'none', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--title-color, #111)', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '0.3rem' }}>
            Espaciado y Márgenes
          </div>

          {/* Page Padding */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
              <span>Margen de Página</span>
              <b>{pagePadding}px</b>
            </div>
            <input 
              type="range" 
              min={0} 
              max={60} 
              step={2}
              value={pagePadding} 
              onChange={(e) => updateLayout('pagePadding', Number(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
              aria-label="Control de Margen de Página"
            />
          </div>

          {/* Section Gap */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
              <span>Espacio entre Secciones</span>
              <b>{sectionGap}px</b>
            </div>
            <input 
              type="range" 
              min={0} 
              max={50} 
              step={2}
              value={sectionGap} 
              onChange={(e) => updateLayout('sectionGap', Number(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
              aria-label="Control de Espacio entre Secciones"
            />
          </div>

          {/* Item Gap */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
              <span>Espacio entre Elementos</span>
              <b>{itemGap}px</b>
            </div>
            <input 
              type="range" 
              min={0} 
              max={30} 
              step={1}
              value={itemGap} 
              onChange={(e) => updateLayout('itemGap', Number(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
              aria-label="Control de Espacio entre Elementos"
            />
          </div>

          {/* Left Column Width (2-Column Mode) */}
          {is2Col && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                <span>Ancho Columna Lateral</span>
                <b style={{ color: '#3874ff' }}>{leftColumnWidth}% / {100 - leftColumnWidth}%</b>
              </div>
              <input 
                type="range" 
                min={20} 
                max={55} 
                step={1}
                value={leftColumnWidth} 
                onChange={(e) => updateLayout('leftColumnWidth', Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
                aria-label="Control de Ancho de Columna Lateral"
                data-testid="slider-column-width"
              />
            </div>
          )}
        </div>

        {/* TAB 3: Color Picking Section */}
        <div style={{ display: activeDesignTab === 'colors' ? 'flex' : 'none', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--title-color, #111)', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '0.3rem' }}>
            Paleta de Colores
          </div>

          {is2Col ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <ColorPickerSwatch
                label="Fondo Columna Lateral"
                ariaLabel="Fondo Columna Lateral"
                value={cvData.layout?.leftBg || '#fafafa'}
                onChange={(val) => updateLayout('leftBg', val)}
                presets={['#ffffff', '#fafafa', '#f1f5f9', '#e2e8f0', '#1e293b', '#0f172a']}
              />

              <ColorPickerSwatch
                label="Fondo Columna Principal"
                ariaLabel="Fondo Columna Principal"
                value={cvData.layout?.rightBg || '#ffffff'}
                onChange={(val) => updateLayout('rightBg', val)}
                presets={['#ffffff', '#fcfcfc', '#f8fafc', '#f1f5f9', '#1e293b', '#0f172a']}
              />
            </div>
          ) : (
            <div 
              className="obsidian-callout" 
              style={{
                background: 'rgba(8, 109, 221, 0.1)',
                borderLeft: '4px solid rgba(8, 109, 221, 1)',
                borderRadius: '6px',
                padding: '0.65rem 0.8rem',
                fontSize: '0.8rem'
              }}
            >
              <div className="callout-title" style={{ display: 'flex', gap: '8px', fontWeight: 600, color: 'rgba(8, 109, 221, 1)', marginBottom: '4px', alignItems: 'center' }}>
                <Info size={15} /> Modo ATS Activo
              </div>
              <div className="callout-content" style={{ color: 'var(--text-color, #334155)', fontSize: '0.76rem', lineHeight: 1.45 }}>
                El modo ATS utiliza un fondo blanco puro (#ffffff) y acentos sobrios optimizados para lectores de escaneo automático. Cambia a Modo 2 Columnas para personalizar colores independientes.
              </div>
            </div>
          )}
        </div>
      </div>
      {/* =========================================================================
          Grouped Submenu 2: 'Acciones' Popover (Export JSON, Print)
          ========================================================================= */}
      <div 
        className="actions-popover no-print"
        style={{
          position: 'fixed',
          left: '4.75rem',
          top: '50%',
          transform: isActionsMenuOpen ? 'translateY(-50%) scale(1)' : 'translateY(-50%) scale(0.96)',
          background: 'var(--container-color, #ffffff)',
          borderRadius: '14px',
          padding: '1.25rem',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          width: '310px',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
          opacity: isActionsMenuOpen ? 1 : 0,
          pointerEvents: isActionsMenuOpen ? 'auto' : 'none',
          transition: 'opacity 0.2s ease, transform 0.2s ease'
        }}
        data-testid="actions-submenu"
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.08)', paddingBottom: '0.5rem' }}>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--title-color, #111)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderDown size={18} color="#3874ff" /> Acciones de Exportación
          </span>
          <button 
            type="button"
            onClick={() => setIsActionsMenuOpen(false)}
            aria-label="Cerrar panel de acciones"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: '4px', display: 'flex' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Action 1: Native Print / Clean PDF Export */}
        <button
          type="button"
          className="action-popover-item"
          onClick={handleGeneratePDF}
          disabled={loading}
          aria-label="Descargar / Imprimir PDF"
          title="Descargar / Imprimir PDF (Impresión A4 Limpia)"
          data-testid="btn-action-native-print"
        >
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: '#fff1f2',
            color: '#e11d48',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            {loading ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <FileDown size={20} />}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0f172a' }}>
              Descargar / Imprimir PDF
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '1px' }}>
              Documento A4 limpio y optimizado
            </div>
          </div>
        </button>

        {/* Action 2: Export JSON State */}
        <button
          type="button"
          className="action-popover-item"
          onClick={handleExportJSON}
          aria-label="Exportar Estado (.JSON)"
          title="Exportar Estado (.JSON)"
          data-testid="btn-action-export-json"
        >
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: '#eff6ff',
            color: '#3b82f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <i className='bx bx-export' style={{ fontSize: '20px' }}></i>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0f172a' }}>
              Exportar Estado (.JSON)
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '1px' }}>
              Copia de respaldo editable completa
            </div>
          </div>
        </button>
      </div>

      <AIExportModal isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} />
      <TranslationModal isOpen={isTranslationModalOpen} onClose={() => setIsTranslationModalOpen(false)} />
      <VersionManagerModal isOpen={isVersionModalOpen} onClose={() => setIsVersionModalOpen(false)} />
    </>
  );
};

export default ActionMenu;
