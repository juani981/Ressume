import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useCV } from '../../context/CVContext';
import {
  saveVersion,
  getAllVersions,
  renameVersion,
  deleteVersion,
  duplicateVersion
} from '../../utils/versionStorage';
import { generateThumbnail } from '../../utils/thumbnailGenerator';
import { sanitizeAndValidateCVSnapshot } from '../../utils/versionValidator';
import { blankSchema } from '../../utils/schema';
import {
  History,
  X,
  Plus,
  CheckCircle2,
  Copy,
  Edit3,
  Trash2,
  TriangleAlert,
  OctagonAlert,
  Layers,
  Calendar,
  Download,
  Upload,
  FilePlus
} from 'lucide-react';

/**
 * Full-screen Version Manager Hub modal dialog.
 * Allows users to save, restore, duplicate, rename, and delete named CV snapshots.
 *
 * @param {object} props
 * @param {boolean} props.isOpen - Whether modal is visible.
 * @param {Function} props.onClose - Modal close handler.
 */
export const VersionManagerModal = ({ isOpen, onClose }) => {
  const context = useCV() || {};
  const { cvData, loadVersionSnapshot, showToast } = context;

  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newVersionName, setNewVersionName] = useState('');

  // Inline rename state: versionId | null
  const [editingVersionId, setEditingVersionId] = useState(null);
  const [renameText, setRenameText] = useState('');
  const renameInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Confirmation dialog states
  const [confirmLoadVersion, setConfirmLoadVersion] = useState(null);
  const [confirmDeleteVersion, setConfirmDeleteVersion] = useState(null);
  const [confirmBlankCV, setConfirmBlankCV] = useState(false);

  // Generate suggested version name based on candidate & date
  const generateSuggestedName = useCallback(() => {
    const candidateName = cvData?.profile?.name || 'CV';
    const now = new Date();
    const dateStr = now.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const timeStr = now.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return `${candidateName} (${dateStr} ${timeStr})`;
  }, [cvData]);

  // Load all saved versions from storage
  const loadVersions = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getAllVersions();
      setVersions(list || []);
    } catch (err) {
      console.error('Error loading versions from storage:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize and refresh when modal opens
  useEffect(() => {
    if (isOpen) {
      loadVersions();
      setNewVersionName(generateSuggestedName());
      setConfirmLoadVersion(null);
      setConfirmDeleteVersion(null);
      setConfirmBlankCV(false);
      setEditingVersionId(null);

      // Lock body scroll
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, loadVersions, generateSuggestedName]);

  // Window Escape key handler (closes modal unless focused in inline edit)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        // If inline rename is active, don't close modal (handled in input onKeyDown)
        if (editingVersionId) return;
        if (confirmLoadVersion) {
          setConfirmLoadVersion(null);
          return;
        }
        if (confirmDeleteVersion) {
          setConfirmDeleteVersion(null);
          return;
        }
        if (confirmBlankCV) {
          setConfirmBlankCV(false);
          return;
        }
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, editingVersionId, confirmLoadVersion, confirmDeleteVersion, confirmBlankCV, onClose]);

  // Focus rename input when editing starts
  useEffect(() => {
    if (editingVersionId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [editingVersionId]);

  if (!isOpen) return null;

  // Handle saving current cvData as new snapshot
  const handleSaveCurrent = async (e) => {
    if (e) e.preventDefault();
    if (isSaving) return;

    const nameToSave = newVersionName.trim() || generateSuggestedName();
    setIsSaving(true);

    try {
      const snapshotToSave = {
        ...cvData,
        versionName: nameToSave,
        activeVersionName: nameToSave
      };
      const thumbnail = await generateThumbnail(snapshotToSave);
      const saved = await saveVersion(nameToSave, snapshotToSave, thumbnail);
      if (loadVersionSnapshot) {
        loadVersionSnapshot({
          ...snapshotToSave,
          activeVersionId: saved?.id
        });
      }
      await loadVersions();
      setNewVersionName(generateSuggestedName());
      if (showToast) {
        showToast('Versión guardada correctamente', 'success');
      }
    } catch (err) {
      console.error('Error saving version snapshot:', err);
      if (showToast) {
        showToast('Error al guardar la versión', 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Start inline rename mode
  const startRename = (version) => {
    setEditingVersionId(version.id);
    setRenameText(version.name);
  };

  // Cancel inline rename without saving changes
  const cancelRename = () => {
    setEditingVersionId(null);
    setRenameText('');
  };

  // Commit inline rename
  const commitRename = async (id) => {
    if (!editingVersionId) return;
    const finalName = renameText.trim();
    const currentVersion = versions.find((v) => v.id === id);
    if (finalName && finalName !== currentVersion?.name) {
      try {
        await renameVersion(id, finalName);
        await loadVersions();
        if (cvData?.activeVersionId === id || cvData?.versionName === currentVersion?.name) {
          if (loadVersionSnapshot) {
            loadVersionSnapshot({
              ...cvData,
              versionName: finalName,
              activeVersionName: finalName
            });
          }
        }
        if (showToast) {
          showToast('Versión renombrada exitosamente', 'success');
        }
      } catch (err) {
        console.error('Error renaming version:', err);
      }
    }
    setEditingVersionId(null);
    setRenameText('');
  };

  // Handle duplicate version
  const handleDuplicate = async (id) => {
    try {
      await duplicateVersion(id);
      await loadVersions();
      if (showToast) {
        showToast('Copia de versión creada', 'success');
      }
    } catch (err) {
      console.error('Error duplicating version:', err);
    }
  };

  // Confirm load version: replace active cvData in CVContext
  const handleConfirmLoad = (version) => {
    try {
      if (loadVersionSnapshot) {
        loadVersionSnapshot({
          ...version.cvData,
          versionName: version.name,
          activeVersionName: version.name,
          activeVersionId: version.id
        });
      }
      if (showToast) {
        showToast(`Versión "${version.name}" cargada`, 'success');
      }
      setConfirmLoadVersion(null);
      onClose();
    } catch (err) {
      console.error('Error loading version snapshot:', err);
      if (showToast) {
        showToast('Error al cargar la versión', 'error');
      }
    }
  };

  // Confirm starting a blank CV with placeholder data
  const handleConfirmBlankCV = () => {
    try {
      if (loadVersionSnapshot) {
        loadVersionSnapshot({
          ...blankSchema,
          versionName: null,
          activeVersionName: null,
          activeVersionId: null
        });
      }
      if (showToast) {
        showToast('Plantilla en blanco cargada con datos placeholders', 'info');
      }
      setConfirmBlankCV(false);
      onClose();
    } catch (err) {
      console.error('Error loading blank CV template:', err);
      if (showToast) {
        showToast('Error al inicializar el CV en blanco', 'error');
      }
    }
  };

  // Confirm delete version
  const handleConfirmDelete = async (id) => {
    try {
      await deleteVersion(id);
      await loadVersions();
      if (showToast) {
        showToast('Versión eliminada permanentemente', 'info');
      }
    } catch (err) {
      console.error('Error deleting version:', err);
    } finally {
      setConfirmDeleteVersion(null);
    }
  };

  // Download active CV state as JSON
  const handleDownloadActiveJSON = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cvData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      const safeName = (cvData?.profile?.name || 'curriculum').toLowerCase().replace(/[^a-z0-9]/g, '_');
      downloadAnchor.setAttribute("download", `cv_${safeName}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      if (showToast) {
        showToast('CV actual exportado exitosamente en formato JSON', 'success');
      }
    } catch (err) {
      console.error('Error exporting active CV JSON:', err);
      if (showToast) {
        showToast('Error al exportar el archivo JSON', 'error');
      }
    }
  };

  // Download a specific saved version snapshot as JSON
  const handleDownloadVersionJSON = (version) => {
    try {
      const targetData = version.cvData || cvData;
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(targetData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      const safeName = (version.name || 'version').toLowerCase().replace(/[^a-z0-9]/g, '_');
      downloadAnchor.setAttribute("download", `cv_version_${safeName}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      if (showToast) {
        showToast(`Versión "${version.name}" exportada como JSON`, 'success');
      }
    } catch (err) {
      console.error('Error exporting version JSON:', err);
      if (showToast) {
        showToast('Error al exportar la versión como JSON', 'error');
      }
    }
  };

  // Import JSON file from user's disk
  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileText = await file.text();
      let parsed;
      try {
        parsed = JSON.parse(fileText);
      } catch (parseErr) {
        throw new Error('El archivo seleccionado no contiene un JSON válido.');
      }

      // Handle raw cvData or snapshot structure ({ cvData: ... } or { sections: ... })
      const rawData = parsed.cvData || parsed;
      const validated = sanitizeAndValidateCVSnapshot(rawData);
      if (!validated) {
        throw new Error('La estructura del archivo JSON no coincide con un CV válido.');
      }

      // 1. Generate thumbnail and save as a new version snapshot
      const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
      const suggestedTitle = parsed.name || parsed.versionName || `${baseName} (Importado)`;
      const validatedWithVersion = {
        ...validated,
        versionName: suggestedTitle,
        activeVersionName: suggestedTitle
      };
      const thumbnail = await generateThumbnail(validatedWithVersion);
      const saved = await saveVersion(suggestedTitle, validatedWithVersion, thumbnail);
      await loadVersions();

      // 2. Load into editor state
      if (loadVersionSnapshot) {
        loadVersionSnapshot({
          ...validatedWithVersion,
          activeVersionId: saved?.id
        });
      }

      if (showToast) {
        showToast(`CV "${suggestedTitle}" importado y guardado como nueva versión`, 'success');
      }
    } catch (err) {
      console.error('Error importing JSON file:', err);
      if (showToast) {
        showToast(err.message || 'Error al importar el archivo JSON', 'error');
      }
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="version-modal-title"
      className="version-manager-modal version-modal-backdrop version-manager-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      <div
        className="version-modal-dialog"
        style={{
          maxWidth: '1040px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          border: '1px solid rgba(226, 232, 240, 0.8)',
        }}
      >
        {/* =====================================================================
            1. Modal Header
            ===================================================================== */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563eb',
              }}
            >
              <History size={22} />
            </div>
            <div>
              <h2
                id="version-modal-title"
                style={{
                  margin: 0,
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  lineHeight: 1.2,
                }}
              >
                Gestor de Versiones y Snapshots
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                Guarda, restaura, duplica y administra instantáneas persistentes de tu CV
              </p>
            </div>
          </div>

          <button
            type="button"
            data-testid="btn-close-version-modal"
            className="modal-close-btn"
            aria-label="Cerrar modal de versiones"
            title="Cerrar modal"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              padding: '0.4rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.15s ease, color 0.15s ease',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* =====================================================================
            2. Action Bar: Save Version & JSON Transfer
            ===================================================================== */}
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
            onSubmit={handleSaveCurrent}
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
                onChange={handleImportFile}
                style={{ display: 'none' }}
                data-testid="input-import-json-file"
              />

              {/* Botón Empezar CV en Blanco */}
              <button
                type="button"
                data-testid="btn-start-blank-cv"
                onClick={() => setConfirmBlankCV(true)}
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
                onClick={() => fileInputRef.current?.click()}
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
                onClick={handleDownloadActiveJSON}
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

        {/* =====================================================================
            3. Obsidian Callout Confirmation Dialogs (Warning / Danger)
            ===================================================================== */}
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
              <TriangleAlert size={18} /> Empezar CV en Blanco
            </div>
            <div
              className="callout-content"
              style={{
                color: '#334155',
                fontSize: '0.85rem',
                lineHeight: 1.5,
              }}
            >
              Esta acción inicializará el editor con una plantilla limpia y datos placeholders listos para rellenar. El CV actual en pantalla será reemplazado (puedes deshacer con Ctrl+Z). ¿Deseas continuar?
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button
                type="button"
                data-testid="btn-cancel-blank"
                onClick={() => setConfirmBlankCV(false)}
                style={{
                  padding: '0.45rem 0.9rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  background: '#ffffff',
                  color: '#475569',
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
                onClick={handleConfirmBlankCV}
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
                Sí, Empezar en Blanco
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
                color: '#334155',
                fontSize: '0.85rem',
                lineHeight: 1.5,
              }}
            >
              Cargar esta versión reemplazará el CV actual en el editor. ¿Deseas continuar?
              <div style={{ marginTop: '0.4rem', fontWeight: 600, color: '#0f172a' }}>
                Versión seleccionada: {confirmLoadVersion.name}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button
                type="button"
                data-testid="btn-cancel-load"
                onClick={() => setConfirmLoadVersion(null)}
                style={{
                  padding: '0.45rem 0.9rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  background: '#ffffff',
                  color: '#475569',
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
                onClick={() => handleConfirmLoad(confirmLoadVersion)}
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
                color: '#334155',
                fontSize: '0.85rem',
                lineHeight: 1.5,
              }}
            >
              ¿Estás seguro de que deseas eliminar permanentemente esta versión?
              <div style={{ marginTop: '0.4rem', fontWeight: 600, color: '#0f172a' }}>
                Versión: {confirmDeleteVersion.name}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button
                type="button"
                data-testid="btn-cancel-delete"
                onClick={() => setConfirmDeleteVersion(null)}
                style={{
                  padding: '0.45rem 0.9rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  background: '#ffffff',
                  color: '#475569',
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
                onClick={() => handleConfirmDelete(confirmDeleteVersion.id)}
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

        {/* =====================================================================
            4. Responsive Card Grid
            ===================================================================== */}
        <div
          className="version-grid version-cards-container"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.25rem',
            alignContent: 'start',
          }}
        >
          {loading ? (
            <div
              style={{
                gridColumn: '1 / -1',
                padding: '3rem',
                textAlign: 'center',
                color: '#64748b',
                fontSize: '0.9rem',
              }}
            >
              Cargando versiones guardadas...
            </div>
          ) : versions.length === 0 ? (
            <div
              style={{
                gridColumn: '1 / -1',
                padding: '3.5rem 1.5rem',
                textAlign: 'center',
                color: '#64748b',
                background: '#f8fafc',
                borderRadius: '12px',
                border: '2px dashed #e2e8f0',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#e2e8f0',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                }}
              >
                <Layers size={24} />
              </div>
              <h3 style={{ margin: '0 0 0.5rem', color: '#1e293b', fontSize: '1rem', fontWeight: 600 }}>
                No hay versiones guardadas
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>
                Guarda una instantánea del CV actual usando la barra superior para restaurarla cuando desees.
              </p>
            </div>
          ) : (
            versions.map((version) => {
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

              const isEditing = editingVersionId === version.id;

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
                          onChange={(e) => setRenameText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              e.stopPropagation();
                              cancelRename();
                            } else if (e.key === 'Enter') {
                              e.preventDefault();
                              commitRename(version.id);
                            }
                          }}
                          onBlur={() => commitRename(version.id)}
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
                            onDoubleClick={() => startRename(version)}
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
                            onClick={() => startRename(version)}
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
                        onClick={() => setConfirmLoadVersion(version)}
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
                        onClick={() => handleDuplicate(version.id)}
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
                        onClick={() => handleDownloadVersionJSON(version)}
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
                        onClick={() => setConfirmDeleteVersion(version)}
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
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default VersionManagerModal;
