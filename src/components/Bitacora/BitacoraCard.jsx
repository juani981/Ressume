/**
 * @file BitacoraCard.jsx
 * @description Polymorphic card renderer for Bitácora items.
 * Handles diverse content shapes: short tips, long-form guides, resource links,
 * Obsidian Callouts (Rule 1 compliance), and anti-abuse upvoting.
 */

import React from 'react';
import { ObsidianCallout } from './ObsidianCallout';
import {
  ExternalLink,
  ThumbsUp,
  Clock,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Tag,
} from 'lucide-react';

export const BitacoraCard = ({
  item,
  isVoted,
  onVote,
  onOpenDetail,
  onSelectTag,
  categoryConfig,
}) => {
  const {
    id,
    title,
    summary,
    readTimeMinutes,
    callout,
    content,
    links,
    author,
    upvotes = 0,
    tags = [],
  } = item;

  const hasLongContent = Boolean(content && content.trim());
  const hasLinks = Array.isArray(links) && links.length > 0;
  const badgeColor = categoryConfig?.badgeColor || '#6366f1';

  return (
    <article
      className="bitacora-card"
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1.25rem',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top Meta Bar */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            marginBottom: '0.75rem',
          }}
        >
          {/* Category Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                  gap: '3px',
                  color: '#64748b',
                  fontSize: '0.75rem',
                }}
                title={`Tiempo estimado de lectura: ${readTimeMinutes} min`}
              >
                <Clock size={12} />
                {readTimeMinutes} min
              </span>
            )}
          </div>

          {/* Upvote / Useful Action Button */}
          <button
            type="button"
            onClick={() => onVote(id)}
            aria-label={isVoted ? 'Quitar voto de utilidad' : 'Marcar como útil'}
            title={isVoted ? 'Ya votaste este consejo como útil' : 'Votar consejo como útil'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '8px',
              border: isVoted ? '1px solid #3b82f6' : '1px solid #e2e8f0',
              backgroundColor: isVoted ? 'rgba(59, 130, 246, 0.1)' : '#f8fafc',
              color: isVoted ? '#2563eb' : '#475569',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <ThumbsUp size={13} fill={isVoted ? '#2563eb' : 'none'} />
            <span>{upvotes}</span>
          </button>
        </div>

        {/* Card Title */}
        <h3
          style={{
            margin: '0 0 0.5rem 0',
            fontSize: '1.05rem',
            fontWeight: 700,
            color: '#0f172a',
            lineHeight: 1.35,
          }}
        >
          {title}
        </h3>

        {/* Short Summary */}
        {summary && (
          <p
            style={{
              margin: '0 0 0.75rem 0',
              fontSize: '0.86rem',
              color: '#475569',
              lineHeight: 1.5,
            }}
          >
            {summary}
          </p>
        )}

        {/* Obsidian Callout (Rule 1) */}
        {callout && (
          <ObsidianCallout
            type={callout.type}
            title={callout.title}
            content={callout.text}
          />
        )}
      </div>

      {/* Bottom Section: Tags, Links & Actions */}
      <div style={{ marginTop: '0.75rem' }}>
        {/* Tags */}
        {tags.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '5px',
              marginBottom: '0.85rem',
            }}
          >
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => onSelectTag && onSelectTag(tag)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  color: '#475569',
                  fontSize: '0.72rem',
                  fontWeight: 500,
                  padding: '2px 7px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
                title={`Filtrar por etiqueta #${tag}`}
              >
                <Tag size={10} color="#94a3b8" />
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* External Links (if any) */}
        {hasLinks && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              marginBottom: '0.85rem',
            }}
          >
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
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#2563eb',
                  textDecoration: 'none',
                }}
              >
                <ExternalLink size={13} />
                <span>{link.label}</span>
              </a>
            ))}
          </div>
        )}

        {/* Footer Meta & Expansion Trigger */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid #f1f5f9',
            paddingTop: '0.75rem',
            gap: '8px',
          }}
        >
          {/* Author Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                backgroundColor: author?.isOfficial ? '#eff6ff' : '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: author?.isOfficial ? '#2563eb' : '#64748b',
                fontSize: '0.65rem',
                fontWeight: 700,
              }}
            >
              {author?.name ? author.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>
                {author?.name || 'Comunidad'}
              </span>
              {author?.isOfficial && (
                <CheckCircle2 size={13} color="#2563eb" title="Consejo Oficial Verificado" />
              )}
            </div>
          </div>

          {/* Deep Guide Trigger */}
          {hasLongContent && (
            <button
              type="button"
              onClick={() => onOpenDetail(item)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: 'none',
                border: 'none',
                color: '#2563eb',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '4px 6px',
                borderRadius: '6px',
              }}
            >
              <BookOpen size={13} />
              <span>Leer guía</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export default BitacoraCard;
