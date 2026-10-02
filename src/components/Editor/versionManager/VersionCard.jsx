import React, { useState } from 'react';
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
}) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

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
      className={`version-card ${isActive ? 'version-card--active' : ''}`}
      style={{
        backgroundColor: '#ffffff',
        border: isActive ? '1.5px solid #10b981' : '1px solid #e2e8f0',
        borderRadius: '12px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '310px',
        minHeight: '310px',
        maxHeight: '310px',
        boxShadow: isActive
          ? '0 4px 14px rgba(16, 185, 129, 0.12), 0 1px 3px rgba(0, 0, 0, 0.05)'
          : '0 2px 4px rgba(0, 0, 0, 0.04)',
        transition: 'all 0.15s ease',
        flexShrink: 0,
        position: 'relative',
      }}
    >
      {/* Visual Thumbnail Preview (100% of container, zero black bars, lowest z-index: 1) */}
      <div
        className="version-thumbnail-container"
        style={{
          height: '190px',
          minHeight: '190px',
          maxHeight: '190px',
          flexShrink: 0,
          backgroundColor: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
          borderBottom: '1px solid #e2e8f0',
          cursor: version.thumbnail ? 'pointer' : 'default',
          width: '100%',
          zIndex: 1,
        }}
        onClick={() => {
          if (version.thumbnail) setIsPreviewOpen(true);
        }}
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
              backgroundColor: '#f8fafc',
              zIndex: 1,
            }}
          >
            <FileText size={24} color="#94a3b8" />
            <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 500, lineHeight: 1.2 }}>
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

      {/* High-Resolution Preview Lightbox Modal (Triggered explicitly by preview button or thumbnail click) */}
      {isPreviewOpen && version.thumbnail && typeof document !== 'undefined' && ReactDOM.createPortal(
        <div
          className="version-large-preview-overlay"
          data-testid="version-large-preview"
          onClick={() => setIsPreviewOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            cursor: 'zoom-out',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              maxWidth: '92vw',
              maxHeight: '94vh',
              cursor: 'default',
            }}
          >
            {/* Header info badge with Close Button */}
            <div
              style={{
                marginBottom: '10px',
                padding: '6px 16px',
                backgroundColor: '#ffffff',
                borderRadius: '30px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                {version.name}
              </span>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  backgroundColor: isAts ? '#0284c7' : '#6d28d9',
                  color: '#ffffff',
                  border: `1px solid ${isAts ? '#0369a1' : '#5b21b6'}`,
                }}
              >
                {isAts ? 'ATS 1-Col' : '2-Col'}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {exactDate}
              </span>
              <button
                type="button"
                data-testid="btn-close-large-preview"
                aria-label="Cerrar vista previa"
                onClick={() => setIsPreviewOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748b',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  marginLeft: '4px',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* High-Resolution Content Preview Image */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                maxHeight: '82vh',
                maxWidth: '88vw',
              }}
            >
              <img
                src={version.thumbnail}
                alt={`Vista previa ampliada de ${version.name}`}
                style={{
                  maxHeight: '82vh',
                  maxWidth: '88vw',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Card Body: Title and Metadata */}
      <div
        style={{
          padding: '0.65rem 0.85rem 0.25rem 0.85rem',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          backgroundColor: '#ffffff',
          position: 'relative',
          zIndex: 2,
          overflow: 'hidden',
        }}
      >
        {/* Version Title or Inline Rename Input */}
        <div style={{ marginBottom: '0.25rem', minHeight: '26px', display: 'flex', alignItems: 'center' }}>
          {isEditing ? (
            <input
              ref={renameInputRef}
              data-testid="input-rename-version"
              type="text"
              value={renameText}
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
                backgroundColor: '#eff6ff',
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
                onDoubleClick={() => onStartRename(version)}
                title="Doble clic para renombrar"
                style={{
                  margin: 0,
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#0f172a',
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
                onClick={() => onStartRename(version)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
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
            color: '#64748b',
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
          <span style={{ color: '#cbd5e1' }}>•</span>
          <span>{isAts ? 'ATS 1-Columna' : '2 Columnas'}</span>
        </div>
      </div>

      {/* Action Toolbar: ALWAYS FIXED AT THE BOTTOM, ALWAYS VISIBLE, NEVER HIDDEN (zIndex: 10) */}
      <div
        className="version-card-actions"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '46px',
          backgroundColor: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          padding: '0 0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          zIndex: 10,
          boxShadow: '0 -2px 6px rgba(0, 0, 0, 0.03)',
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
            backgroundColor: isActive ? '#ecfdf5' : '#eff6ff',
            color: isActive ? '#059669' : '#2563eb',
            border: `1px solid ${isActive ? '#a7f3d0' : '#bfdbfe'}`,
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
            title="Previsualizar versión"
            disabled={!version.thumbnail}
            onClick={() => setIsPreviewOpen(true)}
            style={{
              width: '30px',
              height: '30px',
              minWidth: '30px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              backgroundColor: '#f8fafc',
              color: version.thumbnail ? '#334155' : '#94a3b8',
              border: '1px solid #cbd5e1',
              cursor: version.thumbnail ? 'pointer' : 'not-allowed',
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
              backgroundColor: '#f8fafc',
              color: '#475569',
              border: '1px solid #cbd5e1',
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
              backgroundColor: '#f8fafc',
              color: '#475569',
              border: '1px solid #cbd5e1',
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
              backgroundColor: '#fff1f2',
              color: '#e11d48',
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
