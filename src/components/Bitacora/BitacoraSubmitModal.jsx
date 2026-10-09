/**
 * @file BitacoraSubmitModal.jsx
 * @description Dialog allowing users to submit new advice, guides, or resources to Bitácora.
 * Includes interactive Obsidian Callout builder, link manager, and live card preview.
 */

import React, { useState, useRef } from 'react';
import { BITACORA_CATEGORIES } from '../../data/bitacora/categories';
import { ObsidianCallout } from './ObsidianCallout';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import {
  X,
  Plus,
  Trash2,
  Sparkles,
  ExternalLink,
  AlertTriangle,
  Info,
  CheckCircle2,
} from 'lucide-react';

export const BitacoraSubmitModal = ({ isOpen, onClose, onSubmit, theme = 'dark' }) => {
  const isDark = theme === 'dark';
  const dialogRef = useRef(null);

  useFocusTrap(dialogRef, {
    isOpen,
    onClose,
  });
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('bullets');
  const [summary, setSummary] = useState('');
  const [readTimeMinutes, setReadTimeMinutes] = useState(2);
  const [tagsInput, setTagsInput] = useState('');
  const [content, setContent] = useState('');
  const [authorName, setAuthorName] = useState('');

  // Callout state
  const [includeCallout, setIncludeCallout] = useState(false);
  const [calloutType, setCalloutType] = useState('info');
  const [calloutTitle, setCalloutTitle] = useState('Regla de Oro');
  const [calloutText, setCalloutText] = useState('');

  // Links state
  const [links, setLinks] = useState([]);
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  // Error validation
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const validCategories = BITACORA_CATEGORIES.filter((c) => c.id !== 'all');

  const handleAddLink = () => {
    if (!newLinkLabel.trim() || !newLinkUrl.trim()) return;
    setLinks((prev) => [
      ...prev,
      { label: newLinkLabel.trim(), url: newLinkUrl.trim() },
    ]);
    setNewLinkLabel('');
    setNewLinkUrl('');
  };

  const handleRemoveLink = (index) => {
    setLinks((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Por favor, ingrese un título claro para el consejo.');
      return;
    }
    if (!summary.trim()) {
      setError('Por favor, agregue una bajada o resumen breve del consejo.');
      return;
    }

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    const calloutData =
      includeCallout && calloutText.trim()
        ? {
            type: calloutType,
            title: calloutTitle.trim() || 'Importante',
            text: calloutText.trim(),
          }
        : null;

    const newPost = {
      title: title.trim(),
      category,
      summary: summary.trim(),
      readTimeMinutes: Number(readTimeMinutes) || 2,
      tags: parsedTags,
      callout: calloutData,
      content: content.trim() || null,
      links,
      author: {
        name: authorName.trim() || 'Colaborador Comunitario',
        role: 'Colaborador',
        isOfficial: false,
      },
    };

    onSubmit(newPost);
    onClose();
  };

  return (
    <div
      className="bitacora-submit-overlay"
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
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 1300,
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
        aria-labelledby="submit-modal-title"
        className="bitacora-submit-container"
        style={{
          maxWidth: '680px',
          width: '100%',
          maxHeight: '90vh',
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: isDark ? '1px solid #334155' : '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
          }}
        >
          <div>
            <h3
              id="submit-modal-title"
              style={{
                margin: 0,
                fontSize: '1.15rem',
                fontWeight: 700,
                color: isDark ? '#f8fafc' : '#0f172a',
              }}
            >
              Publicar Consejo o Recurso en la Bitácora
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: isDark ? '#94a3b8' : '#64748b' }}>
              Compartí conocimiento táctico para ayudar a otros a conseguir empleo.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#94a3b8',
              padding: '4px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '1.5rem',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {error && (
            <div
              style={{
                padding: '8px 12px',
                backgroundColor: 'rgba(233, 49, 71, 0.1)',
                borderLeft: '3px solid rgb(233, 49, 71)',
                color: 'rgb(185, 28, 28)',
                fontSize: '0.82rem',
                borderRadius: '6px',
              }}
            >
              {error}
            </div>
          )}

          {/* Row 1: Title */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: isDark ? '#cbd5e1' : '#334155',
                marginBottom: '4px',
              }}
            >
              Título del Consejo *
            </label>
            <input
              type="text"
              placeholder="Ej: Fórmula para responder preguntas de arquitectura en entrevistas"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
                backgroundColor: isDark ? '#0f172a' : '#ffffff',
                color: isDark ? '#f8fafc' : '#0f172a',
                fontSize: '0.88rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Row 2: Category & Author & Read Time */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 90px', gap: '10px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: isDark ? '#cbd5e1' : '#334155',
                  marginBottom: '4px',
                }}
              >
                Categoría *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
                  backgroundColor: isDark ? '#0f172a' : '#ffffff',
                  color: isDark ? '#f8fafc' : '#0f172a',
                  fontSize: '0.85rem',
                }}
              >
                {validCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: isDark ? '#cbd5e1' : '#334155',
                  marginBottom: '4px',
                }}
              >
                Tu Nombre o Alias
              </label>
              <input
                type="text"
                placeholder="Ej: Juani o anónimo"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
                  backgroundColor: isDark ? '#0f172a' : '#ffffff',
                  color: isDark ? '#f8fafc' : '#0f172a',
                  fontSize: '0.85rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: isDark ? '#cbd5e1' : '#334155',
                  marginBottom: '4px',
                }}
              >
                Lectura (min)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={readTimeMinutes}
                onChange={(e) => setReadTimeMinutes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 8px',
                  borderRadius: '8px',
                  border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
                  backgroundColor: isDark ? '#0f172a' : '#ffffff',
                  color: isDark ? '#f8fafc' : '#0f172a',
                  fontSize: '0.85rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Row 3: Summary */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: isDark ? '#cbd5e1' : '#334155',
                marginBottom: '4px',
              }}
            >
              Resumen / Idea Nuclear *
            </label>
            <textarea
              rows={2}
              placeholder="Explica en 1 o 2 líneas el núcleo del consejo."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
                backgroundColor: isDark ? '#0f172a' : '#ffffff',
                color: isDark ? '#f8fafc' : '#0f172a',
                fontSize: '0.85rem',
                boxSizing: 'border-box',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Row 4: Tags */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: isDark ? '#cbd5e1' : '#334155',
                marginBottom: '4px',
              }}
            >
              Etiquetas (separadas por coma)
            </label>
            <input
              type="text"
              placeholder="ATS, React, Behavioral, Salario"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
                backgroundColor: isDark ? '#0f172a' : '#ffffff',
                color: isDark ? '#f8fafc' : '#0f172a',
                fontSize: '0.85rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Row 5: Obsidian Callout Builder */}
          <div
            style={{
              padding: '12px',
              backgroundColor: isDark ? '#0f172a' : '#f8fafc',
              borderRadius: '10px',
              border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.84rem',
                fontWeight: 600,
                color: isDark ? '#f8fafc' : '#0f172a',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={includeCallout}
                onChange={(e) => setIncludeCallout(e.target.checked)}
              />
              <span>Incluir bloque destacado estilo Obsidian Callout</span>
            </label>

            {includeCallout && (
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '8px' }}>
                  <select
                    value={calloutType}
                    onChange={(e) => setCalloutType(e.target.value)}
                    style={{
                      padding: '6px 8px',
                      borderRadius: '6px',
                      border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
                      backgroundColor: isDark ? '#1e293b' : '#ffffff',
                      color: isDark ? '#f8fafc' : '#0f172a',
                      fontSize: '0.82rem',
                    }}
                  >
                    <option value="info">ℹ️ Info</option>
                    <option value="warning">⚠️ Warning</option>
                    <option value="danger">🛑 Danger</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Título del callout (ej: Regla de Oro)"
                    value={calloutTitle}
                    onChange={(e) => setCalloutTitle(e.target.value)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
                      backgroundColor: isDark ? '#1e293b' : '#ffffff',
                      color: isDark ? '#f8fafc' : '#0f172a',
                      fontSize: '0.82rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <textarea
                  rows={2}
                  placeholder="Texto destacado del callout..."
                  value={calloutText}
                  onChange={(e) => setCalloutText(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    color: isDark ? '#f8fafc' : '#0f172a',
                    fontSize: '0.82rem',
                    boxSizing: 'border-box',
                  }}
                />

                {calloutText.trim() && (
                  <div>
                    <span style={{ fontSize: '0.72rem', color: isDark ? '#94a3b8' : '#64748b' }}>Vista previa:</span>
                    <ObsidianCallout
                      type={calloutType}
                      title={calloutTitle || 'Callout'}
                      content={calloutText}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Row 6: External Links */}
          <div
            style={{
              padding: '12px',
              backgroundColor: isDark ? '#0f172a' : '#f8fafc',
              borderRadius: '10px',
              border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
            }}
          >
            <label
              style={{
                display: 'block',
                fontSize: '0.84rem',
                fontWeight: 600,
                color: isDark ? '#f8fafc' : '#0f172a',
                marginBottom: '6px',
              }}
            >
              Enlaces o Recursos Externos
            </label>

            {links.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
                {links.map((link, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: isDark ? '#1e293b' : '#ffffff',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                      fontSize: '0.82rem',
                    }}
                  >
                    <span style={{ fontWeight: 600, color: '#38bdf8' }}>{link.label}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveLink(idx)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#ef4444',
                        padding: '2px',
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px' }}>
              <input
                type="text"
                placeholder="Nombre (ej: Roadmap.sh)"
                value={newLinkLabel}
                onChange={(e) => setNewLinkLabel(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
                  backgroundColor: isDark ? '#1e293b' : '#ffffff',
                  color: isDark ? '#f8fafc' : '#0f172a',
                  fontSize: '0.82rem',
                }}
              />
              <input
                type="url"
                placeholder="https://..."
                value={newLinkUrl}
                onChange={(e) => setNewLinkUrl(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
                  backgroundColor: isDark ? '#1e293b' : '#ffffff',
                  color: isDark ? '#f8fafc' : '#0f172a',
                  fontSize: '0.82rem',
                }}
              />
              <button
                type="button"
                onClick={handleAddLink}
                style={{
                  padding: '6px 10px',
                  backgroundColor: isDark ? '#334155' : '#ffffff',
                  border: isDark ? '1px solid #475569' : '1px solid #cbd5e1',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: isDark ? '#e2e8f0' : '#334155',
                }}
              >
                <Plus size={14} />
                Agregar
              </button>
            </div>
          </div>

          {/* Row 7: Extended Guide Content (Markdown) */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: isDark ? '#cbd5e1' : '#334155',
                marginBottom: '4px',
              }}
            >
              Guía o Contenido Extendido (Opcional - habilita el botón "Leer guía")
            </label>
            <textarea
              rows={4}
              placeholder="Desarrollo completo del consejo, pasos, ejemplos de antes/después o estructura detallada."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
                backgroundColor: isDark ? '#0f172a' : '#ffffff',
                color: isDark ? '#f8fafc' : '#0f172a',
                fontSize: '0.85rem',
                boxSizing: 'border-box',
                fontFamily: 'monospace',
              }}
            />
          </div>

          {/* Submit Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
              marginTop: '0.5rem',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                backgroundColor: isDark ? '#334155' : '#ffffff',
                border: isDark ? '1px solid #475569' : '1px solid #cbd5e1',
                borderRadius: '8px',
                color: isDark ? '#e2e8f0' : '#475569',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                padding: '8px 18px',
                backgroundColor: '#4f46e5',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)',
              }}
            >
              <CheckCircle2 size={15} />
              Publicar en la Bitácora
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BitacoraSubmitModal;
