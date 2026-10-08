/**
 * @file BitacoraModal.jsx
 * @description Full-screen modal for the Bitácora / Career Knowledge Hub.
 * Features categorized navigation, real-time search, tag filtering,
 * polymorphic card rendering, and Obsidian Callout integration.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useBitacora } from '../../hooks/useBitacora';
import { useModalTheme } from '../../hooks/useModalTheme';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { ModalThemeToggle } from '../common/ModalThemeToggle';
import { BitacoraCard } from './BitacoraCard';
import { BitacoraDetailModal } from './BitacoraDetailModal';
import { BitacoraSubmitModal } from './BitacoraSubmitModal';
import {
  Compass,
  Search,
  X,
  Sparkles,
  BookOpen,
  Filter,
  PlusCircle,
  Tag,
} from 'lucide-react';

export const BitacoraModal = ({ isOpen, onClose }) => {
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const { modalTheme, isDark, toggleModalTheme } = useModalTheme();
  const dialogRef = useRef(null);

  useFocusTrap(dialogRef, {
    isOpen: isOpen && !isSubmitOpen,
    onClose,
  });

  const {
    categories,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    selectedTag,
    setSelectedTag,
    items,
    totalCount,
    filteredCount,
    categoryCounts,
    votedIds,
    handleVote,
    activeItem,
    setActiveItem,
    addNewItem,
  } = useBitacora();

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !activeItem && !isSubmitOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeItem, isSubmitOpen, onClose]);

  // Lookup map for fast category styling
  const categoryMap = useMemo(() => {
    const map = {};
    categories.forEach((cat) => {
      map[cat.id] = cat;
    });
    return map;
  }, [categories]);

  if (!isOpen) return null;

  return (
    <div
      className="bitacora-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !activeItem && !isSubmitOpen) {
          onClose();
        }
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bitacora-modal-title"
        className="bitacora-modal-container"
        data-theme={modalTheme}
        style={{
          maxWidth: 'min(1240px, 95vw)',
          width: '100%',
          height: '92vh',
          maxHeight: '92vh',
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
          borderRadius: '18px',
          boxShadow: isDark
            ? '0 25px 60px -15px rgba(0, 0, 0, 0.7)'
            : '0 25px 60px -15px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: isDark
            ? '1px solid #334155'
            : '1px solid rgba(226, 232, 240, 0.9)',
        }}
      >
        {/* =====================================================================
            1. Modal Header
            ===================================================================== */}
        <header
          style={{
            padding: '1.25rem 1.75rem',
            borderBottom: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: isDark ? '#0f172a' : '#ffffff',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)',
                flexShrink: 0,
              }}
            >
              <BookOpen size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2
                  id="bitacora-modal-title"
                  style={{
                    margin: 0,
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: isDark ? '#f8fafc' : '#0f172a',
                    lineHeight: 1.2,
                  }}
                >
                  Bitácora & Playbook de Carrera
                </h2>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    backgroundColor: isDark
                      ? 'rgba(59, 130, 246, 0.2)'
                      : '#eff6ff',
                    color: isDark ? '#93c5fd' : '#2563eb',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  {totalCount} recursos
                </span>
              </div>
              <p
                style={{
                  margin: '3px 0 0 0',
                  fontSize: '0.82rem',
                  color: isDark ? '#94a3b8' : '#64748b',
                }}
              >
                Conocimiento táctico, filtros ATS, redacción de viñetas y recursos curados para conseguir empleo.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Modal Opt-in Theme Switcher */}
            <ModalThemeToggle theme={modalTheme} onToggle={toggleModalTheme} />

            <button
              type="button"
              onClick={() => setIsSubmitOpen(true)}
              aria-label="Compartir un consejo"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '10px',
                backgroundColor: '#4f46e5',
                color: '#ffffff',
                border: 'none',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)',
                transition: 'background-color 0.15s ease',
              }}
            >
              <PlusCircle size={16} />
              <span>Compartir Consejo</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar bitácora"
              title="Cerrar (Esc)"
              style={{
                background: isDark ? '#1e293b' : '#f8fafc',
                border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '8px',
                cursor: 'pointer',
                color: isDark ? '#cbd5e1' : '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.15s ease, color 0.15s ease',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* =====================================================================
            2. Search & Filter Bar
            ===================================================================== */}
        <div
          style={{
            padding: '1rem 1.75rem',
            backgroundColor: isDark ? '#1e293b' : '#f8fafc',
            borderBottom: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
          }}
        >
          {/* Top row: Search input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                position: 'relative',
                flex: 1,
                maxWidth: '640px',
              }}
            >
              <Search
                size={16}
                color={isDark ? '#94a3b8' : '#94a3b8'}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                placeholder="Buscar por palabra clave, tecnología, logro o tag (ej: ATS, STAR, Google, salario)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 36px 9px 36px',
                  borderRadius: '10px',
                  border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
                  backgroundColor: isDark ? '#0f172a' : '#ffffff',
                  fontSize: '0.88rem',
                  color: isDark ? '#f8fafc' : '#0f172a',
                  outline: 'none',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                  boxSizing: 'border-box',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Limpiar búsqueda"
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: isDark ? '#cbd5e1' : '#94a3b8',
                    padding: '2px',
                  }}
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Active Tag indicator */}
            {selectedTag && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: isDark ? 'rgba(124, 58, 237, 0.25)' : '#ede9fe',
                  color: isDark ? '#c4b5fd' : '#6d28d9',
                  border: isDark ? '1px solid rgba(139, 92, 246, 0.4)' : 'none',
                  padding: '5px 10px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}
              >
                <Tag size={12} />
                <span>#{selectedTag}</span>
                <button
                  type="button"
                  onClick={() => setSelectedTag(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: isDark ? '#c4b5fd' : '#6d28d9',
                    padding: '0 2px',
                  }}
                  title="Quitar filtro de etiqueta"
                >
                  <X size={12} />
                </button>
              </div>
            )}
          </div>

          {/* Bottom row: Category Filter Pills */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              overflowX: 'auto',
              paddingBottom: '2px',
            }}
          >
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              const count = categoryCounts[cat.id] || 0;

              return (
                <button
                  key={cat.id}
                  data-testid={`bitacora-filter-${cat.id}`}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.id);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    border: isActive
                      ? `1.5px solid ${cat.badgeColor || '#4f46e5'}`
                      : isDark
                      ? '1px solid #334155'
                      : '1px solid #e2e8f0',
                    backgroundColor: isActive
                      ? isDark
                        ? 'rgba(99, 102, 241, 0.2)'
                        : '#ffffff'
                      : isDark
                      ? '#0f172a'
                      : '#ffffff',
                    color: isActive
                      ? cat.badgeColor || '#4f46e5'
                      : isDark
                      ? '#cbd5e1'
                      : '#475569',
                    boxShadow: isActive ? '0 2px 8px rgba(0, 0, 0, 0.12)' : 'none',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                  title={cat.description}
                >
                  <span>{cat.label}</span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      padding: '1px 6px',
                      borderRadius: '999px',
                      backgroundColor: isActive
                        ? isDark
                          ? 'rgba(99, 102, 241, 0.35)'
                          : `${cat.badgeColor || '#4f46e5'}20`
                        : isDark
                        ? '#1e293b'
                        : '#f1f5f9',
                      color: isActive
                        ? cat.badgeColor || '#4f46e5'
                        : isDark
                        ? '#94a3b8'
                        : '#64748b',
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* =====================================================================
            3. Main Content Grid (Scrollable)
            ===================================================================== */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.75rem',
            backgroundColor: isDark ? '#0b0f19' : '#f8fafc',
          }}
        >
          {items.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4rem 1rem',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isDark ? '#94a3b8' : '#94a3b8',
                  marginBottom: '1rem',
                }}
              >
                <Search size={26} />
              </div>
              <h3
                style={{
                  margin: '0 0 0.5rem 0',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: isDark ? '#f8fafc' : '#1e293b',
                }}
              >
                No se encontraron recursos con los filtros seleccionados
              </h3>
              <p
                style={{
                  margin: '0 0 1.25rem 0',
                  fontSize: '0.86rem',
                  color: isDark ? '#94a3b8' : '#64748b',
                  maxWidth: '420px',
                }}
              >
                Probá buscando con otros términos o seleccioná otra categoría en la barra superior.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedTag(null);
                }}
                style={{
                  padding: '7px 16px',
                  backgroundColor: isDark ? '#1e293b' : '#ffffff',
                  border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
                  borderRadius: '8px',
                  color: isDark ? '#93c5fd' : '#2563eb',
                  fontWeight: 600,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                }}
              >
                Restablecer todos los filtros
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: '1.25rem',
                alignItems: 'start',
              }}
            >
              {items.map((item) => (
                <BitacoraCard
                  key={item.id}
                  item={item}
                  theme={modalTheme}
                  isVoted={votedIds.has(item.id)}
                  onVote={handleVote}
                  onOpenDetail={(targetItem) => setActiveItem(targetItem)}
                  onSelectTag={(tag) => setSelectedTag(tag)}
                  categoryConfig={categoryMap[item.category]}
                />
              ))}
            </div>
          )}
        </div>

        {/* =====================================================================
            4. Modal Footer
            ===================================================================== */}
        <footer
          style={{
            padding: '0.85rem 1.75rem',
            borderTop: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0',
            backgroundColor: isDark ? '#0f172a' : '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.8rem',
            color: isDark ? '#94a3b8' : '#64748b',
          }}
        >
          <div>
            Mostrando <strong>{filteredCount}</strong> de {totalCount} consejos y recursos
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Consejos auditados y curados</span>
          </div>
        </footer>
      </div>

      {/* Reader View Modal for In-Depth Guides */}
      {activeItem && (
        <BitacoraDetailModal
          item={activeItem}
          theme={modalTheme}
          onClose={() => setActiveItem(null)}
          isVoted={votedIds.has(activeItem.id)}
          onVote={handleVote}
          categoryConfig={categoryMap[activeItem.category]}
        />
      )}

      {/* Submission Modal for User Suggestions */}
      {isSubmitOpen && (
        <BitacoraSubmitModal
          isOpen={isSubmitOpen}
          theme={modalTheme}
          onClose={() => setIsSubmitOpen(false)}
          onSubmit={addNewItem}
        />
      )}
    </div>
  );
};

export default BitacoraModal;
