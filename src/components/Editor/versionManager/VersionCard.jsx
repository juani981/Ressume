import React, { useState, useMemo, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  Check,
  CheckCircle2,
  Copy,
  Edit3,
  Trash2,
  Calendar,
  Download,
  Eye,
  X,
  FileText,
} from 'lucide-react';
import { generateCleanPrintHTML } from '../../../services/print/cleanHtmlGenerator';

/**
 * Format relative timestamp in Spanish: "Hace X min", "Ayer", etc.
 * @param {string} dateString
 * @returns {string}
 */
const formatRelativeTime = (dateString) => {
  if (!dateString) return 'Fecha no disponible';
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  if (isNaN(diffInMs)) return 'Fecha no disponible';

  const diffInSec = Math.floor(diffInMs / 1000);
  if (diffInSec < 60) return 'Hace un momento';

  const diffInMin = Math.floor(diffInSec / 60);
  if (diffInMin < 60) {
    return `Hace ${diffInMin} ${diffInMin === 1 ? 'min' : 'mins'}`;
  }

  const diffInHours = Math.floor(diffInMin / 60);
  if (diffInHours < 24) {
    return `Hace ${diffInHours} ${diffInHours === 1 ? 'h' : 'h'}`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'Ayer';
  if (diffInDays < 7) return `Hace ${diffInDays} días`;

  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * VersionCard
 * Renders an individual CV version snapshot card in the Version Manager grid:
 * - Miniature visual thumbnail preview with centered A4 simulated sheet and realistic aspect ratio
 * - Layout badge (ATS 1-Col or 2-Col) with high contrast
 * - Emerald active badge with pulse dot indicator when isActive is true
 * - Page count pill
 * - High-resolution preview lightbox modal on explicit click
 * - Version title or inline rename input
 * - Relative time metadata row with exact timestamp tooltip
 * - Action buttons toolbar: Primary Cargar/Activa + 32x32px Secondary icon cluster (Ver, Duplicar, JSON, Eliminar)
 */
export const VersionCard = ({
  version,
  isActive = false,
  isEditing,
  renameText,
  renameInputRef,
  onStartRename,
  onCancelRename,
  onCommitRename,
  onChangeRenameText,
  onConfirmLoad,
  onDuplicate,
  onDownloadJSON,
  onConfirmDelete,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Generate complete, authentic standalone HTML for the version snapshot (Invariants 15 & 16)
  const previewHtml = useMemo(() => {
    if (!version?.cvData) return null;
    try {
      const rawHtml = generateCleanPrintHTML(version.cvData, 'es');
      const viewerStyle = `
        <style id="preview-fullscreen-enhancement">
          html {
            background-color: #0f172a !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow-y: auto !important;
          }
          body {
            background-color: #0f172a !important;
            margin: 0 !important;
            padding: 40px 16px 60px 16px !important;
            min-height: 100vh !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
          }
          #area-cv {
            margin: 0 auto 32px auto !important;
            box-shadow: 0 20px 45px rgba(0, 0, 0, 0.6) !important;
            border-radius: 4px !important;
            background-color: #ffffff !important;
          }
        </style>
      `;
      return rawHtml.includes('</head>')
        ? rawHtml.replace('</head>', `${viewerStyle}</head>`)
        : `${viewerStyle}${rawHtml}`;
    } catch (err) {
      console.warn('Error generating preview HTML:', err);
      return null;
    }
  }, [version?.cvData]);

  // Close fullscreen preview on Escape key press
  useEffect(() => {
    if (!isPreviewOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsPreviewOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPreviewOpen]);

  const isAts = Boolean(
    version.cvData?.layout?.isAtsMode || version.cvData?.layout?.type === '1-column'
  );

  const exactDate = version.createdAt
    ? new Date(version.createdAt).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Fecha no disponible';

  const relativeTime = formatRelativeTime(version.createdAt);

  const pageCount = version.cvData?.pages?.length || 1;
  const pageText = `${pageCount} ${pageCount === 1 ? 'pág' : 'págs'}`;

  return (
    <div
      key={version.id}
      data-testid={`version-card-${version.id}`}
      data-theme={theme}
      className={`version-card ${isActive ? 'version-card--active' : ''}`}
      onClick={() => {
        if (!isEditing && onConfirmLoad) onConfirmLoad(version);
      }}
      style={{
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        border: isActive ? '1.5px solid #10b981' : (isDark ? '1px solid #334155' : '1px solid #e2e8f0'),
        borderRadius: '12px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '310px',
        minHeight: '310px',
        maxHeight: '310px',
        boxShadow: isActive
          ? '0 4px 14px rgba(16, 185, 129, 0.12), 0 1px 3px rgba(0, 0, 0, 0.05)'
          : (isDark ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' : '0 2px 4px rgba(0, 0, 0, 0.04)'),
        transition: 'all 0.15s ease',
        flexShrink: 0,
        position: 'relative',
        cursor: isEditing ? 'default' : 'pointer',
      }}
      title={!isEditing ? 'Clic para usar como versión actual' : undefined}
    >
      {/* Visual Thumbnail Preview (Default click: Use as current version) */}
      <div
        className="version-thumbnail-container"
        style={{
          height: '190px',
          minHeight: '190px',
          maxHeight: '190px',
          flexShrink: 0,
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
          borderBottom: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
          cursor: isEditing ? 'default' : 'pointer',
          width: '100%',
          zIndex: 1,
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (!isEditing && onConfirmLoad) onConfirmLoad(version);
        }}
        title={!isEditing ? 'Clic para usar como versión actual' : undefined}
      >
        {version.thumbnail ? (
          <img
            src={version.thumbnail}
            alt={version.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'top center',
              display: 'block',
              backgroundColor: '#ffffff',
              zIndex: 1,
            }}
          />
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px',
              textAlign: 'center',
              height: '100%',
              width: '100%',
              backgroundColor: isDark ? '#0f172a' : '#f8fafc',
              zIndex: 1,
            }}
          >
            <FileText size={24} color={isDark ? '#475569' : '#94a3b8'} />
            <span style={{ color: isDark ? '#64748b' : '#94a3b8', fontSize: '0.75rem', fontWeight: 500, lineHeight: 1.2 }}>
              Sin vista previa
            </span>
          </div>
        )}

        {/* Top-Left: "Actual" emerald pill with pulse dot if isActive */}
        {isActive && (
          <div
            style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 8px',
              borderRadius: '9999px',
              fontSize: '0.7rem',
              fontWeight: 700,
              backgroundColor: '#ecfdf5',
              color: '#065f46',
              border: '1px solid #a7f3d0',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
              zIndex: 3,
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                boxShadow: '0 0 6px #10b981',
                display: 'inline-block',
              }}
            />
            Actual
          </div>
        )}

        {/* Top-Right: Layout Badge with High Contrast */}
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '0.7rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
            backgroundColor: isAts ? '#0284c7' : '#6d28d9',
            color: '#ffffff',
            border: `1px solid ${isAts ? '#0369a1' : '#5b21b6'}`,
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
            zIndex: 3,
          }}
        >
          {isAts ? 'ATS 1-Col' : '2-Col'}
        </div>

        {/* Bottom-Right: Page Count Pill */}
        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            padding: '2px 7px',
            borderRadius: '6px',
            fontSize: '0.68rem',
            fontWeight: 600,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            color: '#ffffff',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.15)',
            zIndex: 3,
          }}
        >
          {pageText}
        </div>
      </div>

      {/* High-Resolution Fullscreen Scrollable Preview (Zero controls, full screen scrollable document) */}
      {isPreviewOpen && typeof document !== 'undefined' && ReactDOM.createPortal(
        <div
          className="version-large-preview-overlay"
          data-testid="version-large-preview"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: '#0f172a',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Floating Minimal Close Button in Top-Right Corner */}
          <button
            type="button"
            data-testid="btn-close-large-preview"
            aria-label="Cerrar vista previa"
            onClick={() => setIsPreviewOpen(false)}
            style={{
              position: 'fixed',
              top: '16px',
              right: '24px',
              zIndex: 10001,
              background: 'rgba(15, 23, 42, 0.85)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: '50%',
              width: '42px',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
              transition: 'all 0.15s ease',
            }}
            title="Cerrar vista previa (Esc)"
          >
            <X size={20} />
          </button>

          {/* Fullscreen Scrollable Document View */}
          {previewHtml ? (
            <iframe
              data-testid="version-preview-iframe"
              title={`Vista previa de ${version.name}`}
              srcDoc={previewHtml}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                display: 'block',
                backgroundColor: '#0f172a',
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '40px 16px',
                boxSizing: 'border-box',
                cursor: 'zoom-out',
              }}
              onClick={() => setIsPreviewOpen(false)}
            >
              {version.thumbnail && (
                <img
                  src={version.thumbnail}
                  alt={`Vista previa de ${version.name}`}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    maxWidth: '794px',
                    width: '100%',
                    height: 'auto',
                    boxShadow: '0 20px 45px rgba(0, 0, 0, 0.5)',
                    backgroundColor: '#ffffff',
                    display: 'block',
                    borderRadius: '4px',
                  }}
                />
              )}
            </div>
          )}
        </div>,
        document.body
      )}

      {/* Card Body: Title and Metadata (Default click: Use as current version) */}
      <div
        onClick={() => {
          if (!isEditing && onConfirmLoad) onConfirmLoad(version);
        }}
        style={{
          padding: '0.65rem 0.85rem 0.25rem 0.85rem',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          position: 'relative',
          zIndex: 2,
          overflow: 'hidden',
          cursor: isEditing ? 'default' : 'pointer',
        }}
        title={!isEditing ? 'Clic para usar como versión actual' : undefined}
      >
        {/* Version Title or Inline Rename Input */}
        <div style={{ marginBottom: '0.25rem', minHeight: '26px', display: 'flex', alignItems: 'center' }}>
          {isEditing ? (
            <input
              ref={renameInputRef}
              data-testid="input-rename-version"
              type="text"
              value={renameText}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => onChangeRenameText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.stopPropagation();
                  onCancelRename();
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  onCommitRename(version.id);
                }
              }}
              onBlur={() => onCommitRename(version.id)}
              style={{
                width: '100%',
                padding: '2px 6px',
                fontSize: '0.88rem',
                fontWeight: 600,
                border: '1px solid #3b82f6',
                borderRadius: '4px',
                outline: 'none',
                backgroundColor: isDark ? '#0f172a' : '#eff6ff',
                color: isDark ? '#f8fafc' : '#0f172a',
              }}
            />
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                gap: '4px',
              }}
            >
              <h4
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  onStartRename(version);
                }}
                title="Doble clic para renombrar"
                style={{
                  margin: 0,
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: isDark ? '#f8fafc' : '#0f172a',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  cursor: 'pointer',
                }}
              >
                {version.name}
              </h4>
              <button
                type="button"
                data-testid="btn-rename-version"
                aria-label="Renombrar versión"
                title="Renombrar"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartRename(version);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: isDark ? '#64748b' : '#94a3b8',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Edit3 size={13} />
              </button>
            </div>
          )}
        </div>

        {/* Metadata row: Relative time with exact date in title + bullet dot + layout info */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.72rem',
            color: isDark ? '#94a3b8' : '#64748b',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          <span
            title={exactDate}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'help',
            }}
          >
            <Calendar size={12} />
            <span>{relativeTime}</span>
          </span>
          <span style={{ color: isDark ? '#475569' : '#cbd5e1' }}>•</span>
          <span>{isAts ? 'ATS 1-Columna' : '2 Columnas'}</span>
        </div>
      </div>

      {/* Action Toolbar: ALWAYS FIXED AT THE BOTTOM, ALWAYS VISIBLE, NEVER HIDDEN (zIndex: 10) */}
      <div
        className="version-card-actions"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '46px',
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          borderTop: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
          padding: '0 0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          zIndex: 10,
          boxShadow: isDark ? '0 -2px 6px rgba(0, 0, 0, 0.25)' : '0 -2px 6px rgba(0, 0, 0, 0.03)',
        }}
      >
        {/* Primary Button: Load / Active */}
        <button
          type="button"
          data-testid="btn-load-version"
          onClick={() => onConfirmLoad(version)}
          style={{
            flex: 1,
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            padding: '0 0.65rem',
            backgroundColor: isActive 
              ? (isDark ? 'rgba(16, 185, 129, 0.2)' : '#ecfdf5') 
              : (isDark ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff'),
            color: isActive 
              ? (isDark ? '#34d399' : '#059669') 
              : (isDark ? '#60a5fa' : '#2563eb'),
            border: `1px solid ${
              isActive 
                ? (isDark ? '#059669' : '#a7f3d0') 
                : (isDark ? '#2563eb' : '#bfdbfe')
            }`,
            borderRadius: '6px',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
          }}
        >
          {isActive ? <Check size={13} /> : <CheckCircle2 size={13} />}
          <span>{isActive ? 'Activa' : 'Cargar'}</span>
        </button>

        {/* Secondary Icon Cluster (30x30px buttons) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          {/* 1. btn-preview-version */}
          <button
            type="button"
            data-testid="btn-preview-version"
            aria-label="Previsualizar versión"
            title="Previsualizar versión a pantalla completa"
            disabled={!version.thumbnail && !version.cvData}
            onClick={(e) => {
              e.stopPropagation();
              setIsPreviewOpen(true);
            }}
            style={{
              width: '30px',
              height: '30px',
              minWidth: '30px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              backgroundColor: isDark ? '#0f172a' : '#f8fafc',
              color: (version.thumbnail || version.cvData) 
                ? (isDark ? '#cbd5e1' : '#334155') 
                : (isDark ? '#475569' : '#94a3b8'),
              border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
              cursor: (version.thumbnail || version.cvData) ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s ease',
            }}
          >
            <Eye size={14} />
          </button>

          {/* 2. btn-duplicate-version */}
          <button
            type="button"
            data-testid="btn-duplicate-version"
            aria-label="Duplicar versión"
            title="Duplicar"
            onClick={() => onDuplicate(version.id)}
            style={{
              width: '30px',
              height: '30px',
              minWidth: '30px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              backgroundColor: isDark ? '#0f172a' : '#f8fafc',
              color: isDark ? '#cbd5e1' : '#475569',
              border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Copy size={14} />
          </button>

          {/* 3. btn-download-version-json */}
          <button
            type="button"
            data-testid="btn-download-version-json"
            aria-label="Descargar esta versión como JSON"
            title="Descargar como JSON"
            onClick={() => onDownloadJSON(version)}
            style={{
              width: '30px',
              height: '30px',
              minWidth: '30px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              backgroundColor: isDark ? '#0f172a' : '#f8fafc',
              color: isDark ? '#cbd5e1' : '#475569',
              border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Download size={14} />
          </button>

          {/* 4. btn-delete-version */}
          <button
            type="button"
            data-testid="btn-delete-version"
            aria-label="Eliminar versión"
            title="Eliminar"
            onClick={() => onConfirmDelete(version)}
            style={{
              width: '30px',
              height: '30px',
              minWidth: '30px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fff1f2',
              color: isDark ? '#f87171' : '#e11d48',
              border: isDark ? '1px solid #b91c1c' : '1px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VersionCard;
