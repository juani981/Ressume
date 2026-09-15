/**
 * @file PhotoItem.jsx
 * @description Item component for the modular 'photo' section type.
 *
 * Implements Open/Closed pattern:
 * - Registered exclusively via sectionRegistry.js
 * - Zero type checks in BaseItem, BaseSection, App.jsx
 * - Supports local image file upload (Base64) and external URL
 * - Configurable shapes (circle, rounded, square) and size
 * - Clean, zero-artifact 100% semantic render in print mode
 */

import React, { useRef } from 'react';
import { useCV } from '../../../context/CVContext';
import { Upload, Link2, Trash2, Circle, Square, Image as ImageIcon } from 'lucide-react';

/**
 * Print View: Pure semantic image container for PDF & Print.
 * Contains zero interactive controls, file inputs, or outlines.
 */
const PhotoItemPrintView = ({ item }) => {
  const url = item?.url;
  if (!url) return null;

  const shape = item?.shape || 'circle';
  const size = item?.size || 130;

  const borderRadius = shape === 'circle' ? '50%' : (shape === 'rounded' ? '12px' : '2px');

  return (
    <div 
      className="cv-photo-container cv-block"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        margin: '0 auto 0.75rem auto',
        padding: '4px 0'
      }}
    >
      <img
        src={url}
        alt={item?.alt || 'Foto de Perfil'}
        className="cv-photo-img"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          objectFit: 'cover',
          borderRadius,
          border: '2px solid rgba(0, 0, 0, 0.08)',
          display: 'block'
        }}
      />
    </div>
  );
};

/**
 * Edit View: Interactive editor container with file upload, URL input, and shape toggle.
 */
const PhotoItemEditView = ({ item, sectionId }) => {
  const { updateSectionItem } = useCV();
  const fileInputRef = useRef(null);

  const url = item?.url || '';
  const shape = item?.shape || 'circle';
  const size = item?.size || 130;

  const borderRadius = shape === 'circle' ? '50%' : (shape === 'rounded' ? '12px' : '2px');

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Read image as Data URL (Base64)
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result;
      if (typeof base64Url === 'string') {
        updateSectionItem(sectionId, item.id, { url: base64Url });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUrlChange = (e) => {
    updateSectionItem(sectionId, item.id, { url: e.target.value });
  };

  const handleShapeChange = (newShape) => {
    updateSectionItem(sectionId, item.id, { shape: newShape });
  };

  const handleSizeChange = (newSize) => {
    updateSectionItem(sectionId, item.id, { size: Number(newSize) });
  };

  const handleClearImage = () => {
    updateSectionItem(sectionId, item.id, { url: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div 
      className="cv-photo-item-edit"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        padding: '0.5rem 0',
        gap: '0.65rem'
      }}
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
        data-testid="photo-file-input"
      />

      {/* Image Preview or Placeholder */}
      <div 
        style={{
          position: 'relative',
          width: `${size}px`,
          height: `${size}px`,
          borderRadius,
          border: '2px dashed #cbd5e1',
          background: 'rgba(241, 245, 249, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          transition: 'all 0.2s ease',
          boxShadow: url ? '0 4px 12px rgba(0, 0, 0, 0.08)' : 'none'
        }}
      >
        {url ? (
          <img
            src={url}
            alt={item?.alt || 'Foto de Perfil'}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius
            }}
          />
        ) : (
          <div 
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              color: '#64748b',
              padding: '1rem',
              textAlign: 'center'
            }}
          >
            <ImageIcon size={28} color="#94a3b8" />
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Click para subir</span>
          </div>
        )}
      </div>

      {/* Interactive Controls Bar (Stripped in Print) */}
      <div 
        className="no-print"
        data-editor-ui="true"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.45rem',
          width: '100%',
          maxWidth: '280px',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '0.5rem 0.65rem',
          boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
        }}
      >
        {/* Buttons: Local Upload & Clear */}
        <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              flex: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '0.35rem 0.5rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: '#eff6ff',
              color: '#2563eb',
              border: '1px solid #bfdbfe',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
            title="Subir archivo local"
            data-testid="photo-upload-btn"
          >
            <Upload size={13} /> Subir Imagen
          </button>

          {url && (
            <button
              type="button"
              onClick={handleClearImage}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.35rem 0.5rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                background: '#fef2f2',
                color: '#dc2626',
                border: '1px solid #fecaca',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
              title="Eliminar imagen"
              data-testid="photo-clear-btn"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>

        {/* URL Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%' }}>
          <Link2 size={13} color="#94a3b8" />
          <input
            type="text"
            placeholder="O ingresa URL externa..."
            value={url.startsWith('data:') ? '' : url}
            onChange={handleUrlChange}
            style={{
              flex: 1,
              padding: '0.25rem 0.4rem',
              fontSize: '0.75rem',
              borderRadius: '4px',
              border: '1px solid #cbd5e1',
              outline: 'none',
              background: '#f8fafc'
            }}
            data-testid="photo-url-input"
          />
        </div>

        {/* Shape and Size Selector */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingTop: '0.2rem' }}>
          {/* Shapes */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              type="button"
              onClick={() => handleShapeChange('circle')}
              style={{
                padding: '3px 6px',
                borderRadius: '4px',
                border: shape === 'circle' ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                background: shape === 'circle' ? '#eff6ff' : '#ffffff',
                color: shape === 'circle' ? '#2563eb' : '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Forma Circular"
              data-testid="shape-circle-btn"
            >
              <Circle size={12} />
            </button>
            <button
              type="button"
              onClick={() => handleShapeChange('rounded')}
              style={{
                padding: '3px 6px',
                borderRadius: '4px',
                border: shape === 'rounded' ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                background: shape === 'rounded' ? '#eff6ff' : '#ffffff',
                color: shape === 'rounded' ? '#2563eb' : '#64748b',
                cursor: 'pointer',
                fontSize: '0.7rem',
                fontWeight: 600
              }}
              title="Bordes Redondeados"
              data-testid="shape-rounded-btn"
            >
              Redondeada
            </button>
            <button
              type="button"
              onClick={() => handleShapeChange('square')}
              style={{
                padding: '3px 6px',
                borderRadius: '4px',
                border: shape === 'square' ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                background: shape === 'square' ? '#eff6ff' : '#ffffff',
                color: shape === 'square' ? '#2563eb' : '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Forma Cuadrada"
              data-testid="shape-square-btn"
            >
              <Square size={12} />
            </button>
          </div>

          {/* Size Preset */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Tamaño:</span>
            <select
              value={size}
              onChange={(e) => handleSizeChange(e.target.value)}
              style={{
                fontSize: '0.7rem',
                padding: '2px 4px',
                borderRadius: '4px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                cursor: 'pointer'
              }}
              data-testid="photo-size-select"
            >
              <option value={100}>Chico (100px)</option>
              <option value={130}>Medio (130px)</option>
              <option value={160}>Grande (160px)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Modular PhotoItem component adhering to BaseItem template contract.
 */
const PhotoItem = ({ item, sectionId, isPrint = false }) => {
  if (isPrint) {
    return <PhotoItemPrintView item={item} />;
  }
  return <PhotoItemEditView item={item} sectionId={sectionId} />;
};

export default PhotoItem;
