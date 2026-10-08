/**
 * @file ObsidianCallout.jsx
 * @description Standard Obsidian Callout component adhering strictly to AGENTS.md Invariant 1.
 * - Danger / Critical: Background rgba(233, 49, 71, 0.1), 4px solid left border rgba(233, 49, 71, 1), red bold title, 🛑 icon.
 * - Caution / Warning: Background rgba(219, 139, 0, 0.1), 4px solid left border rgba(219, 139, 0, 1), orange bold title, ⚠️ icon.
 * - Info: Background rgba(8, 109, 221, 0.1), 4px solid left border rgba(8, 109, 221, 1), blue bold title, ℹ️ icon.
 * - Structure: .obsidian-callout container, .callout-title with display: flex; gap: 8px; font-weight: 600, and .callout-content.
 */

import React from 'react';

const CALLOUT_THEMES = {
  danger: {
    bg: 'rgba(233, 49, 71, 0.1)',
    border: '4px solid rgba(233, 49, 71, 1)',
    titleColor: 'rgb(220, 38, 38)',
    icon: '🛑',
  },
  critical: {
    bg: 'rgba(233, 49, 71, 0.1)',
    border: '4px solid rgba(233, 49, 71, 1)',
    titleColor: 'rgb(220, 38, 38)',
    icon: '🚨',
  },
  warning: {
    bg: 'rgba(219, 139, 0, 0.1)',
    border: '4px solid rgba(219, 139, 0, 1)',
    titleColor: 'rgb(217, 119, 6)',
    icon: '⚠️',
  },
  caution: {
    bg: 'rgba(219, 139, 0, 0.1)',
    border: '4px solid rgba(219, 139, 0, 1)',
    titleColor: 'rgb(217, 119, 6)',
    icon: '⚠️',
  },
  info: {
    bg: 'rgba(8, 109, 221, 0.1)',
    border: '4px solid rgba(8, 109, 221, 1)',
    titleColor: 'rgb(2, 132, 199)',
    icon: 'ℹ️',
  },
};

export const ObsidianCallout = ({ type = 'info', title, content, style }) => {
  const normalizedType = (type || 'info').toLowerCase();
  const theme = CALLOUT_THEMES[normalizedType] || CALLOUT_THEMES.info;

  return (
    <div
      className="obsidian-callout"
      style={{
        backgroundColor: theme.bg,
        borderLeft: theme.border,
        padding: '10px 14px',
        borderRadius: '6px',
        margin: '10px 0',
        ...style,
      }}
    >
      <div
        className="callout-title"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: 600,
          color: theme.titleColor,
          marginBottom: '4px',
          fontSize: '0.85rem',
        }}
      >
        <span role="img" aria-label={normalizedType}>
          {theme.icon}
        </span>
        <span>{title}</span>
      </div>
      <div
        className="callout-content"
        style={{
          color: '#334155',
          fontSize: '0.82rem',
          lineHeight: 1.45,
        }}
      >
        {content}
      </div>
    </div>
  );
};

export default ObsidianCallout;
