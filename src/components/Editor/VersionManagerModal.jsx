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
import { History, X, Layers } from 'lucide-react';
import {
  VersionActionBar,
  VersionConfirmationDialogs,
  VersionCard
} from './versionManager';

/**
 * Full-screen Version Manager Hub modal dialog.
 * Allows users to save, restore, duplicate, rename, and delete named CV snapshots.
 * Modularized into VersionActionBar, VersionConfirmationDialogs, and VersionCard.
 *
 * @param {object} props
 * @param {boolean} props.isOpen - Whether modal is visible.
 * @param {Function} props.onClose - Modal close handler.
 * @param {object|null} [props.initialDeleteVersion=null] - Optional initial version for delete confirmation.
 * @param {boolean} [props.initialConfirmBlank=false] - Optional flag to open with blank CV confirmation.
 */
export const VersionManagerModal = ({ 
  isOpen, 
  onClose,
  initialDeleteVersion = null,
  initialConfirmBlank = false
}) => {
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
  const [confirmDeleteVersion, setConfirmDeleteVersion] = useState(initialDeleteVersion);
  const [confirmBlankCV, setConfirmBlankCV] = useState(initialConfirmBlank);

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
    let isMounted = true;
    if (isOpen) {
      setLoading(true);
      getAllVersions().then((list) => {
        if (isMounted) {
          setVersions(list || []);
          setLoading(false);
        }
      }).catch((err) => {
        if (isMounted) {
          console.error('Error loading versions from storage:', err);
          setLoading(false);
        }
      });
      setNewVersionName(generateSuggestedName());
      setConfirmLoadVersion(null);
      setConfirmDeleteVersion(initialDeleteVersion);
      setConfirmBlankCV(initialConfirmBlank);
      setEditingVersionId(null);

      // Lock body scroll
      document.body.style.overflow = 'hidden';
      return () => {
        isMounted = false;
        document.body.style.overflow = '';
      };
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, initialDeleteVersion, initialConfirmBlank, generateSuggestedName]);

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
        <VersionActionBar
          newVersionName={newVersionName}
          setNewVersionName={setNewVersionName}
          isSaving={isSaving}
          onSaveCurrent={handleSaveCurrent}
          onStartBlank={() => setConfirmBlankCV(true)}
          onImportClick={() => fileInputRef.current?.click()}
          fileInputRef={fileInputRef}
          onImportFile={handleImportFile}
          onDownloadActiveJSON={handleDownloadActiveJSON}
        />

        {/* =====================================================================
            3. Obsidian Callout Confirmation Dialogs (Warning / Danger)
            ===================================================================== */}
        <VersionConfirmationDialogs
          confirmBlankCV={confirmBlankCV}
          onCancelBlank={() => setConfirmBlankCV(false)}
          onConfirmBlank={handleConfirmBlankCV}
          confirmLoadVersion={confirmLoadVersion}
          onCancelLoad={() => setConfirmLoadVersion(null)}
          onConfirmLoad={handleConfirmLoad}
          confirmDeleteVersion={confirmDeleteVersion}
          onCancelDelete={() => setConfirmDeleteVersion(null)}
          onConfirmDelete={handleConfirmDelete}
        />

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
            versions.map((version) => (
              <VersionCard
                key={version.id}
                version={version}
                isEditing={editingVersionId === version.id}
                renameText={renameText}
                renameInputRef={renameInputRef}
                onStartRename={startRename}
                onCancelRename={cancelRename}
                onCommitRename={commitRename}
                onChangeRenameText={setRenameText}
                onConfirmLoad={setConfirmLoadVersion}
                onDuplicate={handleDuplicate}
                onDownloadJSON={handleDownloadVersionJSON}
                onConfirmDelete={setConfirmDeleteVersion}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default VersionManagerModal;
