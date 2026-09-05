// Snippet for src/components/Editor/ActionMenu.jsx

// 1. Add import:
import { generateAndDownloadPdf } from '../../utils/reactPdfEngine';

// 2. Add showToast to useCV() destructuring:
const { 
  cvData, 
  updateLayout, 
  activeLanguage, 
  undo, 
  redo, 
  canUndo, 
  canRedo, 
  resetToDefault,
  restoreContactSection,
  showToast 
} = useCV();

// 3. Add local loading state:
const [vectorPdfLoading, setVectorPdfLoading] = useState(false);

// 4. Add handler:
const handleDownloadVectorPDF = async () => {
  if (vectorPdfLoading) return;
  setVectorPdfLoading(true);
  try {
    await generateAndDownloadPdf(cvData, activeLanguage);
    showToast(
      activeLanguage === 'en' ? 'PDF generated successfully' : '¡PDF vectorial descargado con éxito!',
      'success'
    );
  } catch (e) {
    console.error('Error generating vector PDF:', e);
    showToast(
      activeLanguage === 'en' ? 'Error generating PDF. Please try again.' : 'Error al generar PDF. Intente nuevamente.',
      'warning'
    );
  } finally {
    setVectorPdfLoading(false);
  }
};

// 5. In JSX, render vector PDF button right after native print button (around line 285):
{/* 9b. Vector PDF Export Button (@react-pdf/renderer) */}
<div className="action-menu-btn-wrap">
  <button 
    type="button"
    className="action-menu-btn"
    onClick={handleDownloadVectorPDF} 
    disabled={vectorPdfLoading} 
    style={{ color: '#059669', opacity: vectorPdfLoading ? 0.7 : 1 }}
    aria-label={activeLanguage === 'en' ? 'Download Vector PDF' : 'Descargar PDF Vectorial'}
    title={activeLanguage === 'en' ? 'Download Vector PDF (@react-pdf)' : 'Descargar PDF Vectorial (@react-pdf)'}
  >
    {vectorPdfLoading ? <i className='bx bx-loader-alt bx-spin'></i> : <FileDown size={20} />}
  </button>
  <span className="action-menu-tooltip">
    {activeLanguage === 'en' ? 'Descargar PDF Vectorial' : 'Descargar PDF Vectorial'}
  </span>
</div>
