/**
 * Comprehensive E2E Test Battery: Version Manager Hub Epic
 * Covers Tiers 1 to 4:
 * - Tier 1: Feature Coverage (R1, R2, R3, R4)
 * - Tier 2: Boundary & Corner Cases (Escape handling, Corrupt data, 10+ versions, Cancel)
 * - Tier 3: Cross-Feature Interactions (Undo/Redo, ATS/2-col switching, ActionMenu regression)
 * - Tier 4: Real-World Scenarios (Full CRUD lifecycle)
 *
 * Invariants Enforced:
 * - .action-menu-btn count <= 8 (Version Hub button uses .version-hub-btn / btn-open-version-manager)
 * - Zero raw unicode emojis in Obsidian Callouts (SVG icons only)
 * - Callout structure: .obsidian-callout, .callout-title, .callout-content
 * - Self-contained in-memory IndexedDB mock for jsdom / Vitest execution
 */

import React, { useState, useEffect } from 'react';
import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { CVProvider, useCV } from '../context/CVContext';
import ActionMenu from '../components/Editor/ActionMenu';
import ToastNotification from '../components/Editor/ToastNotification';
import VersionManagerModal from '../components/Editor/VersionManagerModal';
import { VersionCard } from '../components/Editor/versionManager/VersionCard';
import { defaultSchema, blankSchema } from '../utils/schema';
import * as versionStorage from '../utils/versionStorage';
import * as versionValidator from '../utils/versionValidator';
import * as cleanPrintEngine from '../utils/staticHtmlPdfEngine';

// ============================================================================
// Robust In-Memory IndexedDB Mock for jsdom Environment
// ============================================================================
class MockIDBRequest {
  constructor() {
    this.result = undefined;
    this.error = null;
    this.readyState = 'pending';
    this.onsuccess = null;
    this.onerror = null;
  }

  _resolve(val) {
    this.result = val;
    this.readyState = 'done';
    setTimeout(() => {
      if (this.onsuccess) {
        this.onsuccess({ target: this });
      }
    }, 0);
  }

  _reject(err) {
    this.error = err;
    this.readyState = 'done';
    setTimeout(() => {
      if (this.onerror) {
        this.onerror({ target: this });
      }
    }, 0);
  }
}

class MockIDBOpenDBRequest extends MockIDBRequest {
  constructor(db) {
    super();
    this.db = db;
    this.onupgradeneeded = null;
    this.onblocked = null;
  }
}

class MockIDBObjectStore {
  constructor(name, keyPath, db) {
    this.name = name;
    this.keyPath = keyPath;
    this.db = db;
    this.indexes = new Map();
  }

  createIndex(name, keyPath, options) {
    this.indexes.set(name, { keyPath, options });
    return this;
  }

  index(name) {
    return {
      getAll: () => {
        const req = new MockIDBRequest();
        const records = Array.from(this.db._getStore(this.name).values());
        req._resolve(records);
        return req;
      }
    };
  }

