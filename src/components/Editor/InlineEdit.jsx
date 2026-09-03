import React, { useState, useEffect, useRef } from 'react';
import { useCV } from '../../context/CVContext';

const InlineEdit = ({ value, onSave, multiline = false, className = '', placeholder }) => {
  const cvContext = useCV();
  const activeLanguage = cvContext?.activeLanguage || 'es';
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const inputRef = useRef(null);

  const defaultPlaceholder = activeLanguage === 'en'
    ? (multiline ? 'Click to edit text...' : 'Click to edit...')
    : (multiline ? 'Haz clic para escribir texto...' : 'Haz clic para editar...');

  const finalPlaceholder = placeholder || defaultPlaceholder;

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (currentValue !== value) {
      onSave(currentValue);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !multiline) {
      handleBlur();
    } else if (e.key === 'Escape') {
      setCurrentValue(value);
      setIsEditing(false);
    }
  };

  useEffect(() => {
    if (isEditing && inputRef.current && multiline) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [currentValue, isEditing, multiline]);

  const commonProps = {
    ref: inputRef,
    value: currentValue,
    onChange: (e) => setCurrentValue(e.target.value),
    onBlur: handleBlur,
    onKeyDown: handleKeyDown,
    lang: activeLanguage || 'es',
    spellCheck: true,
    placeholder: finalPlaceholder,
    className: `inline-input ${className}`
  };

  if (isEditing) {
    return multiline ? (
      <textarea {...commonProps} style={{ resize: 'none', overflow: 'hidden', width: '100%', minHeight: '1.5em' }} />
    ) : (
      <input type="text" {...commonProps} />
    );
  }

  return (
    <span 
      onClick={() => setIsEditing(true)} 
      className={className} 
      style={{ cursor: 'pointer', display: 'inline-block', minWidth: '20px', minHeight: '1em' }}
    >
      {value || finalPlaceholder}
    </span>
  );
};

export default InlineEdit;
