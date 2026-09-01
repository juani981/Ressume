import React, { useState } from 'react';
import { useCV } from '../../context/CVContext';
import AIExportModal from './AIExportModal';
import TranslationModal from './TranslationModal';

const ActionMenu = () => {
  const { cvData, updateLayout, activeLanguage } = useCV();
  const [loading, setLoading] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isTranslationModalOpen, setIsTranslationModalOpen] = useState(false);

  const handleGeneratePDF = () => {
    // Native high-fidelity browser PDF generation leveraging @media print CSS
    window.print();
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
        {/* 1. Language Translation & Slots Button */}
        <div className="action-menu-btn-wrap">
          <button 
            type="button"
            className="action-menu-btn"
            onClick={() => setIsTranslationModalOpen(true)} 
            style={{ color: '#10b981', position: 'relative' }}
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

        {/* 2. AI Prompts Hub & ATS Scorecard Button */}
        <div className="action-menu-btn-wrap">
          <button 
            type="button"
            className="action-menu-btn"
            onClick={() => setIsAIModalOpen(true)} 
            style={{ color: '#3874ff' }}
          >
            <i className='bx bx-bot'></i>
          </button>
          <span className="action-menu-tooltip">
            Hub de Prompts IA & Scorecard ATS
          </span>
        </div>

        {/* 3. Export JSON Button */}
        <div className="action-menu-btn-wrap">
          <button 
            type="button"
            className="action-menu-btn"
            onClick={handleExportJSON} 
            style={{ color: 'var(--title-color, #333)' }}
          >
            <i className='bx bx-export'></i>
          </button>
          <span className="action-menu-tooltip">
            Exportar Estado (.JSON)
          </span>
        </div>

        {/* 4. Native PDF Export Button */}
        <div className="action-menu-btn-wrap">
          <button 
            type="button"
            className="action-menu-btn"
            onClick={handleGeneratePDF} 
            disabled={loading} 
            style={{ color: '#e11d48' }}
          >
            {loading ? <i className='bx bx-loader-alt bx-spin'></i> : <i className='bx bxs-file-pdf'></i>}
          </button>
          <span className="action-menu-tooltip">
            Generar PDF Nativo (A4 Imprimible)
          </span>
        </div>
        
        <hr style={{ border: 'none', borderTop: '1px solid rgba(0, 0, 0, 0.08)', margin: '0.2rem 0' }} />
        
        {/* 5. Layout Toggle: 1-Column vs 2-Column */}
        <div className="action-menu-btn-wrap">
          <button 
            type="button"
            className="action-menu-btn"
            onClick={() => updateLayout('type', is2Col ? '1-column' : '2-column')} 
            style={{ color: is2Col ? '#6366f1' : '#059669' }}
          >
            <i className={is2Col ? 'bx bx-layout' : 'bx bx-menu'}></i>
          </button>
          <span className="action-menu-tooltip">
            {is2Col ? 'Cambiar a 1 Columna (Lineal ATS)' : 'Cambiar a 2 Columnas (Visual)'}
          </span>
        </div>

        {/* 6. Color Pickers for 2-Column mode */}
        {is2Col && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', marginTop: '0.2rem' }}>
            <div className="action-menu-btn-wrap">
              <input 
                type="color" 
                value={cvData.layout?.leftBg || '#fafafa'}
                onChange={(e) => updateLayout('leftBg', e.target.value)}
                style={{ width: '24px', height: '24px', padding: '0', border: 'none', borderRadius: '50%', cursor: 'pointer' }}
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
              />
              <span className="action-menu-tooltip">
                Fondo Columna Principal
              </span>
            </div>
          </div>
        )}
      </div>

      <AIExportModal isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} />
      <TranslationModal isOpen={isTranslationModalOpen} onClose={() => setIsTranslationModalOpen(false)} />
    </>
  );
};

export default ActionMenu;
