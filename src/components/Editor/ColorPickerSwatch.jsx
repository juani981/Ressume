import React, { useState, useEffect, useRef } from 'react';

/**
 * ColorPickerSwatch
 * 
 * Elegant circular color swatch with real-time synchronized HEX input.
 * - Circular preview swatch that dynamically reflects color and opens picker on click.
 * - Synchronized text input allowing direct typing of hex codes with instant validation.
 * - Preset quick palette buttons for frictionless styling.
 */
const ColorPickerSwatch = ({ 
  label, 
  value = '#ffffff', 
  onChange, 
  ariaLabel, 
  presets = ['#ffffff', '#fafafa', '#f1f5f9', '#e2e8f0', '#1e293b', '#0f172a'] 
}) => {
  const [hexInput, setHexInput] = useState(value);
  const colorInputRef = useRef(null);

  useEffect(() => {
    setHexInput(value);
  }, [value]);

  const isValidHex = (hex) => {
    return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex);
  };

  const handleInputChange = (e) => {
    let raw = e.target.value.trim();
    if (!raw.startsWith('#') && raw.length > 0) {
      raw = '#' + raw;
    }
    setHexInput(raw);

    if (isValidHex(raw)) {
      onChange(raw.toLowerCase());
    }
  };

  const handleInputBlur = () => {
    if (!isValidHex(hexInput)) {
      setHexInput(value);
    }
  };

  const handleCircleClick = () => {
    if (colorInputRef.current) {
      colorInputRef.current.click();
    }
  };

  return (
    <div className="color-picker-swatch-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-color, #334155)' }}>
          {label}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Synchronized HEX input field */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              border: '1px solid rgba(0, 0, 0, 0.12)', 
              borderRadius: '6px', 
              padding: '2px 6px',
              backgroundColor: 'var(--container-color, #ffffff)',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)'
            }}
          >
            <input
              type="text"
              value={hexInput}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              maxLength={7}
              placeholder="#FFFFFF"
              aria-label={ariaLabel || label}
              style={{
                border: 'none',
                outline: 'none',
                fontFamily: 'monospace',
                fontSize: '0.78rem',
                fontWeight: 600,
                width: '68px',
                color: 'var(--text-color, #1e293b)',
                textTransform: 'uppercase',
                background: 'transparent'
              }}
            />
          </div>

          {/* Interactive Circular Preview Swatch */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handleCircleClick}
              title={`Seleccionar color para ${label}`}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: value,
                border: '2px solid #ffffff',
                boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.18), 0 2px 5px rgba(0, 0, 0, 0.15)',
                cursor: 'pointer',
                padding: 0,
                transition: 'transform 0.15s ease, box-shadow 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            />
            {/* Hidden native input synchronized with circular button */}
            <input
              ref={colorInputRef}
              type="color"
              value={value.startsWith('#') && (value.length === 7 || value.length === 4) ? value : '#ffffff'}
              onChange={(e) => {
                const newColor = e.target.value;
                setHexInput(newColor);
                onChange(newColor);
              }}
              style={{
                position: 'absolute',
                opacity: 0,
                pointerEvents: 'none',
                width: 0,
                height: 0
              }}
              tabIndex={-1}
              aria-hidden="true"
            />
          </div>
        </div>
      </div>

      {/* Preset palette pills */}
      {presets && presets.length > 0 && (
        <div style={{ display: 'flex', gap: '5px', alignItems: 'center', flexWrap: 'wrap' }}>
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setHexInput(preset);
                onChange(preset);
              }}
              title={preset}
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                backgroundColor: preset,
                border: preset.toLowerCase() === value.toLowerCase() ? '2px solid #3874ff' : '1px solid rgba(0,0,0,0.15)',
                cursor: 'pointer',
                padding: 0,
                boxShadow: preset.toLowerCase() === value.toLowerCase() ? '0 0 0 1px #3874ff' : 'none',
                transition: 'transform 0.1s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.15)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ColorPickerSwatch;
