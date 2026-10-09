import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useCV } from '../../context/CVContext';
import { 
  extractAlignment, 
  stripOuterAlignment, 
  applyAlignment, 
  sanitizeRichHTML, 
  renderRichHTML,
  normalizeHtmlEntities,
  hasMalformedEntities 
} from '../../utils/richTextEngine';
import RichTextToolbar from './RichTextToolbar';
import { usePrintMode } from '../../context/PrintModeContext';

/**
 * Enhanced InlineEdit component
 * - In-place rich-text contentEditable with full backward compatibility
 * - Supports bold (Ctrl+B), italic (Ctrl+I), undo (Ctrl+Z), redo (Ctrl+Shift+Z / Ctrl+Y)
 * - Text alignment persistence (left, center, right, justify)
 * - Connects to global singleton RichTextToolbar (and provides fallback if unmounted)
 */

// Caret position measurement and restoration for live contentEditable sanitization
const getCaretCharacterOffset = (element) => {
  if (typeof window === 'undefined' || !window.getSelection) return 0;
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return 0;

  const range = sel.getRangeAt(0);
  const preCaretRange = range.cloneRange();
  preCaretRange.selectNodeContents(element);
  preCaretRange.setEnd(range.endContainer, range.endOffset);
  return preCaretRange.toString().length;
};

const setCaretCharacterOffset = (element, offset) => {
  if (typeof window === 'undefined' || !window.getSelection) return;
  const sel = window.getSelection();
  if (!sel) return;

  const range = document.createRange();
  range.selectNodeContents(element);

  let currentOffset = 0;
  let found = false;

  const traverse = (node) => {
    if (found) return;
    if (node.nodeType === 3 /* Node.TEXT_NODE */) {
      const nextOffset = currentOffset + node.length;
      if (offset >= currentOffset && offset <= nextOffset) {
        range.setStart(node, offset - currentOffset);
        range.collapse(true);
        found = true;
        return;
      }
      currentOffset = nextOffset;
    } else {
      for (let i = 0; i < node.childNodes.length; i++) {
        traverse(node.childNodes[i]);
        if (found) return;
      }
    }
  };

  traverse(element);
  if (!found) {
    range.selectNodeContents(element);
    range.collapse(false);
  }

  sel.removeAllRanges();
  sel.addRange(range);
};

const InlineEditPrintView = ({ 
  value, 
  multiline = false, 
  className = '',
  display,
  style = {}
}) => {
  if (!value || String(value).trim() === '') {
    return null;
  }
  const parsed = stripOuterAlignment(value);
  const alignment = parsed.alignment || 'left';
  return (
    <span
      className={`inline-edit-display ${className}`}
      style={{
        display: display || (multiline ? 'block' : 'inline-block'),
        maxWidth: '100%',
        boxSizing: 'border-box',
        overflowWrap: 'break-word',
        wordBreak: 'break-word',
        textAlign: alignment,
        color: 'inherit',
        whiteSpace: multiline ? 'pre-wrap' : 'normal',
        ...style
      }}
      dangerouslySetInnerHTML={{ __html: renderRichHTML(value) }}
    />
  );
};

