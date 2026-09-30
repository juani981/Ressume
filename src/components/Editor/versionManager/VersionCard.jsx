import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import {
  CheckCircle2,
  Copy,
  Edit3,
  Trash2,
  Calendar,
  Download,
  Eye,
  X,
} from 'lucide-react';

/**
 * VersionCard
 * Renders an individual CV version snapshot card in the Version Manager grid:
 * - Miniature visual thumbnail preview with fixed height (never shrinks)
 * - ATS / 2-Col layout badge
 * - High-resolution preview lightbox modal on explicit click
 * - Version title or inline rename input
 * - Created date metadata
 * - Action buttons toolbar: Cargar, Previsualizar, Duplicar, Descargar JSON, Eliminar (always visible)
 */
export const VersionCard = ({
  version,
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

  const formattedDate = version.createdAt
    ? new Date(version.createdAt).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Fecha no disponible';

  return (
    <div
      key={version.id}
      className="version-card"
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        flexShrink: 0,
        position: 'relative',
      }}
    >
      {/* Miniature Visual Thumbnail Preview (Fixed size, never shrinks) */}
      <div
        className="version-thumbnail-container"
        style={{
          height: '190px',
          minHeight: '190px',
          maxHeight: '190px',
          flexShrink: 0,
          backgroundColor: '#f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
          borderBottom: '1px solid #e2e8f0',
          cursor: version.thumbnail ? 'pointer' : 'default',
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
              objectFit: 'contain',
              display: 'block',
            }}
          />
        ) : (
          <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Sin vista previa</div>
        )}

        {/* Layout Badge */}
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
            backgroundColor: isAts ? '#e0f2fe' : '#ede9fe',
            color: isAts ? '#0369a1' : '#6b21a8',
            border: `1px solid ${isAts ? '#bae6fd' : '#ddd6fe'}`,
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          }}
        >
          {isAts ? 'ATS 1-Col' : '2-Col'}
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
            animation: 'fadeIn 0.15s ease-out',
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
                  backgroundColor: isAts ? '#e0f2fe' : '#ede9fe',
                  color: isAts ? '#0369a1' : '#6b21a8',
                  border: `1px solid ${isAts ? '#bae6fd' : '#ddd6fe'}`,
                }}
              >
                {isAts ? 'ATS 1-Col' : '2-Col'}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {formattedDate}
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

      {/* Card Content */}
      <div
        style={{
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
        }}
      >
        {/* Version Title or Inline Rename Input */}
        <div style={{ marginBottom: '0.5rem', minHeight: '28px', display: 'flex', alignItems: 'center' }}>
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
                padding: '3px 6px',
                fontSize: '0.92rem',
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
              }}
            >
              <h4
                onDoubleClick={() => onStartRename(version)}
                title="Doble clic para renombrar"
                style={{
                  margin: 0,
                  fontSize: '0.92rem',
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
                }}
              >
                <Edit3 size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Metadata: Created Date */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '0.75rem',
            color: '#64748b',
            marginBottom: '1rem',
          }}
        >
          <Calendar size={13} />
          <span>{formattedDate}</span>
        </div>

        {/* Action Buttons Toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginTop: 'auto',
            paddingTop: '0.75rem',
            borderTop: '1px solid #f1f5f9',
          }}
        >
          {/* Cargar */}
          <button
            type="button"
            data-testid="btn-load-version"
            onClick={() => onConfirmLoad(version)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              padding: '0.45rem 0.75rem',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              border: '1px solid #bfdbfe',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
          >
            <CheckCircle2 size={14} />
            Cargar
          </button>

          {/* Previsualizar */}
          <button
            type="button"
            data-testid="btn-preview-version"
            aria-label="Previsualizar versión"
            title="Previsualizar versión"
            disabled={!version.thumbnail}
            onClick={() => setIsPreviewOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '0.45rem 0.65rem',
              backgroundColor: '#f8fafc',
              color: version.thumbnail ? '#334155' : '#94a3b8',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: version.thumbnail ? 'pointer' : 'not-allowed',
            }}
          >
            <Eye size={14} />
            <span style={{ fontSize: '0.75rem' }}>Ver</span>
          </button>

          {/* Duplicar */}
          <button
            type="button"
            data-testid="btn-duplicate-version"
            aria-label="Duplicar versión"
            title="Duplicar"
            onClick={() => onDuplicate(version.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '0.45rem 0.65rem',
              backgroundColor: '#f8fafc',
              color: '#475569',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <Copy size={14} />
            <span style={{ fontSize: '0.75rem' }}>Duplicar</span>
          </button>

          {/* Descargar JSON */}
          <button
            type="button"
            data-testid="btn-download-version-json"
            aria-label="Descargar esta versión como JSON"
            title="Descargar esta versión como JSON"
            onClick={() => onDownloadJSON(version)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.45rem',
              backgroundColor: '#f8fafc',
              color: '#475569',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            <Download size={14} />
          </button>

          {/* Eliminar */}
          <button
            type="button"
            data-testid="btn-delete-version"
            aria-label="Eliminar versión"
            title="Eliminar"
            onClick={() => onConfirmDelete(version)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.45rem',
              backgroundColor: '#fff1f2',
              color: '#e11d48',
              border: '1px solid #fecdd3',
              borderRadius: '6px',
              cursor: 'pointer',
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
