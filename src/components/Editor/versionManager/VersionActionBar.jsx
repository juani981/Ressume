import React from 'react';
import { Plus, FilePlus, Upload, Download } from 'lucide-react';

/**
 * VersionActionBar
 * Renders a compact, single-row high-density toolbar inside VersionManagerModal:
 * - Left/Center: Save current form (input + submit button)
 * - Right: Action buttons (Plantilla en blanco, Importar JSON, Descargar JSON)
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
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  return (
    <div
      className="version-action-bar"
      style={{
        padding: '0.75rem 1.25rem',
        backgroundColor: isDark ? '#1e293b' : '#f8fafc',
        borderBottom: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.85rem',
        flexWrap: 'wrap',
      }}
    >
      {/* Hidden File Input for JSON import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={onImportFile}
        style={{ display: 'none' }}
        data-testid="input-import-json-file"
      />

      {/* Left / Center: Save Current Version form */}
      <form
        onSubmit={onSaveCurrent}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          flex: '1 1 340px',
          maxWidth: '520px',
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
              padding: '0.45rem 0.75rem',
              fontSize: '0.85rem',
              border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
              borderRadius: '7px',
              backgroundColor: isDark ? '#0f172a' : '#ffffff',
              color: isDark ? '#f8fafc' : '#0f172a',
              outline: 'none',
              boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.04)',
              transition: 'border-color 0.15s ease',
            }}
          />
        </div>

        <button
          type="submit"
          data-testid="btn-save-version"
          disabled={isSaving}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '0.45rem 0.95rem',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            border: '1px solid #1d4ed8',
            borderRadius: '7px',
            fontWeight: 600,
            fontSize: '0.82rem',
            cursor: isSaving ? 'not-allowed' : 'pointer',
            opacity: isSaving ? 0.7 : 1,
            transition: 'background-color 0.15s ease',
            whiteSpace: 'nowrap',
          }}
        >
          <Plus size={15} />
          <span>{isSaving ? 'Guardando...' : 'Guardar Versión'}</span>
        </button>
      </form>

      {/* Right: Utilities group (Plantilla en blanco, Importar JSON, Descargar JSON) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          flexWrap: 'wrap',
          marginLeft: 'auto',
        }}
      >
        {/* Plantilla en blanco */}
        <button
          type="button"
          data-testid="btn-start-blank-cv"
          onClick={onStartBlank}
          title="Empezar un nuevo CV desde cero con datos placeholders"
          aria-label="Empezar CV en Blanco"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '0.45rem 0.8rem',
            backgroundColor: isDark ? '#0f172a' : '#ffffff',
            color: isDark ? '#a5b4fc' : '#4f46e5',
            border: isDark ? '1px solid #4338ca' : '1px solid #c7d2fe',
            borderRadius: '7px',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
          }}
        >
          <FilePlus size={14} color={isDark ? '#a5b4fc' : '#4f46e5'} />
          <span>Plantilla en blanco</span>
        </button>

        {/* Importar JSON */}
        <button
          type="button"
          data-testid="btn-import-json"
          onClick={onImportClick}
          title="Importar un archivo de CV en formato JSON"
          aria-label="Importar archivo JSON"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '0.45rem 0.8rem',
            backgroundColor: isDark ? '#0f172a' : '#ffffff',
            color: isDark ? '#f8fafc' : '#0f172a',
            border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
            borderRadius: '7px',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
          }}
        >
          <Upload size={14} color="#38bdf8" />
          <span>Importar JSON</span>
        </button>

        {/* Descargar JSON */}
        <button
          type="button"
          data-testid="btn-export-active-json"
          onClick={onDownloadActiveJSON}
          title="Descargar el estado actual del CV como archivo JSON"
          aria-label="Descargar CV actual como JSON"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '0.45rem 0.8rem',
            backgroundColor: isDark ? '#0f172a' : '#ffffff',
            color: isDark ? '#f8fafc' : '#0f172a',
            border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
            borderRadius: '7px',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
          }}
        >
          <Download size={14} color="#34d399" />
          <span>Descargar JSON</span>
        </button>
      </div>
    </div>
  );
};

export default VersionActionBar;
