import React from 'react';
import { TriangleAlert, OctagonAlert } from 'lucide-react';

/**
 * VersionConfirmationDialogs
 * Renders Obsidian Callout confirmation panels for:
 * 1. Confirm Blank CV (Warning)
 * 2. Confirm Load Version (Warning)
 * 3. Confirm Delete Version (Danger)
 */
export const VersionConfirmationDialogs = ({
  confirmBlankCV,
  onCancelBlank,
  onConfirmBlank,
  confirmLoadVersion,
  onCancelLoad,
  onConfirmLoad,
  confirmDeleteVersion,
  onCancelDelete,
  onConfirmDelete,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  return (
    <>
      {confirmBlankCV && (
        <div
          className="obsidian-callout"
          data-testid="callout-confirm-blank"
          style={{
            background: 'rgba(219, 139, 0, 0.1)',
            borderLeft: '4px solid rgba(219, 139, 0, 1)',
            borderRadius: '8px',
            padding: '1.25rem',
            margin: '1.25rem 1.5rem 0',
            fontSize: '0.9rem',
          }}
        >
          <div
            className="callout-title"
            style={{
              display: 'flex',
              gap: '8px',
              fontWeight: 600,
              color: 'rgba(219, 139, 0, 1)',
              marginBottom: '8px',
              alignItems: 'center',
              fontSize: '1rem',
            }}
          >
            <TriangleAlert size={18} /> Iniciar plantilla de muestra
          </div>
          <div
            className="callout-content"
            style={{
              color: isDark ? '#e2e8f0' : '#334155',
              fontSize: '0.85rem',
              lineHeight: 1.5,
            }}
          >
            Se elegirá al azar un perfil de demostración basado en la trayectoria de una persona referente de la computación. Puedes sustituir todos sus datos. El CV actual será reemplazado (puedes deshacer con Ctrl+Z). ¿Deseas continuar?
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button
              type="button"
              data-testid="btn-cancel-blank"
              onClick={onCancelBlank}
              style={{
                padding: '0.45rem 0.9rem',
                border: isDark ? '1px solid #475569' : '1px solid #cbd5e1',
                borderRadius: '6px',
                background: isDark ? '#1e293b' : '#ffffff',
                color: isDark ? '#e2e8f0' : '#475569',
                fontWeight: 500,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              data-testid="btn-confirm-blank"
              onClick={onConfirmBlank}
              style={{
                padding: '0.45rem 0.9rem',
                border: 'none',
                borderRadius: '6px',
                background: 'rgba(219, 139, 0, 1)',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              Sí, Usar esta plantilla
            </button>
          </div>
        </div>
      )}

      {confirmLoadVersion && (
        <div
          className="obsidian-callout"
          style={{
            background: 'rgba(219, 139, 0, 0.1)',
            borderLeft: '4px solid rgba(219, 139, 0, 1)',
            borderRadius: '8px',
            padding: '1.25rem',
            margin: '1.25rem 1.5rem 0',
            fontSize: '0.9rem',
          }}
        >
          <div
            className="callout-title"
            style={{
              display: 'flex',
              gap: '8px',
              fontWeight: 600,
              color: 'rgba(219, 139, 0, 1)',
              marginBottom: '8px',
              alignItems: 'center',
              fontSize: '1rem',
            }}
          >
            <TriangleAlert size={18} /> Cargar Versión
          </div>
          <div
            className="callout-content"
            style={{
              color: isDark ? '#e2e8f0' : '#334155',
              fontSize: '0.85rem',
              lineHeight: 1.5,
            }}
          >
            Cargar esta versión reemplazará el CV actual en el editor. ¿Deseas continuar?
            <div style={{ marginTop: '0.4rem', fontWeight: 600, color: isDark ? '#f8fafc' : '#0f172a' }}>
              Versión seleccionada: {confirmLoadVersion.name}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button
              type="button"
              data-testid="btn-cancel-load"
              onClick={onCancelLoad}
              style={{
                padding: '0.45rem 0.9rem',
                border: isDark ? '1px solid #475569' : '1px solid #cbd5e1',
                borderRadius: '6px',
                background: isDark ? '#1e293b' : '#ffffff',
                color: isDark ? '#e2e8f0' : '#475569',
                fontWeight: 500,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              data-testid="btn-confirm-load"
              onClick={() => onConfirmLoad(confirmLoadVersion)}
              style={{
                padding: '0.45rem 0.9rem',
                border: 'none',
                borderRadius: '6px',
                background: 'rgba(219, 139, 0, 1)',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              Confirmar y Reemplazar
            </button>
          </div>
        </div>
      )}

      {confirmDeleteVersion && (
        <div
          className="obsidian-callout"
          style={{
            background: 'rgba(233, 49, 71, 0.1)',
            borderLeft: '4px solid rgba(233, 49, 71, 1)',
            borderRadius: '8px',
            padding: '1.25rem',
            margin: '1.25rem 1.5rem 0',
            fontSize: '0.9rem',
          }}
        >
          <div
            className="callout-title"
            style={{
              display: 'flex',
              gap: '8px',
              fontWeight: 600,
              color: 'rgba(233, 49, 71, 1)',
              marginBottom: '8px',
              alignItems: 'center',
              fontSize: '1rem',
            }}
          >
            <OctagonAlert size={18} /> Eliminar Versión
          </div>
          <div
            className="callout-content"
            style={{
              color: isDark ? '#e2e8f0' : '#334155',
              fontSize: '0.85rem',
              lineHeight: 1.5,
            }}
          >
            ¿Estás seguro de que deseas eliminar permanentemente esta versión?
            <div style={{ marginTop: '0.4rem', fontWeight: 600, color: isDark ? '#f8fafc' : '#0f172a' }}>
              Versión: {confirmDeleteVersion.name}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button
              type="button"
              data-testid="btn-cancel-delete"
              onClick={onCancelDelete}
              style={{
                padding: '0.45rem 0.9rem',
                border: isDark ? '1px solid #475569' : '1px solid #cbd5e1',
                borderRadius: '6px',
                background: isDark ? '#1e293b' : '#ffffff',
                color: isDark ? '#e2e8f0' : '#475569',
                fontWeight: 500,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              data-testid="btn-confirm-delete"
              onClick={() => onConfirmDelete(confirmDeleteVersion.id)}
              style={{
                padding: '0.45rem 0.9rem',
                border: 'none',
                borderRadius: '6px',
                background: 'rgba(233, 49, 71, 1)',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              Eliminar Definitivamente
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default VersionConfirmationDialogs;
