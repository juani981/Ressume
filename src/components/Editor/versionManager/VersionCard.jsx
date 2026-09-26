import React from 'react';
import {
  CheckCircle2,
  Copy,
  Edit3,
  Trash2,
  Calendar,
  Download,
} from 'lucide-react';

/**
 * VersionCard
 * Renders an individual CV version snapshot card in the Version Manager grid:
 * - Miniature visual thumbnail preview
 * - ATS / 2-Col layout badge
 * - Version title or inline rename input
 * - Created date metadata
 * - Action buttons toolbar: Cargar, Duplicar, Descargar JSON, Eliminar
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
      }}
    >
      {/* Miniature Visual Thumbnail Preview */}
      <div
        style={{
          height: '180px',
          backgroundColor: '#f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
          borderBottom: '1px solid #e2e8f0',
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
