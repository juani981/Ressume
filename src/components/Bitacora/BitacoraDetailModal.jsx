/**
 * @file BitacoraDetailModal.jsx
 * @description Reader view dialog for reading comprehensive guide content in Bitácora.
 * Supports dark mode by default with opt-in light mode.
 */

import React, { useEffect, useRef } from 'react';
import { ObsidianCallout } from './ObsidianCallout';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import {
  X,
  ExternalLink,
  ThumbsUp,
  Clock,
  CheckCircle2,
  Tag,
  BookOpen,
} from 'lucide-react';

export const BitacoraDetailModal = ({
  item,
  onClose,
  isVoted,
  onVote,
  categoryConfig,
  theme = 'dark',
}) => {
  const dialogRef = useRef(null);

  useFocusTrap(dialogRef, {
    isOpen: Boolean(item),
    onClose,
  });
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!item) return null;

  const {
    id,
    title,
    summary,
    readTimeMinutes,
    callout,
    content,
    links = [],
    author,
    upvotes = 0,
    tags = [],
    createdAt,
  } = item;

  const isDark = theme === 'dark';
  const badgeColor = categoryConfig?.badgeColor || '#6366f1';

  return (
    <div
      data-theme={theme}
      className="bitacora-detail-backdrop"
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
        zIndex: 1200,
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
        aria-labelledby="bitacora-detail-title"
        className="bitacora-detail-dialog"
        data-testid="bitacora-detail-modal"
        data-theme={theme}
        style={{
          maxWidth: '720px',
          width: '100%',
          maxHeight: '88vh',
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
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
            borderBottom: isDark ? '1px solid #1e293b' : '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: isDark ? '#0f172a' : '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                backgroundColor: `${badgeColor}18`,
                color: badgeColor,
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                padding: '3px 8px',
                borderRadius: '999px',
              }}
            >
              {categoryConfig?.label || item.category}
            </span>
            {readTimeMinutes && (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: isDark ? '#94a3b8' : '#64748b',
                  fontSize: '0.75rem',
                }}
              >
                <Clock size={12} />
                {readTimeMinutes} min de lectura
              </span>
            )}
          </div>

          <button
            type="button"
            data-testid="bitacora-detail-close-btn"
            onClick={onClose}
            aria-label="Cerrar guía"
            title="Cerrar guía (Esc)"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: isDark ? '#94a3b8' : '#64748b',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div
          style={{
            padding: '1.5rem',
            overflowY: 'auto',
            flex: 1,
            color: isDark ? '#cbd5e1' : '#1e293b',
          }}
        >
          <h2
            id="bitacora-detail-title"
            style={{
              margin: '0 0 0.75rem 0',
              fontSize: '1.35rem',
              fontWeight: 800,
              color: isDark ? '#f8fafc' : '#0f172a',
              lineHeight: 1.3,
            }}
          >
            {title}
          </h2>

          {/* Author line */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '1.25rem',
              fontSize: '0.82rem',
              color: isDark ? '#94a3b8' : '#64748b',
            }}
          >
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: author?.isOfficial
                  ? (isDark ? 'rgba(37, 99, 235, 0.25)' : '#eff6ff')
                  : (isDark ? '#1e293b' : '#f1f5f9'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: author?.isOfficial ? '#3b82f6' : (isDark ? '#cbd5e1' : '#64748b'),
                fontWeight: 700,
                fontSize: '0.7rem',
              }}
            >
              {author?.name ? author.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <span style={{ fontWeight: 600, color: isDark ? '#e2e8f0' : '#334155' }}>
              {author?.name || 'Comunidad'}
            </span>
            {author?.isOfficial && (
              <CheckCircle2 size={14} color="#3b82f6" title="Consejo Oficial Verificado" />
            )}
            {createdAt && <span>• {createdAt}</span>}
          </div>

          {/* Summary Quote */}
          {summary && (
            <p
              style={{
                fontSize: '0.95rem',
                color: isDark ? '#cbd5e1' : '#475569',
                lineHeight: 1.6,
                backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                padding: '12px 14px',
                borderRadius: '8px',
                borderLeft: isDark ? '3px solid #6366f1' : '3px solid #94a3b8',
                marginBottom: '1.25rem',
              }}
            >
              {summary}
            </p>
          )}

          {/* Obsidian Callout */}
          {callout && (
            <ObsidianCallout
              type={callout.type}
              title={callout.title}
              content={callout.text}
            />
          )}

          {/* Detailed Content */}
          {content && (
            <div
              style={{
                marginTop: '1.25rem',
                fontSize: '0.92rem',
                lineHeight: 1.65,
                color: isDark ? '#cbd5e1' : '#334155',
                whiteSpace: 'pre-line',
              }}
            >
              {content}
            </div>
          )}

          {/* Links Section */}
          {links.length > 0 && (
            <div
              style={{
                marginTop: '1.5rem',
                borderTop: isDark ? '1px solid #1e293b' : '1px solid #f1f5f9',
                paddingTop: '1rem',
              }}
            >
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: isDark ? '#f8fafc' : '#0f172a' }}>
                Recursos y Enlaces Recomendados:
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {links.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: isDark ? '#60a5fa' : '#2563eb',
                      fontSize: '0.86rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    <ExternalLink size={14} />
                    <span>{link.label}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div style={{ marginTop: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
                    color: isDark ? '#94a3b8' : '#475569',
                    border: isDark ? '1px solid #334155' : 'none',
                    fontSize: '0.75rem',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Tag size={11} color="#94a3b8" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: isDark ? '1px solid #1e293b' : '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: isDark ? '#0f172a' : '#ffffff',
          }}
        >
          <button
            type="button"
            onClick={() => onVote(id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              border: isVoted
                ? (isDark ? '1px solid #6366f1' : '1px solid #3b82f6')
                : (isDark ? '1px solid #334155' : '1px solid #e2e8f0'),
              backgroundColor: isVoted
                ? (isDark ? 'rgba(99, 102, 241, 0.25)' : 'rgba(59, 130, 246, 0.1)')
                : (isDark ? '#1e293b' : '#f8fafc'),
              color: isVoted
                ? (isDark ? '#a5b4fc' : '#2563eb')
                : (isDark ? '#cbd5e1' : '#475569'),
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <ThumbsUp size={15} fill={isVoted ? (isDark ? '#a5b4fc' : '#2563eb') : 'none'} />
            <span>{isVoted ? '¡Marcado como útil!' : '¿Te resultó útil?'} ({upvotes})</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
              backgroundColor: isDark ? '#1e293b' : '#ffffff',
              color: isDark ? '#f8fafc' : '#334155',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default BitacoraDetailModal;
