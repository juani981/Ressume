import React, { useState, useEffect, useRef } from 'react';

const InlineEdit = ({ value, onSave, multiline = false, className = '' }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const inputRef = useRef(null);

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
      {value || (multiline ? 'Click to edit text...' : 'Click to edit...')}
    </span>
  );
};

export default InlineEdit;
