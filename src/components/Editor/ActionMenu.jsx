import React, { useState } from 'react';
import { useCV } from '../../context/CVContext';

const ActionMenu = () => {
  const { cvData, updateLayout } = useCV();
  const [loading, setLoading] = useState(false);

  const toggleTheme = () => {
    document.body.classList.toggle('dark-theme');
  };

  const handleGeneratePDF = async () => {
    setLoading(true);
    try {
      const response = await fetch('/.netlify/functions/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: window.location.href,
          cv_state: cvData
        })
      });

      if (!response.ok) throw new Error('PDF generation failed');

      const data = await response.json();
      
      // Decode base64 to Blob
      const byteCharacters = atob(data.pdfBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      // Create object URL and download
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `CV-${cvData.profile.name.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);

    } catch (err) {
      console.error(err);
      alert('Error generating PDF.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cvData, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = "cv-state.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="l-navbar" style={{ position: 'fixed', left: '1rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--container-color)', padding: '1rem', borderRadius: '8px', boxShadow: '0 0 8px rgba(0,0,0,0.1)', zIndex: 100 }}>
      <button onClick={toggleTheme} title="Cambiar Tema" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: 'var(--title-color)' }}>
        <i className='bx bx-moon'></i>
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
  );
};

export default ActionMenu;
