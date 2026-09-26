import React from 'react';
import { Plus, Layers, FilePlus, Upload, Download } from 'lucide-react';

/**
 * VersionActionBar
 * Renders the top action toolbar inside VersionManagerModal:
 * - Save Current Version form input and submit button
 * - Start Blank CV button
 * - Import JSON button (with hidden file input)
 * - Download Current CV as JSON button
 */
export const VersionActionBar = ({
  newVersionName,
  setNewVersionName,
  isSaving,
  onSaveCurrent,
  onStartBlank,
  onImportClick,
  fileInputRef,
  onImportFile,
  onDownloadActiveJSON,
}) => {
  return (
    <div
      style={{
        padding: '1rem 1.5rem',
        backgroundColor: '#f8fafc',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      {/* Row 1: Save current version form */}
      <form
        onSubmit={onSaveCurrent}
        style={{
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            data-testid="input-new-version-name"
            placeholder="Nombre de la nueva versión (ej: CV Tech Lead 2026)"
            value={newVersionName}
            onChange={(e) => setNewVersionName(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 0.85rem',
              fontSize: '0.9rem',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              outline: 'none',
              boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.04)',
            }}
          />
        </div>

        <button
          type="submit"
          data-testid="btn-save-version"
          disabled={isSaving}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1.25rem',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '0.88rem',
            cursor: isSaving ? 'not-allowed' : 'pointer',
            opacity: isSaving ? 0.7 : 1,
            transition: 'background-color 0.15s ease',
            whiteSpace: 'nowrap',
          }}
        >
          <Plus size={16} />
          {isSaving ? 'Guardando...' : 'Guardar Versión Actual'}
        </button>
      </form>

      {/* Row 2: JSON Backup & Transfer Actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '0.5rem',
          borderTop: '1px dashed #e2e8f0',
          gap: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Layers size={14} color="#64748b" />
          <span>Plantillas, respaldo e importación</span>
        </span>

        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={onImportFile}
            style={{ display: 'none' }}
            data-testid="input-import-json-file"
          />

          {/* Botón Empezar CV en Blanco */}
          <button
            type="button"
            data-testid="btn-start-blank-cv"
            onClick={onStartBlank}
            title="Empezar un nuevo CV desde cero con datos placeholders"
            aria-label="Empezar CV en Blanco"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.45rem 0.9rem',
              backgroundColor: '#ffffff',
              color: '#4f46e5',
              border: '1px solid #c7d2fe',
              borderRadius: '7px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              transition: 'all 0.15s ease',
            }}
          >
            <FilePlus size={14} color="#4f46e5" />
            <span>Empezar CV en Blanco</span>
          </button>

          {/* Botón Importar JSON */}
          <button
            type="button"
            data-testid="btn-import-json"
            onClick={onImportClick}
            title="Importar un archivo de CV en formato JSON"
            aria-label="Importar archivo JSON"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.45rem 0.9rem',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              border: '1px solid #cbd5e1',
              borderRadius: '7px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              transition: 'all 0.15s ease',
            }}
          >
            <Upload size={14} color="#2563eb" />
            <span>Importar JSON</span>
          </button>

          {/* Botón Descargar JSON Actual */}
          <button
            type="button"
            data-testid="btn-export-active-json"
            onClick={onDownloadActiveJSON}
            title="Descargar el estado actual del CV como archivo JSON"
            aria-label="Descargar CV actual como JSON"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.45rem 0.9rem',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              border: '1px solid #cbd5e1',
              borderRadius: '7px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              transition: 'all 0.15s ease',
            }}
          >
            <Download size={14} color="#10b981" />
            <span>Descargar como JSON</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VersionActionBar;