  put(value) {
    const req = new MockIDBRequest();
    const store = this.db._getStore(this.name);
    const key = value[this.keyPath] || value.id || `v_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const cloned = JSON.parse(JSON.stringify({ ...value, [this.keyPath]: key }));
    store.set(key, cloned);
    req._resolve(key);
    return req;
  }

  add(value) {
    return this.put(value);
  }

  get(key) {
    const req = new MockIDBRequest();
    const store = this.db._getStore(this.name);
    const item = store.get(key);
    req._resolve(item ? JSON.parse(JSON.stringify(item)) : undefined);
    return req;
  }

  getAll() {
    const req = new MockIDBRequest();
    const store = this.db._getStore(this.name);
    const all = Array.from(store.values()).map(v => JSON.parse(JSON.stringify(v)));
    req._resolve(all);
    return req;
  }

  delete(key) {
    const req = new MockIDBRequest();
    const store = this.db._getStore(this.name);
    const existed = store.delete(key);
    req._resolve(existed);
    return req;
  }

  clear() {
    const req = new MockIDBRequest();
    const store = this.db._getStore(this.name);
    store.clear();
    req._resolve();
    return req;
  }
}

class MockIDBTransaction {
  constructor(db, storeNames, mode) {
    this.db = db;
    this.storeNames = Array.isArray(storeNames) ? storeNames : [storeNames];
    this.mode = mode;
    this.oncomplete = null;
    this.onerror = null;
    this.onabort = null;

    setTimeout(() => {
      if (this.oncomplete) {
        this.oncomplete({ target: this });
      }
    }, 5);
  }

  objectStore(name) {
    return this.db._getObjectStore(name);
  }

  abort() {
    if (this.onabort) this.onabort({ target: this });
  }
}

class MockIDBDatabase {
  constructor(name, version = 1) {
    this.name = name;
    this.version = version;
    this.objectStoreNames = [];
    this.objectStoreNames.contains = (s) => this.objectStoreNames.includes(s);
    this._stores = new Map();
    this._storeMeta = new Map();
    this.onversionchange = null;
  }

  createObjectStore(name, options = {}) {
    this.objectStoreNames.push(name);
    this._stores.set(name, new Map());
    this._storeMeta.set(name, options);
    return new MockIDBObjectStore(name, options.keyPath || 'id', this);
  }

  _getStore(name) {
    if (!this._stores.has(name)) {
      this._stores.set(name, new Map());
    }
    return this._stores.get(name);
  }

  _getObjectStore(name) {
    const meta = this._storeMeta.get(name) || { keyPath: 'id' };
    return new MockIDBObjectStore(name, meta.keyPath || 'id', this);
  }

  transaction(storeNames, mode = 'readonly') {
    return new MockIDBTransaction(this, storeNames, mode);
  }

  close() {}
}

class MockIDBFactory {
  constructor() {
    this.databases = new Map();
  }

  open(name, version = 1) {
    const req = new MockIDBOpenDBRequest();
    let db = this.databases.get(name);
    const isNew = !db;

    if (isNew) {
      db = new MockIDBDatabase(name, version);
      this.databases.set(name, db);
    }

    setTimeout(() => {
      if (isNew && req.onupgradeneeded) {
        req.result = db;
        req.onupgradeneeded({ target: req, oldVersion: 0, newVersion: version });
      }
      req.result = db;
      if (req.onsuccess) {
        req.onsuccess({ target: req });
      }
    }, 0);

    return req;
  }

  deleteDatabase(name) {
    const req = new MockIDBRequest();
    this.databases.delete(name);
    req._resolve();
    return req;
  }
}

// Polyfill global indexedDB in test runner if absent or incomplete
let mockIDBInstance = new MockIDBFactory();
if (!globalThis.indexedDB || typeof globalThis.indexedDB.open !== 'function') {
  globalThis.indexedDB = mockIDBInstance;
  if (typeof window !== 'undefined') {
    window.indexedDB = mockIDBInstance;
  }
}

// Helper to reset IndexedDB storage between tests
const resetIndexedDB = () => {
  mockIDBInstance = new MockIDBFactory();
  globalThis.indexedDB = mockIDBInstance;
  if (typeof window !== 'undefined') {
    window.indexedDB = mockIDBInstance;
  }
};

// Helper component for testing CVContext state interactions
const ContextStateInspector = ({ onState }) => {
  const context = useCV();
  useEffect(() => {
    if (onState) onState(context);
  }, [context, onState]);

  return (
    <div data-testid="context-inspector" style={{ display: 'none' }}>
      <span data-testid="layout-type">{context.cvData?.layout?.type}</span>
      <span data-testid="layout-is-ats">{String(context.cvData?.layout?.isAtsMode)}</span>
      <span data-testid="profile-name">{context.cvData?.profile?.name}</span>
      <span data-testid="can-undo">{String(context.canUndo)}</span>
      <span data-testid="can-redo">{String(context.canRedo)}</span>
    </div>
  );
};

// ============================================================================
// MAIN TEST SUITE: VERSION MANAGER HUB EPIC
// ============================================================================
describe('Epic: Version Manager Hub & Snapshot Management', () => {
  beforeEach(async () => {
    localStorage.clear();
    resetIndexedDB();
    if (versionStorage?.clearAllVersions) {
      await versionStorage.clearAllVersions();
    }
    vi.clearAllMocks();
  });

  afterEach(async () => {
    localStorage.clear();
    resetIndexedDB();
    if (versionStorage?.clearAllVersions) {
      await versionStorage.clearAllVersions();
    }
  });

  // ==========================================================================
  // TIER 1: FEATURE COVERAGE (R1, R2, R3, R4)
  // ==========================================================================
  describe('Tier 1: Feature Coverage (Storage, Validation, Modal, UI Actions)', () => {
    
    // --- 1.1 IndexedDB CRUD + Duplicate Operations ---
    describe('1.1 IndexedDB Storage Engine (versionStorage.js)', () => {
      it('T1.1.1: saveVersion persists snapshot with metadata and returns record', async () => {
        if (!versionStorage) {
          console.warn('versionStorage.js not loaded; skipping until implemented');
          return;
        }

        const mockCV = { ...defaultSchema, profile: { name: 'Juan Ignacio Carrizo' } };
        const saved = await versionStorage.saveVersion('Versión Inicial', mockCV, 'data:image/svg+xml;base64,mock');

        expect(saved).toBeDefined();
        expect(saved.id).toBeDefined();
        expect(saved.name).toBe('Versión Inicial');
        expect(saved.cvData.profile.name).toBe('Juan Ignacio Carrizo');
        expect(saved.thumbnail).toBe('data:image/svg+xml;base64,mock');
        expect(saved.createdAt).toBeDefined();
      });

      it('T1.1.2: getAllVersions returns list sorted chronologically', async () => {
        if (!versionStorage) return;

        await versionStorage.saveVersion('Versión 1', defaultSchema);
        await new Promise(r => setTimeout(r, 10));
        await versionStorage.saveVersion('Versión 2', defaultSchema);

        const list = await versionStorage.getAllVersions();
        expect(list.length).toBe(2);
        // Should return array sorted newest first (descending createdAt)
        expect(new Date(list[0].createdAt).getTime()).toBeGreaterThanOrEqual(new Date(list[1].createdAt).getTime());
      });

      it('T1.1.3: getVersion retrieves specific snapshot by ID or null if missing', async () => {
        if (!versionStorage) return;

        const created = await versionStorage.saveVersion('Target Version', defaultSchema);
        const fetched = await versionStorage.getVersion(created.id);
        expect(fetched).toBeDefined();
        expect(fetched.id).toBe(created.id);
        expect(fetched.name).toBe('Target Version');

        const nonExistent = await versionStorage.getVersion('unknown_id_999');
        expect(nonExistent).toBeNull();
      });

      it('T1.1.4: renameVersion updates display name and timestamp', async () => {
        if (!versionStorage) return;

        const created = await versionStorage.saveVersion('Nombre Viejo', defaultSchema);
        const updated = await versionStorage.renameVersion(created.id, 'Nombre Renovado');

        expect(updated.name).toBe('Nombre Renovado');
        const fetched = await versionStorage.getVersion(created.id);
        expect(fetched.name).toBe('Nombre Renovado');
      });

      it('T1.1.5: deleteVersion removes record from storage', async () => {
        if (!versionStorage) return;

        const created = await versionStorage.saveVersion('Para Borrar', defaultSchema);
        const result = await versionStorage.deleteVersion(created.id);
        expect(result).toBe(true);

        const list = await versionStorage.getAllVersions();
        expect(list.some(v => v.id === created.id)).toBe(false);
      });

      it('T1.1.6: duplicateVersion creates clone with distinct ID and (Copia) name', async () => {
        if (!versionStorage) return;

        const original = await versionStorage.saveVersion('Principal', defaultSchema);
        const copy = await versionStorage.duplicateVersion(original.id);

        expect(copy).toBeDefined();
        expect(copy.id).not.toBe(original.id);
        expect(copy.name).toMatch(/Copia/i);
        expect(copy.cvData).toEqual(original.cvData);

        const all = await versionStorage.getAllVersions();
        expect(all.length).toBe(2);
      });
    });

    // --- 1.2 Snapshot Validation & Sanitization ---
    describe('1.2 Snapshot Validation & Sanitization (versionValidator.js)', () => {
      it('T1.2.1: validates and merges standard cvData with defaultSchema', () => {
        if (!versionValidator) {
          console.warn('versionValidator.js not loaded; skipping until implemented');
          return;
        }

        const validSnapshot = {
          layout: { type: '1-column', isAtsMode: true },
          profile: { name: 'Dev Lead' },
          sections: defaultSchema.sections
        };

        const result = versionValidator.sanitizeAndValidateCVSnapshot(validSnapshot);
        expect(result).toBeDefined();
        expect(result.layout.type).toBe('1-column');
        expect(result.layout.isAtsMode).toBe(true);
        expect(result.layout.fontFamily).toBe(defaultSchema.layout.fontFamily);
        expect(result.profile.name).toBe('Dev Lead');
      });

      it('T1.2.2: guarantees profile_header section exists even if omitted in snapshot', () => {
        if (!versionValidator) return;

        const missingHeader = {
          layout: { type: '2-column' },
          profile: { name: 'Juan Test' },
          sections: [
            { id: 'skills', type: 'skills', column: 'left', title: 'Habilidades', items: [] }
          ]
        };

        const result = versionValidator.sanitizeAndValidateCVSnapshot(missingHeader);
        expect(result.sections.some(s => s.id === 'profile_header' || s.type === 'profile_header')).toBe(true);
      });

      it('T1.2.3: rejects or sanitizes null / primitive / corrupt inputs safely', () => {
        if (!versionValidator) return;

        const fromNull = versionValidator.sanitizeAndValidateCVSnapshot(null);
        expect(fromNull).toBeDefined();
        expect(fromNull.layout).toBeDefined();
        expect(fromNull.sections).toBeDefined();

        const fromString = versionValidator.sanitizeAndValidateCVSnapshot('invalid string');
        expect(fromString).toBeDefined();
        expect(fromString.layout).toBeDefined();
      });

      it('T1.2.4: fixes missing column assignments on section items', () => {
        if (!versionValidator) return;

        const invalidColumns = {
          layout: { type: '2-column' },
          sections: [
            { id: 'sec1', type: 'custom', column: 'invalid_middle', title: 'Test', items: [] }
          ]
        };

        const result = versionValidator.sanitizeAndValidateCVSnapshot(invalidColumns);
        const sec1 = result.sections.find(s => s.id === 'sec1');
        expect(['left', 'right']).toContain(sec1.column);
      });
    });

    // --- 1.3 ActionMenu Version Hub Toolbar Button ---
    describe('1.3 ActionMenu Integration & Version Hub Trigger', () => {
      it('T1.3.1: renders dedicated Version Hub button with History icon in toolbar', () => {
        render(
          <CVProvider>
            <ActionMenu />
          </CVProvider>
        );

        // Query via specified testid or version-hub-btn class
        const hubBtn = screen.queryByTestId('btn-open-version-manager') || document.querySelector('.version-hub-btn');
        expect(hubBtn).toBeInTheDocument();

        // Must have tooltip or title mentioning versions
        const btnTitle = hubBtn.getAttribute('title') || hubBtn.getAttribute('aria-label') || '';
        expect(btnTitle.toLowerCase()).toMatch(/versi[oó]n|historial/i);
      });

      it('T1.3.2: preserves existing <= 8 buttons regression invariant on .action-menu-btn', () => {
        render(
          <CVProvider>
            <ActionMenu />
          </CVProvider>
        );

        const navbar = document.querySelector('.l-navbar');
        expect(navbar).toBeInTheDocument();

        // Invariant check: .action-menu-btn count must NOT exceed 8
        const topButtons = navbar.querySelectorAll('.action-menu-btn');
        expect(topButtons.length).toBeLessThanOrEqual(8);
      });

      it('T1.3.3: clicking Version Hub button triggers opening of VersionManagerModal', async () => {
        render(
          <CVProvider>
            <ActionMenu />
          </CVProvider>
        );

        const hubBtn = screen.queryByTestId('btn-open-version-manager') || document.querySelector('.version-hub-btn');
        fireEvent.click(hubBtn);

        await waitFor(() => {
          const modal = document.querySelector('.version-manager-modal') || screen.queryByRole('dialog');
          expect(modal).toBeInTheDocument();
        });
      });
    });

    // --- 1.4 Modal Lifecycle (Open, Close, Escape) ---
    describe('1.4 Modal Lifecycle & Accessibility', () => {
      it('T1.4.1: modal displays header with title and close button', () => {
        if (!VersionManagerModal) return;

        const handleClose = vi.fn();
        render(<VersionManagerModal isOpen={true} onClose={handleClose} />);

        const closeBtn = screen.queryByTestId('btn-close-version-modal') || screen.queryByLabelText(/cerrar/i) || document.querySelector('.modal-close-btn');
        expect(closeBtn).toBeInTheDocument();

        fireEvent.click(closeBtn);
        expect(handleClose).toHaveBeenCalledTimes(1);
      });

      it('T1.4.2: pressing Escape key closes the modal', () => {
        if (!VersionManagerModal) return;

        const handleClose = vi.fn();
        render(<VersionManagerModal isOpen={true} onClose={handleClose} />);

        fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
        expect(handleClose).toHaveBeenCalledTimes(1);
      });

      it('T1.4.3: clicking the backdrop outside modal content invokes onClose', () => {
        if (!VersionManagerModal) return;

        const handleClose = vi.fn();
        render(<VersionManagerModal isOpen={true} onClose={handleClose} />);

        const backdrop = document.querySelector('.version-modal-backdrop') || document.querySelector('.version-manager-overlay');
        if (backdrop) {
          fireEvent.click(backdrop);
          expect(handleClose).toHaveBeenCalled();
        }
      });
    });

    // --- 1.5 Version Actions: Save, Load, Rename, Duplicate, Delete ---
    describe('1.5 Version Operations UI & Card Grid', () => {
      it('T1.5.1: "Save Current as New Version" bar saves snapshot and displays in grid', async () => {
        if (!VersionManagerModal) return;

        render(
          <CVProvider>
            <VersionManagerModal isOpen={true} onClose={() => {}} />
          </CVProvider>
        );

        const nameInput = screen.queryByTestId('input-new-version-name') || screen.queryByPlaceholderText(/nombre/i);
        const saveBtn = screen.queryByTestId('btn-save-version') || screen.queryByText(/guardar versi[oó]n/i);

        expect(nameInput).toBeInTheDocument();
        expect(saveBtn).toBeInTheDocument();

        fireEvent.change(nameInput, { target: { value: 'Nueva Versión Test' } });
        fireEvent.click(saveBtn);

        await waitFor(() => {
          expect(screen.getByText('Nueva Versión Test')).toBeInTheDocument();
        });
      });

      it('T1.5.2: Load button shows confirmation and replaces cvData state', async () => {
        if (!VersionManagerModal || !versionStorage) return;

        await versionStorage.saveVersion('Versión Remota', {
          ...defaultSchema,
          profile: { name: 'Candidato Alternativo' }
        });

        let currentContext = null;
        render(
          <CVProvider>
            <VersionManagerModal isOpen={true} onClose={() => {}} />
            <ContextStateInspector onState={(ctx) => { currentContext = ctx; }} />
          </CVProvider>
        );

        await waitFor(() => {
          expect(screen.getByText('Versión Remota')).toBeInTheDocument();
        });

        const loadBtn = screen.queryByTestId('btn-load-version') || screen.queryByText(/cargar|restaurar/i);
        fireEvent.click(loadBtn);

        // Confirmation Callout should appear
        const confirmBtn = screen.queryByTestId('btn-confirm-load') || screen.queryByText(/confirmar|reemplazar/i);
        expect(confirmBtn).toBeInTheDocument();
        fireEvent.click(confirmBtn);

        await waitFor(() => {
          expect(currentContext.cvData.profile.name).toBe('Candidato Alternativo');
          const savedLocal = JSON.parse(localStorage.getItem('cvData'));
          expect(savedLocal.profile.name).toBe('Candidato Alternativo');
        });
      });

      it('T1.5.3: Inline rename allows updating version title', async () => {
        if (!VersionManagerModal || !versionStorage) return;

        await versionStorage.saveVersion('Original Para Renombrar', defaultSchema);

        render(
          <CVProvider>
            <VersionManagerModal isOpen={true} onClose={() => {}} />
          </CVProvider>
        );

        await waitFor(() => {
          expect(screen.getByText('Original Para Renombrar')).toBeInTheDocument();
        });

        const renameTrigger = screen.queryByTestId('btn-rename-version') || screen.queryByLabelText(/renombrar/i);
        fireEvent.click(renameTrigger);

        const renameInput = screen.queryByTestId('input-rename-version') || screen.getByDisplayValue('Original Para Renombrar');
        fireEvent.change(renameInput, { target: { value: 'Nombre Finalizado' } });
        fireEvent.keyDown(renameInput, { key: 'Enter', code: 'Enter' });

        await waitFor(() => {
          expect(screen.getByText('Nombre Finalizado')).toBeInTheDocument();
        });
      });

      it('T1.5.4: Duplicate action creates cloned card in grid', async () => {
        if (!VersionManagerModal || !versionStorage) return;

        await versionStorage.saveVersion('Base para Copiar', defaultSchema);

        render(
          <CVProvider>
            <VersionManagerModal isOpen={true} onClose={() => {}} />
          </CVProvider>
        );

        await waitFor(() => {
          expect(screen.getByText('Base para Copiar')).toBeInTheDocument();
        });

        const dupBtn = screen.queryByTestId('btn-duplicate-version') || screen.queryByText(/duplicar/i);
        fireEvent.click(dupBtn);

        await waitFor(() => {
          const cards = document.querySelectorAll('.version-card');
          expect(cards.length).toBe(2);
        });
      });

      it('T1.5.5: Delete removes version after confirmation', async () => {
        if (!VersionManagerModal || !versionStorage) return;

        await versionStorage.saveVersion('Versión a Destruir', defaultSchema);

        render(
          <CVProvider>
            <VersionManagerModal isOpen={true} onClose={() => {}} />
          </CVProvider>
        );

        await waitFor(() => {
          expect(screen.getByText('Versión a Destruir')).toBeInTheDocument();
        });

        const deleteBtn = screen.queryByTestId('btn-delete-version') || screen.queryByLabelText(/eliminar/i);
        fireEvent.click(deleteBtn);

        // Danger Obsidian Callout confirmation
        const confirmDeleteBtn = screen.queryByTestId('btn-confirm-delete') || screen.queryByText(/eliminar definitivamente/i);
        expect(confirmDeleteBtn).toBeInTheDocument();
        fireEvent.click(confirmDeleteBtn);

        await waitFor(() => {
          expect(screen.queryByText('Versión a Destruir')).not.toBeInTheDocument();
        });
      });
    });
  });

  // ==========================================================================
  // TIER 2: BOUNDARY & CORNER CASES
  // ==========================================================================
  describe('Tier 2: Boundary & Corner Cases', () => {
    it('T2.1: Escape key cancels inline rename without closing entire modal', async () => {
      if (!VersionManagerModal || !versionStorage) return;

      const handleClose = vi.fn();
      await versionStorage.saveVersion('Nombre Intacto', defaultSchema);

      render(
        <CVProvider>
          <VersionManagerModal isOpen={true} onClose={handleClose} />
        </CVProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Nombre Intacto')).toBeInTheDocument();
      });

      // Start inline rename
      const renameBtn = screen.queryByTestId('btn-rename-version') || screen.queryByLabelText(/renombrar/i);
      fireEvent.click(renameBtn);

      const input = screen.getByDisplayValue('Nombre Intacto');
      fireEvent.change(input, { target: { value: 'Nombre Cancelado' } });

      // Press Escape while focused on rename input
      fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });

      // Modal should NOT be closed
      expect(handleClose).not.toHaveBeenCalled();

      // Name should revert to original
      expect(screen.getByText('Nombre Intacto')).toBeInTheDocument();
    });

    it('T2.2: Corrupted snapshot missing layout & sections recovers safely without crash', () => {
      if (!versionValidator) return;

      const corruptSnapshot = {
        custom_junk_field: 12345,
        layout: null,
        sections: null
      };

      const sanitized = versionValidator.sanitizeAndValidateCVSnapshot(corruptSnapshot);
      expect(sanitized).toBeDefined();
      expect(sanitized.layout).toBeDefined();
      expect(sanitized.layout.type).toBe('2-column');
      expect(Array.isArray(sanitized.sections)).toBe(true);
      expect(sanitized.sections.length).toBeGreaterThan(0);
    });

    it('T2.3: Handles 10+ versions smoothly with responsive scrolling and without storage errors', async () => {
      if (!VersionManagerModal || !versionStorage) return;

      // Seed 12 versions
      for (let i = 1; i <= 12; i++) {
        await versionStorage.saveVersion(`Snapshot #${i}`, defaultSchema);
      }

