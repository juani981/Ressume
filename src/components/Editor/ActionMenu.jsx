import React, { useState } from 'react';
import { useCV } from '../../context/CVContext';
import AIExportModal from './AIExportModal';
import TranslationModal from './TranslationModal';
import { executeCleanPrint } from '../../utils/staticHtmlPdfEngine';
import { 
  Globe, 
  Bot, 
  FileJson, 
  FileDown, 
  Layout, 
  Columns, 
  SlidersHorizontal,
  Palette,
  Type,
  X,
  Undo2,
  Redo2,
  RotateCcw
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
    restoreContactSection 
  } = useCV();

  const [loading, setLoading] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isTranslationModalOpen, setIsTranslationModalOpen] = useState(false);
  const [isSpacingMenuOpen, setIsSpacingMenuOpen] = useState(false);
  const [isDesignMenuOpen, setIsDesignMenuOpen] = useState(false);

  const handleGeneratePDF = () => {
    setLoading(true);
    try {
      executeCleanPrint(cvData);
    } catch (e) {
      console.warn('executeCleanPrint fallback', e);
      window.print();
    } finally {
      setLoading(false);
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

  const is2Col = cvData.layout?.type === '2-column';
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
      <div 
        className="l-navbar no-print" 
        style={{ 
          position: 'fixed', 
          left: '1.25rem', 
          top: '50%', 
          transform: 'translateY(-50%)', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '0.65rem', 
          background: 'var(--container-color, #ffffff)', 
          padding: '0.75rem 0.6rem', 
          borderRadius: '12px', 
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)', 
          border: '1px solid rgba(0, 0, 0, 0.06)',
          zIndex: 100 
        }}
      >
        {/* 1. Undo Button */}
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

        {/* 2. Redo Button */}
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

        {/* 3. Reset / Restore Default CV Button */}
        <div className="action-menu-btn-wrap">
          <button 
            type="button"
            className="action-menu-btn"
            onClick={() => {
              if (window.confirm('¿Restablecer el CV con los datos y contacto originales de Juan Ignacio? Puedes deshacer con Ctrl+Z.')) {
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
            Restablecer CV original (Juan Ignacio)
          </span>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(0, 0, 0, 0.08)', margin: '0.1rem 0' }} />

        {/* 4. Language Translation & Slots Button */}
        <div className="action-menu-btn-wrap">
          <button 
            type="button"
            className="action-menu-btn"
            onClick={() => setIsTranslationModalOpen(true)} 
            style={{ color: '#10b981', position: 'relative' }}
            aria-label={`Gestor de Idiomas (Slot Activo: ${activeLanguage.toUpperCase()})`}
            title={`Gestor de Idiomas (Slot Activo: ${activeLanguage.toUpperCase()})`}
          >
            <i className='bx bx-globe'></i>
            <span style={{ 
              position: 'absolute', 
              bottom: '-2px', 
              right: '-2px', 
              background: '#10b981', 
              color: 'white', 
              fontSize: '8px', 
              fontWeight: '700', 
              padding: '1px 3px', 
              borderRadius: '4px' 
            }}>
              {activeLanguage.toUpperCase()}
            </span>
          </button>
          <span className="action-menu-tooltip">
            Gestor de Idiomas (Slot Activo: {activeLanguage.toUpperCase()})
          </span>
        </div>

        {/* 5. Design & Typography Popover Button */}
        <div className="action-menu-btn-wrap">
          <button 
            type="button"
            className="action-menu-btn"
            onClick={() => {
              setIsDesignMenuOpen(prev => !prev);
              setIsSpacingMenuOpen(false);
            }} 
            style={{ color: isDesignMenuOpen ? '#3874ff' : '#6366f1' }}
            aria-label="Ajustes de Diseño y Tipografía"
            title="Ajustes de Diseño y Tipografía"
          >
            <Palette size={20} />
          </button>
          <span className="action-menu-tooltip">
            Diseño y Tipografía
          </span>
        </div>

        {/* 6. Spacing Controls Button */}
        <div className="action-menu-btn-wrap">
          <button 
            type="button"
            className="action-menu-btn"
            onClick={() => {
              setIsSpacingMenuOpen(prev => !prev);
              setIsDesignMenuOpen(false);
            }} 
            style={{ color: isSpacingMenuOpen ? '#3874ff' : '#64748b' }}
            aria-label="Ajustes de Márgenes y Espaciado"
            title="Ajustes de Márgenes y Espaciado"
          >
            <SlidersHorizontal size={20} />
          </button>
          <span className="action-menu-tooltip">
            Ajustes de Márgenes y Espaciado
          </span>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(0, 0, 0, 0.08)', margin: '0.1rem 0' }} />

        {/* 7. AI Prompts Hub & ATS Scorecard Button */}
        <div className="action-menu-btn-wrap">
          <button 
            type="button"
            className="action-menu-btn"
            onClick={() => setIsAIModalOpen(true)} 
            style={{ color: '#3874ff' }}
            aria-label="Hub de Prompts IA & Scorecard ATS"
            title="Hub de Prompts IA & Scorecard ATS"
          >
            <i className='bx bx-bot'></i>
          </button>
          <span className="action-menu-tooltip">
            Hub de Prompts IA & Scorecard ATS
          </span>
        </div>

        {/* 8. Export JSON Button */}
        <div className="action-menu-btn-wrap">
          <button 
            type="button"
            className="action-menu-btn"
            onClick={handleExportJSON} 
            style={{ color: 'var(--title-color, #333)' }}
            aria-label="Exportar Estado (.JSON)"
            title="Exportar Estado (.JSON)"
          >
            <i className='bx bx-export'></i>
          </button>
          <span className="action-menu-tooltip">
            Exportar Estado (.JSON)
          </span>
        </div>

        {/* 9. Native PDF Export Button */}
        <div className="action-menu-btn-wrap">
          <button 
            type="button"
            className="action-menu-btn"
            onClick={handleGeneratePDF} 
            disabled={loading} 
            style={{ color: '#e11d48' }}
            aria-label="Generar PDF Nativo (A4 Imprimible)"
            title="Generar PDF Nativo (A4 Imprimible)"
          >
            {loading ? <i className='bx bx-loader-alt bx-spin'></i> : <i className='bx bxs-file-pdf'></i>}
          </button>
          <span className="action-menu-tooltip">
            Generar PDF Nativo (A4 Imprimible)
          </span>
        </div>

        {/* 10. Layout Toggle: 1-Column vs 2-Column */}
        <div className="action-menu-btn-wrap">
          <button 
            type="button"
            className="action-menu-btn"
            onClick={() => updateLayout('type', is2Col ? '1-column' : '2-column')} 
            style={{ color: is2Col ? '#6366f1' : '#059669' }}
            aria-label={is2Col ? 'Cambiar a 1 Columna (Lineal ATS)' : 'Cambiar a 2 Columnas (Visual)'}
            title={is2Col ? 'Cambiar a 1 Columna (Lineal ATS)' : 'Cambiar a 2 Columnas (Visual)'}
          >
            <i className={is2Col ? 'bx bx-layout' : 'bx bx-menu'}></i>
          </button>
          <span className="action-menu-tooltip">
            {is2Col ? 'Cambiar a 1 Columna (Lineal ATS)' : 'Cambiar a 2 Columnas (Visual)'}
          </span>
        </div>

        {/* Color Pickers for 2-Column mode in toolbar */}
        {is2Col && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', marginTop: '0.2rem' }}>
            <div className="action-menu-btn-wrap">
              <input 
                type="color" 
                value={cvData.layout?.leftBg || '#fafafa'}
                onChange={(e) => updateLayout('leftBg', e.target.value)}
                style={{ width: '24px', height: '24px', padding: '0', border: 'none', borderRadius: '50%', cursor: 'pointer' }}
                aria-label="Fondo Columna Lateral"
                title="Fondo Columna Lateral"
              />
              <span className="action-menu-tooltip">
                Fondo Columna Lateral
              </span>
            </div>

            <div className="action-menu-btn-wrap">
              <input 
                type="color" 
                value={cvData.layout?.rightBg || '#f0efef'}
                onChange={(e) => updateLayout('rightBg', e.target.value)}
                style={{ width: '24px', height: '24px', padding: '0', border: 'none', borderRadius: '50%', cursor: 'pointer' }}
                aria-label="Fondo Columna Principal"
                title="Fondo Columna Principal"
              />
              <span className="action-menu-tooltip">
                Fondo Columna Principal
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Design & Typography Popover */}
      {isDesignMenuOpen && (
        <div 
          className="design-popover no-print"
          style={{
            position: 'fixed',
            left: '4.75rem',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'var(--container-color, #ffffff)',
            borderRadius: '12px',
            padding: '1.2rem',
            boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
            border: '1px solid rgba(0,0,0,0.08)',
            zIndex: 1000,
            width: '290px',
            maxHeight: '90vh',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '0.4rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--title-color, #111)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Palette size={16} color="#6366f1" /> Diseño y Tipografía
            </span>
            <button 
              onClick={() => setIsDesignMenuOpen(false)}
              aria-label="Cerrar panel de diseño"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Font Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.35rem', color: 'var(--text-color)' }}>
              Tipo de Letra (Fuente)
            </label>
            <select
              value={currentFontFamily}
              onChange={(e) => updateLayout('fontFamily', e.target.value)}
              aria-label="Selector de Tipo de Letra"
              style={{
                width: '100%',
                padding: '0.4rem 0.6rem',
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

          {/* Categorized Global Font Sizing */}
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

          {/* General Scale & Line Height */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Ajustes Generales
            </div>

            {/* Master Font Scale Control */}
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

            {/* Line Height Control */}
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
              padding: '0.4rem 0.6rem',
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
            <RotateCcw size={13} /> Restablecer Tipografía
          </button>
        </div>
      )}

      {/* Spacing Controls Popover */}
      {isSpacingMenuOpen && (
        <div 
          className="spacing-popover no-print"
          style={{
            position: 'fixed',
            left: '4.75rem',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'var(--container-color, #ffffff)',
            borderRadius: '12px',
            padding: '1.2rem',
            boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
            border: '1px solid rgba(0,0,0,0.08)',
            zIndex: 1000,
            width: '240px',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '0.4rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--title-color, #111)' }}>
              Espaciado y Márgenes
            </span>
            <button 
              onClick={() => setIsSpacingMenuOpen(false)}
              aria-label="Cerrar panel de espaciado"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Page Padding Control */}
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

          {/* Section Gap Control */}
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

          {/* Item Gap Control */}
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

          {/* Left Column Width Control (2-Column Mode) */}
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
      )}

      <AIExportModal isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} />
      <TranslationModal isOpen={isTranslationModalOpen} onClose={() => setIsTranslationModalOpen(false)} />
    </>
  );
};

export default ActionMenu;
