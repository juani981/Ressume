import React, { useState } from 'react';
import { useCV } from '../../context/CVContext';
import AIExportModal from './AIExportModal';
import TranslationModal from './TranslationModal';

const ActionMenu = () => {
  const { cvData, updateLayout, activeLanguage } = useCV();
  const [loading, setLoading] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isTranslationModalOpen, setIsTranslationModalOpen] = useState(false);

  const toggleTheme = () => {
    document.body.classList.toggle('dark-theme');
  };

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

  return (
    <>
      <div className="l-navbar" style={{ position: 'fixed', left: '1rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--container-color)', padding: '1rem', borderRadius: '8px', boxShadow: '0 0 8px rgba(0,0,0,0.1)', zIndex: 100 }}>
        <button onClick={toggleTheme} title="Cambiar Tema" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: 'var(--title-color)' }}>
          <i className='bx bx-moon'></i>
        </button>
        <button onClick={() => setIsTranslationModalOpen(true)} title={`Traducción IA & Slots de Idioma (Activo: ${activeLanguage.toUpperCase()})`} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#10b981', position: 'relative' }}>
          <i className='bx bx-globe'></i>
          <span style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: '#10b981', color: 'white', fontSize: '9px', fontWeight: 'bold', padding: '1px 3px', borderRadius: '4px' }}>
            {activeLanguage.toUpperCase()}
          </span>
        </button>
        <button onClick={() => setIsAIModalOpen(true)} title="Hub de Prompts de IA & Abstracción ATS" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#3874ff' }}>
          <i className='bx bx-bot'></i>
        </button>
        <button onClick={handleExportJSON} title="Exportar JSON" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: 'var(--title-color)' }}>
          <i className='bx bx-export'></i>
        </button>
        <button onClick={handleGeneratePDF} disabled={loading} title="Generar PDF" style={{ background: 'none', border: 'none', cursor: loading ? 'wait' : 'pointer', fontSize: '1.5rem', color: 'var(--title-color)' }}>
          {loading ? <i className='bx bx-loader-alt bx-spin'></i> : <i className='bx bxs-file-pdf'></i>}
        </button>
        
        <hr style={{ border: 'none', borderTop: '1px solid var(--text-color-light)', margin: '0' }} />
        
        <button 
          onClick={() => updateLayout('type', cvData.layout?.type === '2-column' ? '1-column' : '2-column')} 
          title={`Cambiar a ${cvData.layout?.type === '2-column' ? '1 Columna' : '2 Columnas'}`} 
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: 'var(--title-color)' }}
        >
          <i className={cvData.layout?.type === '2-column' ? 'bx bx-layout' : 'bx bx-menu'}></i>
        </button>

        {cvData.layout?.type === '2-column' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'center' }}>
            <input 
              type="color" 
              title="Color Columna Izquierda"
              value={cvData.layout?.leftBg || '#fafafa'}
              onChange={(e) => updateLayout('leftBg', e.target.value)}
              style={{ width: '24px', height: '24px', padding: '0', border: 'none', cursor: 'pointer' }}
            />
            <input 
              type="color" 
              title="Color Columna Derecha"
              value={cvData.layout?.rightBg || '#f0efef'}
              onChange={(e) => updateLayout('rightBg', e.target.value)}
              style={{ width: '24px', height: '24px', padding: '0', border: 'none', cursor: 'pointer' }}
            />
          </div>
        )}
      </div>

      <AIExportModal isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} />
      <TranslationModal isOpen={isTranslationModalOpen} onClose={() => setIsTranslationModalOpen(false)} />
    </>
  );
};

export default ActionMenu;