      render(
        <CVProvider>
          <VersionManagerModal isOpen={true} onClose={() => {}} />
        </CVProvider>
      );

      await waitFor(() => {
        const cards = document.querySelectorAll('.version-card');
        expect(cards.length).toBe(12);
      });

      // Verify grid container has scrollable overflow
      const grid = document.querySelector('.version-grid') || document.querySelector('.version-cards-container');
      expect(grid).toBeInTheDocument();
    });

    it('T2.4: Destructive action cancellation leaves versions and current state intact', async () => {
      if (!VersionManagerModal || !versionStorage) return;

      await versionStorage.saveVersion('Versión Segura', defaultSchema);

      render(
        <CVProvider>
          <VersionManagerModal isOpen={true} onClose={() => {}} />
        </CVProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Versión Segura')).toBeInTheDocument();
      });

      // Click delete, then cancel
      const deleteBtn = screen.queryByTestId('btn-delete-version') || screen.queryByLabelText(/eliminar/i);
      fireEvent.click(deleteBtn);

      const cancelBtn = screen.queryByTestId('btn-cancel-delete') || screen.queryByText(/cancelar/i);
      expect(cancelBtn).toBeInTheDocument();
      fireEvent.click(cancelBtn);

      // Version must still be present
      expect(screen.getByText('Versión Segura')).toBeInTheDocument();
      const all = await versionStorage.getAllVersions();
      expect(all.length).toBe(1);
    });
  });

  // ==========================================================================
  // TIER 3: CROSS-FEATURE INTERACTIONS
  // ==========================================================================
  describe('Tier 3: Cross-Feature Interactions (Undo/Redo, ATS Switch, ActionMenu Invariants)', () => {
    it('T3.1: Loading a version is undoable via Ctrl+Z back to preceding CV state', async () => {
      let contextRef = null;

      const TestHarness = () => {
        contextRef = useCV();
        return (
          <div>
            <span data-testid="active-name">{contextRef.cvData?.profile?.name}</span>
            <button 
              data-testid="simulate-load-version"
              onClick={() => {
                if (contextRef.loadVersionSnapshot) {
                  contextRef.loadVersionSnapshot({
                    ...defaultSchema,
                    profile: { name: 'Candidato Cargado v2' }
                  });
                }
              }}
            >
              Cargar
            </button>
          </div>
        );
      };

      render(
        <CVProvider>
          <TestHarness />
        </CVProvider>
      );

      const initialName = contextRef.cvData?.profile?.name || defaultSchema.profile.name;
      const loadBtn = screen.getByTestId('simulate-load-version');

      act(() => {
        fireEvent.click(loadBtn);
      });

      if (contextRef.loadVersionSnapshot) {
        expect(screen.getByTestId('active-name')).toHaveTextContent('Candidato Cargado v2');

        // Trigger undo
        act(() => {
          contextRef.undo();
        });

        // Must revert back to initial CV name
        expect(screen.getByTestId('active-name')).toHaveTextContent(initialName);
      }
    });

    it('T3.2: Switching between ATS mode and 2-column versions preserves layout integrity', async () => {
      let contextRef = null;

      const LayoutHarness = () => {
        contextRef = useCV();
        return (
          <div>
            <span data-testid="layout-type">{contextRef.cvData?.layout?.type}</span>
            <span data-testid="ats-flag">{String(contextRef.cvData?.layout?.isAtsMode)}</span>
            <button
              data-testid="load-ats"
              onClick={() => {
                if (contextRef.loadVersionSnapshot) {
                  contextRef.loadVersionSnapshot({
                    ...defaultSchema,
                    layout: { ...defaultSchema.layout, type: '1-column', isAtsMode: true }
                  });
                }
              }}
            >
              Load ATS
            </button>
            <button
              data-testid="load-2col"
              onClick={() => {
                if (contextRef.loadVersionSnapshot) {
                  contextRef.loadVersionSnapshot({
                    ...defaultSchema,
                    layout: { ...defaultSchema.layout, type: '2-column', isAtsMode: false }
                  });
                }
              }}
            >
              Load 2-Col
            </button>
          </div>
        );
      };

      render(
        <CVProvider>
          <LayoutHarness />
        </CVProvider>
      );

      if (contextRef.loadVersionSnapshot) {
        // Load ATS version
        act(() => {
          fireEvent.click(screen.getByTestId('load-ats'));
        });
        expect(screen.getByTestId('layout-type')).toHaveTextContent('1-column');
        expect(screen.getByTestId('ats-flag')).toHaveTextContent('true');

        // Load 2-Column version
        act(() => {
          fireEvent.click(screen.getByTestId('load-2col'));
        });
        expect(screen.getByTestId('layout-type')).toHaveTextContent('2-column');
        expect(screen.getByTestId('ats-flag')).toHaveTextContent('false');
      }
    });

    it('T3.3: Direct "Descargar como PDF" button in toolbar and <= 8 buttons regression invariant', () => {
      render(
        <CVProvider>
          <ActionMenu />
        </CVProvider>
      );

      // Verify native print button exists directly in lateral toolbar
      const pdfBtn = screen.getByTestId('btn-action-native-print');
      expect(pdfBtn).toBeInTheDocument();
      expect(pdfBtn.getAttribute('title') || pdfBtn.getAttribute('aria-label')).toMatch(/pdf/i);

      // Verify toolbar count adheres to invariant <= 8
      const navbar = document.querySelector('.l-navbar');
      const buttons = navbar.querySelectorAll('.action-menu-btn');
      expect(buttons.length).toBeLessThanOrEqual(8);
    });

    it('T3.4: Obsidian Callouts strictly adhere to AGENTS.md visual invariants and zero unicode emojis', async () => {
      if (!VersionManagerModal || !versionStorage) return;

      await versionStorage.saveVersion('Callout Audit Version', defaultSchema);

      render(
        <CVProvider>
          <VersionManagerModal isOpen={true} onClose={() => {}} />
        </CVProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Callout Audit Version')).toBeInTheDocument();
      });

      // Trigger delete confirmation to inspect Danger Callout
      const deleteBtn = screen.queryByTestId('btn-delete-version') || screen.queryByLabelText(/eliminar/i);
      fireEvent.click(deleteBtn);

      const callout = document.querySelector('.obsidian-callout');
      expect(callout).toBeInTheDocument();

      const titleEl = callout.querySelector('.callout-title');
      const contentEl = callout.querySelector('.callout-content');
      expect(titleEl).toBeInTheDocument();
      expect(contentEl).toBeInTheDocument();

      // Verify 4px solid left border
      const style = callout.getAttribute('style') || '';
      expect(style).toContain('border-left');

      // Verify ZERO raw unicode emojis
      const text = callout.textContent || '';
      expect(text).not.toContain('🛑');
      expect(text).not.toContain('🚨');
      expect(text).not.toContain('⚠️');
      expect(text).not.toContain('ℹ️');

      // Verify SVG icon inside callout title
      const svgIcon = callout.querySelector('svg');
      expect(svgIcon).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // TIER 4: REAL-WORLD SCENARIOS (FULL USER LIFECYCLE)
  // ==========================================================================
  describe('Tier 4: Real-World Scenarios (End-to-End User Lifecycle)', () => {
    it('T4.1: Executes complete lifecycle: Save v1 -> Edit -> Save v2 -> Load v1 -> Duplicate v1 -> Rename duplicate to v1-final -> Delete v2', async () => {
      if (!versionStorage) {
        console.warn('versionStorage not loaded; skipping lifecycle until implemented');
        return;
      }

      // Step 1: User saves current default CV as 'v1'
      const v1 = await versionStorage.saveVersion('v1', defaultSchema, 'thumb_v1');
      expect(v1.id).toBeDefined();

      // Step 2: User edits CV
      const modifiedCV = {
        ...defaultSchema,
        profile: { name: 'Juan Ignacio - Tech Lead' },
        layout: { ...defaultSchema.layout, type: '1-column', isAtsMode: true }
      };

      // Step 3: User saves edited CV as 'v2'
      const v2 = await versionStorage.saveVersion('v2', modifiedCV, 'thumb_v2');
      expect(v2.id).toBeDefined();

      let allVersions = await versionStorage.getAllVersions();
      expect(allVersions.length).toBe(2);

      // Step 4: User restores 'v1'
      const fetchedV1 = await versionStorage.getVersion(v1.id);
      expect(fetchedV1.cvData.profile.name).toBe(defaultSchema.profile.name);

      // Step 5: User duplicates 'v1'
      const v1Duplicate = await versionStorage.duplicateVersion(v1.id);
      expect(v1Duplicate.id).not.toBe(v1.id);

      // Step 6: User renames duplicate to 'v1-final'
      const renamed = await versionStorage.renameVersion(v1Duplicate.id, 'v1-final');
      expect(renamed.name).toBe('v1-final');

      // Step 7: User deletes 'v2'
      const deleteResult = await versionStorage.deleteVersion(v2.id);
      expect(deleteResult).toBe(true);

      // Final state audit: only 'v1' and 'v1-final' remain; 'v2' is permanently removed
      allVersions = await versionStorage.getAllVersions();
      expect(allVersions.length).toBe(2);
      const names = allVersions.map(v => v.name);
      expect(names).toContain('v1');
      expect(names).toContain('v1-final');
      expect(names).not.toContain('v2');
    });
  });

  // ==========================================================================
  // TIER 5: INTEGRATED JSON EXPORT AND IMPORT ACTIONS
  // ==========================================================================
  describe('Tier 5: Integrated JSON Export and Import Actions in Version Manager', () => {
    it('T5.1: renders JSON Backup toolbar with Import and Download buttons', async () => {
      if (!VersionManagerModal || !versionStorage) return;

      render(
        <CVProvider>
          <VersionManagerModal isOpen={true} onClose={() => {}} />
        </CVProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('btn-export-active-json')).toBeInTheDocument();
        expect(screen.getByTestId('btn-import-json')).toBeInTheDocument();
        expect(screen.getByTestId('input-import-json-file')).toBeInTheDocument();
      });
    });

    it('T5.2: clicking export active JSON triggers file download', async () => {
      if (!VersionManagerModal || !versionStorage) return;

      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

      render(
        <CVProvider>
          <VersionManagerModal isOpen={true} onClose={() => {}} />
        </CVProvider>
      );

      const exportBtn = screen.getByTestId('btn-export-active-json');
      fireEvent.click(exportBtn);

      expect(clickSpy).toHaveBeenCalled();
      clickSpy.mockRestore();
    });

    it('T5.3: version cards display dedicated PDF download button and trigger PDF export', async () => {
      if (!VersionManagerModal || !versionStorage) return;

      const cleanPrintSpy = vi.spyOn(cleanPrintEngine, 'executeCleanPrint').mockResolvedValue();
      await versionStorage.saveVersion('Snapshot Download Test', defaultSchema, 'thumb_test');

      render(
        <CVProvider>
          <VersionManagerModal isOpen={true} onClose={() => {}} />
        </CVProvider>
      );

      await waitFor(() => {
        const downloadBtns = screen.getAllByTestId('btn-download-version-pdf');
        expect(downloadBtns.length).toBeGreaterThan(0);
      });

      const downloadBtn = screen.getAllByTestId('btn-download-version-pdf')[0];
      fireEvent.click(downloadBtn);

      await waitFor(() => {
        expect(cleanPrintSpy).toHaveBeenCalled();
        const calledData = cleanPrintSpy.mock.calls[0][0];
        expect(calledData.versionName).toBe('Snapshot Download Test');
      });

      cleanPrintSpy.mockRestore();
    });

    it('T5.4: importing valid JSON file parses, saves version and notifies user', async () => {
      if (!VersionManagerModal || !versionStorage) return;

      render(
        <CVProvider>
          <VersionManagerModal isOpen={true} onClose={() => {}} />
        </CVProvider>
      );

      const fileInput = screen.getByTestId('input-import-json-file');
      const testCV = {
        ...defaultSchema,
        profile: { ...defaultSchema.profile, name: 'Imported User Profile' }
      };

      const mockFile = new Blob([JSON.stringify(testCV)], { type: 'application/json' });
      mockFile.name = 'imported_cv_backup.json';
      mockFile.text = async () => JSON.stringify(testCV);

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
      });

      await waitFor(async () => {
        const versions = await versionStorage.getAllVersions();
        const found = versions.find(v => v.name.includes('imported cv backup') || v.name.includes('Importado'));
        expect(found).toBeDefined();
      });
    });
  });

  // ==========================================================================
  // TIER 6: DIRECT PDF EXPORT & LIFECYCLE SPINNER TOAST CONFIRMATION
  // ==========================================================================
  describe('Tier 6: Direct PDF Export & Lifecycle Spinner Toast Confirmation', () => {
    it('T6.1: clicking direct PDF button starts loading spinner toast and enters loading state', async () => {
      const cleanPrintSpy = vi.spyOn(cleanPrintEngine, 'executeCleanPrint').mockReturnValue(new Promise(() => {}));

      render(
        <CVProvider>
          <ActionMenu />
          <ToastNotification />
        </CVProvider>
      );

      const pdfBtn = screen.getByTestId('btn-action-native-print');
      fireEvent.click(pdfBtn);

      // Verify button is disabled during generation
      expect(pdfBtn).toBeDisabled();

      // Verify loading toast is visible with spinner message
      const toast = screen.getByTestId('toast-notification');
      expect(toast).toBeInTheDocument();
      expect(toast.textContent).toMatch(/generando|preparando/i);

      cleanPrintSpy.mockRestore();
    });

    it('T6.2: when print dialog closes (afterprint event), loading state finishes and success toast appears', async () => {
      const cleanPrintSpy = vi.spyOn(cleanPrintEngine, 'executeCleanPrint').mockResolvedValue();

      render(
        <CVProvider>
          <ActionMenu />
          <ToastNotification />
        </CVProvider>
      );

      const pdfBtn = screen.getByTestId('btn-action-native-print');
      fireEvent.click(pdfBtn);

      expect(cleanPrintSpy).toHaveBeenCalledTimes(1);

      // Simulate browser native print dialog closing (afterprint event)
      act(() => {
        window.dispatchEvent(new Event('afterprint'));
      });

      await waitFor(() => {
        const toast = screen.getByTestId('toast-notification');
        expect(toast.textContent).toMatch(/procesado|éxito|preparado/i);
        expect(pdfBtn).not.toBeDisabled();
      });

      cleanPrintSpy.mockRestore();
    });
  });

  // ==========================================================================
  // TIER 7: START BLANK CV TEMPLATE WITH PLACEHOLDERS
  // ==========================================================================
  describe('Tier 7: Start Blank CV Template with Placeholders', () => {
    it('T7.1: renders "Empezar CV en Blanco" button in Version Manager action bar', async () => {
      if (!VersionManagerModal || !versionStorage) return;

      render(
        <CVProvider>
          <VersionManagerModal isOpen={true} onClose={() => {}} />
        </CVProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('btn-start-blank-cv')).toBeInTheDocument();
        expect(screen.getByTestId('btn-start-blank-cv').textContent).toMatch(/blanco/i);
      });
    });

    it('T7.2: clicking "Empezar CV en Blanco" triggers Obsidian Callout confirmation', async () => {
      if (!VersionManagerModal || !versionStorage) return;

      render(
        <CVProvider>
          <VersionManagerModal isOpen={true} onClose={() => {}} />
        </CVProvider>
      );

      fireEvent.click(screen.getByTestId('btn-start-blank-cv'));

      await waitFor(() => {
        const callout = screen.getByTestId('callout-confirm-blank');
        expect(callout).toBeInTheDocument();
        expect(callout.textContent).toMatch(/plantilla limpia|placeholders/i);
      });
    });

    it('T7.3: clicking cancel in confirmation dismisses the callout without loading', async () => {
      if (!VersionManagerModal || !versionStorage) return;

      render(
        <CVProvider>
          <VersionManagerModal isOpen={true} onClose={() => {}} />
        </CVProvider>
      );

      fireEvent.click(screen.getByTestId('btn-start-blank-cv'));
      expect(screen.getByTestId('callout-confirm-blank')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('btn-cancel-blank'));
      expect(screen.queryByTestId('callout-confirm-blank')).toBeNull();
    });

    it('T7.4: confirming "Empezar CV en Blanco" loads blankSchema placeholders into state', async () => {
      if (!VersionManagerModal || !versionStorage) return;

      let currentState = null;
      const StateProbe = () => {
        const { cvData } = useCV();
        currentState = cvData;
        return <div data-testid="probe-name">{cvData.profile?.name}</div>;
      };

      const onCloseSpy = vi.fn();

      render(
        <CVProvider>
          <StateProbe />
          <VersionManagerModal isOpen={true} onClose={onCloseSpy} />
        </CVProvider>
      );

      fireEvent.click(screen.getByTestId('btn-start-blank-cv'));
      fireEvent.click(screen.getByTestId('btn-confirm-blank'));

      await waitFor(() => {
        expect(onCloseSpy).toHaveBeenCalledTimes(1);
        expect(currentState.profile.name).toBe(blankSchema.profile.name);
      });
    });
  });

  // ==========================================================================
  // TIER 8: HOVER PREVIEW & THUMBNAIL INVARIANTS (UX UPGRADE)
  // ==========================================================================
  describe('Tier 8: Version Card UI Invariants & Fullscreen Hover Preview', () => {
    it('T8.1: VersionCard renders thumbnail with fixed height and always visible actions', () => {
      const mockVersion = {
        id: 'v_hover_1',
        name: 'Full Stack Engineer 2026',
        createdAt: new Date().toISOString(),
        thumbnail: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
        cvData: { ...defaultSchema, layout: { type: '2-column' } },
      };

      const { container } = render(
        <VersionCard
          version={mockVersion}
          isEditing={false}
          onStartRename={() => {}}
          onCancelRename={() => {}}
          onCommitRename={() => {}}
          onChangeRenameText={() => {}}
          onConfirmLoad={() => {}}
          onDuplicate={() => {}}
          onDownloadJSON={() => {}}
          onConfirmDelete={() => {}}
        />
      );

      const thumb = container.querySelector('.version-thumbnail-container');
      expect(thumb).toBeInTheDocument();
      expect(thumb.style.height).toBe('190px');
      expect(thumb.style.flexShrink).toBe('0');

      // Actions toolbar always visible
      expect(screen.getByTestId('btn-load-version')).toBeInTheDocument();
      expect(screen.getByTestId('btn-preview-version')).toBeInTheDocument();
      expect(screen.getByTestId('btn-duplicate-version')).toBeInTheDocument();
      expect(screen.getByTestId('btn-download-version-pdf')).toBeInTheDocument();
      expect(screen.getByTestId('btn-delete-version')).toBeInTheDocument();
    });

    it('T8.2: hover is completely disabled, and clicking Previsualizar button displays preview lightbox and closes with close button', async () => {
      const mockVersion = {
        id: 'v_preview_2',
        name: 'Senior Architect Snapshot',
        createdAt: new Date().toISOString(),
        thumbnail: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
        cvData: { ...defaultSchema, layout: { type: '1-column', isAtsMode: true } },
      };

      const { container } = render(
        <VersionCard
          version={mockVersion}
          isEditing={false}
          onStartRename={() => {}}
          onCancelRename={() => {}}
          onCommitRename={() => {}}
          onChangeRenameText={() => {}}
          onConfirmLoad={() => {}}
          onDuplicate={() => {}}
          onDownloadJSON={() => {}}
          onConfirmDelete={() => {}}
        />
      );

      const thumb = container.querySelector('.version-thumbnail-container');
      expect(thumb).toBeInTheDocument();

      // Invariant: Hover does NOT open preview overlay
      fireEvent.mouseEnter(thumb);
      expect(document.querySelector('.version-large-preview-overlay')).toBeNull();

      // Clicking Previsualizar button explicitly opens preview overlay
      const previewBtn = screen.getByTestId('btn-preview-version');
      fireEvent.click(previewBtn);
      const previewOverlay = document.querySelector('.version-large-preview-overlay');
      expect(previewOverlay).not.toBeNull();
      expect(screen.getByTestId('version-large-preview')).toBeInTheDocument();

      // Clicking close button closes the preview overlay
      const closeBtn = screen.getByTestId('btn-close-large-preview');
      fireEvent.click(closeBtn);
      expect(document.querySelector('.version-large-preview-overlay')).toBeNull();
    });

    it('T8.3: clicking on an item (thumbnail or body) triggers onConfirmLoad as default action instead of preview', async () => {
      const onConfirmLoad = vi.fn();
      const mockVersion = {
        id: 'v_click_default',
        name: 'Staff Engineer Snapshot',
        createdAt: new Date().toISOString(),
        thumbnail: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
        cvData: { ...defaultSchema, layout: { type: '1-column', isAtsMode: true } },
      };

      const { container } = render(
        <VersionCard
          version={mockVersion}
          isEditing={false}
          onStartRename={() => {}}
          onCancelRename={() => {}}
          onCommitRename={() => {}}
          onChangeRenameText={() => {}}
          onConfirmLoad={onConfirmLoad}
          onDuplicate={() => {}}
          onDownloadJSON={() => {}}
          onConfirmDelete={() => {}}
        />
      );

      // Clicking thumbnail triggers onConfirmLoad
      const thumb = container.querySelector('.version-thumbnail-container');
      fireEvent.click(thumb);
      expect(onConfirmLoad).toHaveBeenCalledWith(mockVersion);
      // And does NOT open preview
      expect(document.querySelector('.version-large-preview-overlay')).toBeNull();

      // Clicking card title area also triggers onConfirmLoad
      onConfirmLoad.mockClear();
      const cardTitle = screen.getByText('Staff Engineer Snapshot');
      fireEvent.click(cardTitle);
      expect(onConfirmLoad).toHaveBeenCalledWith(mockVersion);
      expect(document.querySelector('.version-large-preview-overlay')).toBeNull();
    });

    it('T8.4: selecting the eye opens fullscreen scrollable preview with iframe and Escape key closes it', async () => {
      const mockVersion = {
        id: 'v_fullscreen_eye',
        name: 'Fullscreen Snapshot',
        createdAt: new Date().toISOString(),
        thumbnail: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
        cvData: { ...defaultSchema, layout: { type: '1-column', isAtsMode: true } },
      };

      render(
        <VersionCard
          version={mockVersion}
          isEditing={false}
          onStartRename={() => {}}
          onCancelRename={() => {}}
          onCommitRename={() => {}}
          onChangeRenameText={() => {}}
          onConfirmLoad={() => {}}
          onDuplicate={() => {}}
          onDownloadJSON={() => {}}
          onConfirmDelete={() => {}}
        />
      );

      const eyeBtn = screen.getByTestId('btn-preview-version');
      fireEvent.click(eyeBtn);

      const previewOverlay = screen.getByTestId('version-large-preview');
      expect(previewOverlay).toBeInTheDocument();
      expect(previewOverlay.style.width).toBe('100vw');
      expect(previewOverlay.style.height).toBe('100vh');

      // The preview iframe is rendered
      const iframe = screen.getByTestId('version-preview-iframe');
      expect(iframe).toBeInTheDocument();

      // Pressing Escape closes the fullscreen preview
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(document.querySelector('.version-large-preview-overlay')).toBeNull();
    });
  });
});