const InlineEditEditor = ({ 
  value, 
  onSave, 
  multiline = false, 
  className = '', 
  placeholder,
  display,
  style = {}
}) => {
  const cvContext = useCV();
  const activeLanguage = cvContext?.activeLanguage || 'es';

  const defaultPlaceholder = activeLanguage === 'en'
    ? (multiline ? 'Click to edit text...' : 'Click to edit...')
    : (multiline ? 'Haz clic para escribir texto...' : 'Haz clic para editar...');

  const finalPlaceholder = placeholder || defaultPlaceholder;

  const initialParsed = stripOuterAlignment(value);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAlignment, setCurrentAlignment] = useState(initialParsed.alignment || 'left');
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    align: initialParsed.alignment || 'left'
  });

  const contentRef = useRef(null);
  const initialValueRef = useRef(value);
  const isCancelingRef = useRef(false);
  const blurTimeoutRef = useRef(null);
  const historyRef = useRef({ past: [], future: [] });

  // Sync alignment from incoming props when not actively editing
  useEffect(() => {
    if (!isEditing) {
      const parsed = stripOuterAlignment(value);
      setCurrentAlignment(parsed.alignment || 'left');
      setActiveFormats(prev => ({ ...prev, align: parsed.alignment || 'left' }));
    }
  }, [value, isEditing]);

  const isBold = () => {
    if (typeof document !== 'undefined' && typeof document.queryCommandState === 'function') {
      try { return document.queryCommandState('bold'); } catch (e) {}
    }
    if (contentRef.current) {
      return /<b>|<strong>/i.test(contentRef.current.innerHTML);
    }
    return false;
  };

  const isItalic = () => {
    if (typeof document !== 'undefined' && typeof document.queryCommandState === 'function') {
      try { return document.queryCommandState('italic'); } catch (e) {}
    }
    if (contentRef.current) {
      return /<i>|<em>/i.test(contentRef.current.innerHTML);
    }
    return false;
  };

  const updateToolbar = useCallback((alignOverride) => {
    if (!contentRef.current) return;
    const align = alignOverride || currentAlignment;
    const formats = {
      bold: isBold(),
      italic: isItalic(),
      align: align || 'left'
    };
    setActiveFormats(formats);

    if (cvContext?.setActiveToolbar) {
      const rect = contentRef.current.getBoundingClientRect();
      cvContext.setActiveToolbar({
        activeElement: contentRef.current,
        onFormat: handleFormat,
        activeFormats: formats,
        visible: true,
        rect
      });
    }
  }, [currentAlignment, cvContext]);

  const toggleTagFallback = (tag) => {
    if (!contentRef.current) return;
    const sel = typeof window !== 'undefined' && window.getSelection ? window.getSelection() : null;
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      const range = sel.getRangeAt(0);
      let parent = range.commonAncestorContainer;
      if (parent.nodeType === 3) parent = parent.parentNode;
      const matchingAncestor = parent.closest ? parent.closest(tag) : null;
      if (matchingAncestor && contentRef.current.contains(matchingAncestor)) {
        // Unwrap tag
        const parentNode = matchingAncestor.parentNode;
        while (matchingAncestor.firstChild) {
          parentNode.insertBefore(matchingAncestor.firstChild, matchingAncestor);
        }
        parentNode.removeChild(matchingAncestor);
      } else {
        const wrapper = document.createElement(tag);
        try {
          range.surroundContents(wrapper);
        } catch (e) {
          wrapper.appendChild(range.extractContents());
          range.insertNode(wrapper);
        }
      }
    } else {
      // Toggle on entire innerHTML
      const currentHTML = contentRef.current.innerHTML;
      const tagRegex = new RegExp(`^<${tag}>([\\s\\S]*)</${tag}>$`, 'i');
      if (tagRegex.test(currentHTML.trim())) {
        contentRef.current.innerHTML = currentHTML.trim().replace(tagRegex, '$1');
      } else {
        contentRef.current.innerHTML = `<${tag}>${currentHTML}</${tag}>`;
      }
    }
  };

  const handleFormat = useCallback((command) => {
    if (!contentRef.current) return;

    if (command === 'bold') {
      let handled = false;
      if (typeof document !== 'undefined' && typeof document.execCommand === 'function') {
        try { handled = document.execCommand('bold', false, null); } catch (e) {}
      }
      if (!handled) {
        toggleTagFallback('b');
      }
      historyRef.current.past.push(contentRef.current.innerHTML);
      historyRef.current.future = [];
      updateToolbar();
      return;
    }

    if (command === 'italic') {
      let handled = false;
      if (typeof document !== 'undefined' && typeof document.execCommand === 'function') {
        try { handled = document.execCommand('italic', false, null); } catch (e) {}
      }
      if (!handled) {
        toggleTagFallback('i');
      }
      historyRef.current.past.push(contentRef.current.innerHTML);
      historyRef.current.future = [];
      updateToolbar();
      return;
    }

    if (command === 'justifyLeft') {
      setCurrentAlignment('left');
      if (contentRef.current) contentRef.current.style.textAlign = 'left';
      updateToolbar('left');
      return;
    }

    if (command === 'justifyCenter') {
      setCurrentAlignment('center');
      if (contentRef.current) contentRef.current.style.textAlign = 'center';
      updateToolbar('center');
      return;
    }

    if (command === 'justifyRight') {
      setCurrentAlignment('right');
      if (contentRef.current) contentRef.current.style.textAlign = 'right';
      updateToolbar('right');
      return;
    }

    if (command === 'justifyFull') {
      setCurrentAlignment('justify');
      if (contentRef.current) contentRef.current.style.textAlign = 'justify';
      updateToolbar('justify');
      return;
    }

    if (command === 'undo') {
      if (historyRef.current.past.length > 1) {
        const current = historyRef.current.past.pop();
        historyRef.current.future.unshift(current);
        const previous = historyRef.current.past[historyRef.current.past.length - 1];
        contentRef.current.innerHTML = previous;
        updateToolbar();
      } else if (typeof document !== 'undefined' && typeof document.execCommand === 'function') {
        try { document.execCommand('undo', false, null); } catch (e) {}
      }
      return;
    }

    if (command === 'redo') {
      if (historyRef.current.future.length > 0) {
        const next = historyRef.current.future.shift();
        historyRef.current.past.push(next);
        contentRef.current.innerHTML = next;
        updateToolbar();
      } else if (typeof document !== 'undefined' && typeof document.execCommand === 'function') {
        try { document.execCommand('redo', false, null); } catch (e) {}
      }
      return;
    }
  }, [updateToolbar]);

  // Keep ref updated
  const handleFormatRef = useRef(handleFormat);
  useEffect(() => {
    handleFormatRef.current = handleFormat;
  }, [handleFormat]);

  const handleStartEditing = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }
    initialValueRef.current = value;
    isCancelingRef.current = false;
    setIsEditing(true);
  };

  useEffect(() => {
    if (isEditing && contentRef.current) {
      const parsed = stripOuterAlignment(value);
      const cleanInner = sanitizeRichHTML(parsed.innerHtml || '');
      contentRef.current.innerHTML = cleanInner;
      contentRef.current.style.textAlign = parsed.alignment || 'left';
      setCurrentAlignment(parsed.alignment || 'left');

      historyRef.current = {
        past: [cleanInner],
        future: []
      };

      contentRef.current.focus();

      // Place caret at end
      if (typeof window !== 'undefined' && window.getSelection) {
        try {
          const sel = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(contentRef.current);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
        } catch (e) {}
      }

      updateToolbar(parsed.alignment || 'left');
    }
  }, [isEditing]);

  const handleInput = () => {
    if (!contentRef.current) return;
    let currentHTML = contentRef.current.innerHTML;

    // Live sanitization of malformed entities and unescaped symbols
    if (hasMalformedEntities(currentHTML)) {
      const caretOffset = getCaretCharacterOffset(contentRef.current);
      const textLenBefore = (contentRef.current.textContent || '').length;
      const cleanHtml = sanitizeRichHTML(currentHTML);
      if (cleanHtml !== currentHTML) {
        contentRef.current.innerHTML = cleanHtml;
        const textLenAfter = (contentRef.current.textContent || '').length;
        const diff = textLenBefore - textLenAfter;
        const targetOffset = Math.max(0, caretOffset - diff);
        setCaretCharacterOffset(contentRef.current, targetOffset);
        currentHTML = cleanHtml;
      }
    }

    // Push change to local history stack
    const last = historyRef.current.past[historyRef.current.past.length - 1];
    if (last !== currentHTML) {
      historyRef.current.past.push(currentHTML);
      historyRef.current.future = [];
    }
    updateToolbar();
  };

  const handleBlur = () => {
    blurTimeoutRef.current = setTimeout(() => {
      // Check if newly focused element is within toolbar
      if (
        typeof document !== 'undefined' && 
        document.activeElement && 
        document.activeElement.closest && 
        document.activeElement.closest('.rich-text-toolbar')
      ) {
        return;
      }

      setIsEditing(false);
      if (cvContext?.clearActiveToolbar) {
        cvContext.clearActiveToolbar();
      }

      if (isCancelingRef.current) {
        isCancelingRef.current = false;
        return;
      }

      if (!contentRef.current) return;

      const rawHtml = contentRef.current.innerHTML;
      const textContent = contentRef.current.textContent || '';
      let cleanInner = rawHtml;

      if (!textContent.trim() && !/<img|<svg/i.test(rawHtml)) {
        cleanInner = '';
      } else {
        cleanInner = sanitizeRichHTML(rawHtml);
      }

      const finalValue = cleanInner ? applyAlignment(cleanInner, currentAlignment) : '';
      if (finalValue !== value && typeof onSave === 'function') {
        onSave(finalValue);
      }
    }, 150);
  };

  const handleKeyDown = (e) => {
    const isMac = typeof navigator !== 'undefined' && navigator.platform?.toUpperCase().indexOf('MAC') >= 0;
    const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

    if (cmdOrCtrl) {
      const key = e.key.toLowerCase();
      if (key === 'b') {
        e.preventDefault();
        handleFormat('bold');
        return;
      }
      if (key === 'i') {
        e.preventDefault();
        handleFormat('italic');
        return;
      }
      if (key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleFormat('redo');
        } else {
          handleFormat('undo');
        }
        return;
      }
      if (key === 'y') {
        e.preventDefault();
        handleFormat('redo');
        return;
      }
    }

    if (e.key === 'Enter') {
      if (!multiline && !e.shiftKey) {
        e.preventDefault();
        contentRef.current?.blur();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      isCancelingRef.current = true;
      const parsed = stripOuterAlignment(initialValueRef.current);
      if (contentRef.current) {
        contentRef.current.innerHTML = sanitizeRichHTML(parsed.innerHtml || '');
        contentRef.current.style.textAlign = parsed.alignment || 'left';
      }
      setCurrentAlignment(parsed.alignment || 'left');
      contentRef.current?.blur();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const rawText = e.clipboardData ? e.clipboardData.getData('text/plain') : '';
    if (rawText) {
      const text = normalizeHtmlEntities(rawText);
      if (typeof document !== 'undefined' && typeof document.execCommand === 'function') {
        try {
          if (document.execCommand('insertText', false, text)) {
            handleInput();
            return;
          }
        } catch (err) {}
      }
      const sel = typeof window !== 'undefined' && window.getSelection ? window.getSelection() : null;
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(text));
        range.collapse(false);
      } else if (contentRef.current) {
        contentRef.current.innerText += text;
      }
      handleInput();
    }
  };

  if (isEditing) {
    return (
      <>
        <div
          ref={contentRef}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline={multiline}
          tabIndex={0}
          data-placeholder={finalPlaceholder}
          className={`inline-input inline-edit-active ${className}`}
          style={{
            outline: '2px solid rgba(56, 116, 255, 0.4)',
            outlineOffset: '2px',
            borderRadius: '3px',
            minWidth: '20px',
            maxWidth: '100%',
            boxSizing: 'border-box',
            minHeight: '1.5em',
            display: multiline ? 'block' : 'inline-block',
            width: multiline ? '100%' : 'auto',
            textAlign: currentAlignment,
            cursor: 'text',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            whiteSpace: multiline ? 'pre-wrap' : 'normal',
            color: 'inherit'
          }}
          onInput={handleInput}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onKeyUp={() => updateToolbar()}
          onMouseUp={() => updateToolbar()}
          onPaste={handlePaste}
        />

        <RichTextToolbar
          activeElement={contentRef.current}
          onFormat={handleFormat}
          activeFormats={activeFormats}
          visible={isEditing}
        />
      </>
    );
  }

  const hasValue = Boolean(value && String(value).trim() !== '');
  const displayHtml = hasValue 
    ? renderRichHTML(value) 
    : `<span class="inline-edit-placeholder" style="color: var(--text-color-light, #94a3b8); font-style: italic; opacity: 0.7;">${finalPlaceholder}</span>`;

  return (
    <span
      onClick={handleStartEditing}
      onFocus={handleStartEditing}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleStartEditing();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={!hasValue ? finalPlaceholder : undefined}
      className={`inline-edit-display ${className}`}
      data-testid="inline-edit-display"
      data-is-empty={!hasValue ? "true" : undefined}
      style={{
        cursor: 'pointer',
        display: display || (multiline ? 'block' : 'inline-block'),
        minWidth: '20px',
        maxWidth: '100%',
        boxSizing: 'border-box',
        overflowWrap: 'break-word',
        wordBreak: 'break-word',
        minHeight: '1em',
        textAlign: currentAlignment,
        color: 'inherit',
        whiteSpace: multiline ? 'pre-wrap' : 'normal',
        ...style
      }}
      dangerouslySetInnerHTML={{ __html: displayHtml }}
    />
  );
};

const InlineEdit = (props) => {
  const contextIsPrint = usePrintMode();
  const effectiveIsPrint = props.isPrint ?? contextIsPrint;
  if (effectiveIsPrint) {
    return <InlineEditPrintView {...props} isPrint={true} />;
  }
  return <InlineEditEditor {...props} />;
};

export { InlineEditPrintView, InlineEditEditor };
export default InlineEdit;
