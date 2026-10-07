import React from 'react';
import { Sun, Moon } from 'lucide-react';

/**
 * ModalThemeToggle
 *
 * Dedicated, accessible theme toggle component strictly for full-screen modals.
 * Allows users to opt-in to Light Mode for long-form reading, while keeping the
 * entire system UI and editor dark by default.
 *
 * @param {Object} props
 * @param {string} props.theme - 'dark' | 'light'
 * @param {Function} props.onToggle - Handler called when toggle is clicked
 * @param {string} [props.className=''] - Additional CSS classes
 * @param {Object} [props.style={}] - Additional inline styles
 */
export const ModalThemeToggle = ({
  theme = 'dark',
  onToggle,
  className = '',
  style = {},
}) => {
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Cambiar a Modo Claro en este modal' : 'Cambiar a Modo Oscuro en este modal'}
      title={isDark ? 'Cambiar a Modo Claro (Opt-in)' : 'Cambiar a Modo Oscuro (Por defecto)'}
      data-testid="modal-theme-toggle"
      data-theme-active={theme}
      onClick={onToggle}
      className={`modal-theme-toggle-btn ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '0.4rem 0.8rem',
        borderRadius: '9999px',
        fontSize: '0.78rem',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        border: isDark
          ? '1px solid rgba(255, 255, 255, 0.16)'
          : '1px solid rgba(0, 0, 0, 0.12)',
        backgroundColor: isDark
          ? 'rgba(30, 41, 59, 0.8)'
          : 'rgba(241, 245, 249, 0.9)',
        color: isDark ? '#f8fafc' : '#0f172a',
        boxShadow: isDark
          ? '0 2px 6px rgba(0, 0, 0, 0.35)'
          : '0 2px 6px rgba(0, 0, 0, 0.06)',
        userSelect: 'none',
        ...style,
      }}
    >
      {isDark ? (
        <>
          <Sun size={15} color="#fbbf24" strokeWidth={2.2} />
          <span>Modo Claro</span>
        </>
      ) : (
        <>
          <Moon size={15} color="#6366f1" strokeWidth={2.2} />
          <span>Modo Oscuro</span>
        </>
      )}
    </button>
  );
};

export default ModalThemeToggle;
