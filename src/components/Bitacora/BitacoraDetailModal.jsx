/**
 * @file BitacoraDetailModal.jsx
 * @description Reader view dialog for reading comprehensive guide content in Bitácora.
 */

import React, { useEffect } from 'react';
import { ObsidianCallout } from './ObsidianCallout';
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
}) => {
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

  const badgeColor = categoryConfig?.badgeColor || '#6366f1';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bitacora-detail-title"
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
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
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
        className="bitacora-detail-dialog"
        style={{
          maxWidth: '720px',
          width: '100%',
          maxHeight: '88vh',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #e2e8f0',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#ffffff',
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
                  color: '#64748b',
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
            onClick={onClose}
            aria-label="Cerrar guía"
            title="Cerrar guía (Esc)"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
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
            color: '#1e293b',
          }}
        >
          <h2
            id="bitacora-detail-title"
            style={{
              margin: '0 0 0.75rem 0',
              fontSize: '1.35rem',
              fontWeight: 800,
              color: '#0f172a',
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
              color: '#64748b',
            }}
          >
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: author?.isOfficial ? '#eff6ff' : '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: author?.isOfficial ? '#2563eb' : '#64748b',
                fontWeight: 700,
                fontSize: '0.7rem',
              }}
            >
              {author?.name ? author.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <span style={{ fontWeight: 600, color: '#334155' }}>
              {author?.name || 'Comunidad'}
            </span>
            {author?.isOfficial && (
              <CheckCircle2 size={14} color="#2563eb" title="Consejo Oficial Verificado" />
            )}
            {createdAt && <span>• {createdAt}</span>}
          </div>

          {/* Summary Quote */}
          {summary && (
            <p
              style={{
                fontSize: '0.95rem',
                color: '#475569',
                lineHeight: 1.6,
                backgroundColor: '#f8fafc',
                padding: '12px 14px',
                borderRadius: '8px',
                borderLeft: '3px solid #94a3b8',
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
                color: '#334155',
                whiteSpace: 'pre-line',
              }}
            >
              {content}
            </div>
          )}

          {/* Links Section */}
          {links.length > 0 && (
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#0f172a' }}>
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
                      color: '#2563eb',
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
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
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
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#ffffff',
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
              border: isVoted ? '1px solid #3b82f6' : '1px solid #e2e8f0',
              backgroundColor: isVoted ? 'rgba(59, 130, 246, 0.1)' : '#f8fafc',
              color: isVoted ? '#2563eb' : '#475569',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <ThumbsUp size={15} fill={isVoted ? '#2563eb' : 'none'} />
            <span>{isVoted ? '¡Marcado como útil!' : '¿Te resultó útil?'} ({upvotes})</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#334155',
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
