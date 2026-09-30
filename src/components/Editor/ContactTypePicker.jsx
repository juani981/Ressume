import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { CONTACT_TYPES, CONTACT_CATEGORIES, ContactIcon } from '../../utils/contactTypes';
import { Search, X, Plus } from 'lucide-react';

/**
 * ContactTypePicker
 * 
 * Floating popover menu that allows users to pick a standardized contact/social type
 * with preloaded BoxIcons and placeholders.
 * Adheres to AGENTS.md Rule 3: dynamically positions adjacent to trigger element,
 * clamps within viewport boundaries, and closes on click-outside or ESC.
 */
const ContactTypePicker = ({ isOpen, onClose, onSelectType, triggerRect, portalTarget }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const popoverRef = useRef(null);
  const inputRef = useRef(null);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedCategory('all');
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 50);
    }
  }, [isOpen]);

  // Handle click outside and Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Calculate dynamic coordinates based on triggerRect (AGENTS.md Rule 3)
  const calculatePosition = () => {
    const popoverWidth = 320;
    const popoverHeight = 380;
    const padding = 12;

    let top = 100;
    let left = 100;

    if (triggerRect) {
      // Default: below trigger button
      top = triggerRect.bottom + 8;
      left = triggerRect.left;

      // Flip above if escaping viewport bottom
      if (top + popoverHeight > window.innerHeight - padding) {
        top = Math.max(padding, triggerRect.top - popoverHeight - 8);
      }

      // Clamp horizontally
      if (left + popoverWidth > window.innerWidth - padding) {
        left = window.innerWidth - popoverWidth - padding;
      }
      if (left < padding) {
        left = padding;
      }
    } else {
      // Fallback centered
      top = Math.max(padding, window.innerHeight / 2 - popoverHeight / 2);
      left = Math.max(padding, window.innerWidth / 2 - popoverWidth / 2);
    }

    return { top: `${top}px`, left: `${left}px` };
  };

  const positionStyle = calculatePosition();

  // Filter types by category & search
  const filteredTypes = CONTACT_TYPES.filter(type => {
    const matchesCat = selectedCategory === 'all' || type.category === selectedCategory;
    const matchesSearch = !searchQuery.trim() || 
      type.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      type.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const popoverContent = (
    <div
      ref={popoverRef}
      className="contact-type-picker-popover no-print"
      style={{
        position: 'fixed',
        ...positionStyle,
        width: '320px',
        maxHeight: '400px',
        backgroundColor: '#ffffff',
        color: '#1e293b',
        borderRadius: '12px',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.08)',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'scaleIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
      data-testid="contact-type-picker"
    >
      {/* Header */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 0.85rem 0.5rem 0.85rem',
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
        }}
      >
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--title-color, #1e293b)' }}>
          Agregar Dato de Contacto
        </span>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '2px',
            color: 'var(--text-color-light, #94a3b8)',
            display: 'flex',
            alignItems: 'center',
            borderRadius: '4px'
          }}
          title="Cerrar (Esc)"
        >
          <X size={16} />
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ padding: '0.5rem 0.85rem 0.4rem 0.85rem' }}>
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'var(--container-color-alt, #f8fafc)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            borderRadius: '6px',
            padding: '0.35rem 0.6rem'
          }}
        >
          <Search size={14} color="#94a3b8" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar tipo (email, leetcode, visa...)"
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '0.8rem',
              width: '100%',
              color: 'var(--text-color, #334155)'
            }}
          />
        </div>
      </div>

      {/* Categories Filter Tabs */}
      <div 
        style={{
          display: 'flex',
          gap: '4px',
          padding: '0 0.85rem 0.5rem 0.85rem',
          overflowX: 'auto',
          borderBottom: '1px solid rgba(0, 0, 0, 0.04)'
        }}
      >
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          style={{
            border: 'none',
            background: selectedCategory === 'all' ? 'var(--first-color, #3874ff)' : 'transparent',
            color: selectedCategory === 'all' ? '#ffffff' : 'var(--text-color-light, #64748b)',
            fontSize: '0.7rem',
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: '999px',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          Todos
        </button>
        {Object.values(CONTACT_CATEGORIES).map(cat => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            style={{
              border: 'none',
              background: selectedCategory === cat.id ? 'var(--first-color, #3874ff)' : 'transparent',
              color: selectedCategory === cat.id ? '#ffffff' : 'var(--text-color-light, #64748b)',
              fontSize: '0.7rem',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '999px',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Items List */}
      <div 
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.4rem 0.5rem',
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '2px'
        }}
      >
        {filteredTypes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem', color: '#94a3b8', fontSize: '0.8rem' }}>
            No se encontraron tipos coincidentes
          </div>
        ) : (
          filteredTypes.map(type => (
            <button
              key={type.id}
              type="button"
              onClick={() => onSelectType(type)}
              data-testid={`contact-type-opt-${type.id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.5rem 0.65rem',
                borderRadius: '6px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'background-color 0.15s ease',
                color: 'var(--text-color, #1e293b)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--container-color-alt, #f1f5f9)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div 
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--container-color-alt, #f1f5f9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  border: '1px solid rgba(0, 0, 0, 0.05)'
                }}
              >
                <ContactIcon name={type.icon} size={16} style={{ color: 'var(--first-color, #3874ff)' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--title-color, #1e293b)' }}>
                  {type.label}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-color-light, #64748b)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {type.placeholder}
                </div>
              </div>
              <Plus size={14} style={{ color: 'var(--text-color-light, #94a3b8)' }} />
            </button>
          ))
        )}
      </div>
    </div>
  );

  const target = portalTarget !== undefined 
    ? portalTarget 
    : (triggerRect && typeof document !== 'undefined' ? document.body : null);

  if (target) {
    return ReactDOM.createPortal(popoverContent, target);
  }
  return popoverContent;
};

export default ContactTypePicker;
