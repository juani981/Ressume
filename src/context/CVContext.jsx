import { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { defaultSchema } from '../utils/schema';
import { LOCALES } from '../locales/index';
import { applyDictionaryToCVState, extractDictionaryFromCV } from '../utils/translationEngine';
import { adaptItemToSectionType, createDefaultItemForSection, createDefaultSection } from '../utils/itemAdapter';
import { sanitizeAndValidateCVSnapshot } from '../utils/versionValidator';
import { normalizeItemContacts } from '../utils/contactTypes';

const CVContext = createContext();

export const useCV = () => useContext(CVContext);

export const CVProvider = ({ children }) => {
  // Base default language packs from folder structure
  const baseDefaultContent = {
    es: LOCALES.es.content,
    en: LOCALES.en.content
  };

  // Helper to ensure profile_header always exists with valid data
  const ensureProfileHeader = (data) => {
    if (!data || !Array.isArray(data.sections)) return defaultSchema;
    let sections = data.sections;
    const hasHeader = sections.some(s => s.id === 'profile_header' || s.type === 'profile_header');
    if (!hasHeader) {
      sections = [defaultSchema.sections[0], ...sections];
    }
    if (data.profile) {
      sections = sections.map(sec => {
        if (sec.id === 'profile_header' || sec.type === 'profile_header') {
          const firstItem = (sec.items && sec.items[0]) ? { ...sec.items[0] } : {};
          const mergedItem = {
            ...firstItem,
            ...(data.profile.name !== undefined ? { name: data.profile.name } : {}),
            ...(data.profile.subtitle !== undefined ? { subtitle: data.profile.subtitle } : {}),
            ...(data.profile.location !== undefined ? { location: data.profile.location } : {}),
            ...(data.profile.email !== undefined ? { email: data.profile.email } : {}),
            ...(data.profile.phone !== undefined ? { phone: data.profile.phone } : {}),
            ...(data.profile.linkedin !== undefined ? { linkedin: data.profile.linkedin } : {}),
            ...(data.profile.github !== undefined ? { github: data.profile.github } : {}),
          };
          if (!mergedItem.contacts || !Array.isArray(mergedItem.contacts)) {
            mergedItem.contacts = normalizeItemContacts(mergedItem);
          }
          return { ...sec, items: [mergedItem, ...(sec.items ? sec.items.slice(1) : [])] };
        }
        return sec;
      });
    }
    return { ...data, sections };
  };

  // Load saved cvData or fallback to defaultSchema
  const [cvData, setCvData] = useState(() => {
    const saved = localStorage.getItem('cvData');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          const merged = {
            ...defaultSchema,
            ...parsed,
            layout: {
              ...defaultSchema.layout,
              ...(parsed.layout || {})
            }
          };
          return ensureProfileHeader(merged);
        }
      } catch (e) {
        console.error('Error parsing cvData from localStorage', e);
      }
    }
    return defaultSchema;
  });

  // Undo / Redo History Stacks
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);

  // Load language packs (defaults to locales folder + saved custom slots)
  const [languagePacks, setLanguagePacks] = useState(() => {
    const savedPacks = localStorage.getItem('cvLanguagePacks');
    if (savedPacks) {
      try {
        return { ...baseDefaultContent, ...JSON.parse(savedPacks) };
      } catch (e) {
        console.error('Error parsing cvLanguagePacks', e);
      }
    }
    return baseDefaultContent;
  });

  const [activeLanguage, setActiveLanguage] = useState(() => {
    return localStorage.getItem('cvActiveLanguage') || 'es';
  });

  // AI Suggestions Toggle State (enabled by default)
  const [showAITips, setShowAITips] = useState(() => {
    const saved = localStorage.getItem('cv_show_ai_tips');
    return saved !== 'false';
  });

  // Ephemeral toast notification state: { id, text, type } or null
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  const showToast = useCallback((text, type = 'info', duration = 2800) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    const newToast = { id: Date.now(), text, type };
    setToast(newToast);
    if (duration > 0) {
      toastTimeoutRef.current = setTimeout(() => {
        setToast(null);
      }, duration);
    }
  }, []);

  const hideToast = useCallback(() => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast(null);
  }, []);

  // Active singleton tooltip state: { section, rect } or null
  const [activeTooltip, setActiveTooltip] = useState(null);
  const clearActiveTooltip = useCallback(() => {
    setActiveTooltip(null);
  }, []);
  const closeTooltip = clearActiveTooltip;

  const toggleTooltipForSection = useCallback((section, rect) => {
    setActiveTooltip(current => {
      if (current && current.section && current.section.id === section.id) {
        return null;
      }
      return { section, rect };
    });
  }, []);

  // Active singleton formatting toolbar state: { activeElement, onFormat, activeFormats, visible, rect } or null
  const [activeToolbar, setActiveToolbar] = useState(null);
  const clearActiveToolbar = useCallback(() => {
    setActiveToolbar(null);
  }, []);

  // Persistence
  useEffect(() => {
    localStorage.setItem('cvData', JSON.stringify(cvData));
  }, [cvData]);

  useEffect(() => {
    localStorage.setItem('cvLanguagePacks', JSON.stringify(languagePacks));
  }, [languagePacks]);

  useEffect(() => {
    localStorage.setItem('cvActiveLanguage', activeLanguage);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = activeLanguage || 'es';
    }
  }, [activeLanguage]);

  // Keep active language pack in sync with live user edits
  useEffect(() => {
    try {
      const currentDict = extractDictionaryFromCV(cvData);
      setLanguagePacks(prev => ({
        ...prev,
        [activeLanguage]: currentDict
      }));
    } catch (e) {
      console.warn('Error extracting dictionary on cvData update', e);
    }
  }, [cvData, activeLanguage]);

  // Push state to past history before applying update
  const applyStateWithHistory = useCallback((updater) => {
    setCvData(current => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      if (next === current || JSON.stringify(next) === JSON.stringify(current)) {
        return current;
      }
      setPast(prevPast => [...prevPast.slice(-29), current]);
      setFuture([]);
      return next;
    });
  }, []);

  // Undo action
  const undo = useCallback(() => {
    setPast(prevPast => {
      if (prevPast.length === 0) return prevPast;
      const previousState = prevPast[prevPast.length - 1];
      const newPast = prevPast.slice(0, -1);

      setCvData(current => {
        setFuture(prevFuture => [current, ...prevFuture]);
        return previousState;
      });

      return newPast;
    });
  }, []);

  // Redo action
  const redo = useCallback(() => {
    setFuture(prevFuture => {
      if (prevFuture.length === 0) return prevFuture;
      const nextState = prevFuture[0];
      const newFuture = prevFuture.slice(1);

      setCvData(current => {
        setPast(prevPast => [...prevPast, current]);
        return nextState;
      });

      return newFuture;
    });
  }, []);

  // Keyboard shortcut listener for Ctrl+Z and Ctrl+Y / Ctrl+Shift+Z
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMac = typeof navigator !== 'undefined' && navigator.platform?.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (!cmdOrCtrl) return;

      const isUndo = e.key.toLowerCase() === 'z' && !e.shiftKey;
      const isRedo = e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z');

      if (!isUndo && !isRedo) return;

      // Prevent global window Ctrl+Z/Y listener from hijacking text editing in editable fields
      const activeEl = typeof document !== 'undefined' ? document.activeElement : null;
      const targetEl = e.target;
      const isEditable = (el) => el && (
        el.isContentEditable ||
        el.getAttribute?.('contenteditable') === 'true' ||
        el.tagName === 'INPUT' ||
        el.tagName === 'TEXTAREA' ||
        el.classList?.contains('inline-edit-active')
      );

      if (isEditable(activeEl) || isEditable(targetEl)) {
        return;
      }

      if (isUndo && past.length > 0) {
        e.preventDefault();
        undo();
      } else if (isRedo && future.length > 0) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [past, future, undo, redo]);

  // Load a complete CV snapshot into state with history tracking and auto-save
  const loadVersionSnapshot = useCallback((snapshot, { clearHistory = false } = {}) => {
    const sanitized = sanitizeAndValidateCVSnapshot(snapshot);
    if (!sanitized) {
      throw new Error('Invalid snapshot structure');
    }
    if (clearHistory) {
      setPast([]);
      setFuture([]);
      setCvData(sanitized);
    } else {
      applyStateWithHistory(() => sanitized);
    }
    return sanitized;
  }, [applyStateWithHistory]);

  // Reset entire CV back to original placeholder state
  const resetToDefault = useCallback(() => {
    applyStateWithHistory(() => defaultSchema);
  }, [applyStateWithHistory]);

  // Restore the contact section if it was accidentally cleared or removed
  const restoreContactSection = useCallback(() => {
    applyStateWithHistory(prev => {
      const filtered = prev.sections.filter(s => s.id !== 'profile_header' && s.type !== 'profile_header');
      return {
        ...prev,
        sections: [defaultSchema.sections[0], ...filtered]
      };
    });
  }, [applyStateWithHistory]);

  // Layout updates (supports key/value or batch object)
  const updateLayout = (key, value) => {
    applyStateWithHistory(prev => {
      const prevLayout = prev.layout || defaultSchema.layout;
      const updates = typeof key === 'object' && key !== null ? key : { [key]: value };
      return {
        ...prev,
        layout: {
          ...defaultSchema.layout,
          ...prevLayout,
          ...updates
        }
      };
    });
  };

  const updateSectionColumn = (sectionId, newColumn) => {
    applyStateWithHistory(prev => ({
      ...prev,
      sections: prev.sections.map(sec => 
        sec.id === sectionId ? { ...sec, column: newColumn } : sec
      )
    }));
  };

  const updateProfile = (key, value) => {
    applyStateWithHistory(prev => ({
      ...prev,
      profile: { ...prev.profile, [key]: value }
    }));
  };

  const updateSectionItem = (sectionId, itemId, key, value) => {
    applyStateWithHistory(prev => ({
      ...prev,
      sections: prev.sections.map(sec => {
        if (sec.id !== sectionId) return sec;
        return {
          ...sec,
          items: (sec.items || []).map(item => {
            if (item.id !== itemId) return item;
            const updates = typeof key === 'object' && key !== null ? key : { [key]: value };
            return { ...item, ...updates };
          })
        };
      })
    }));
  };

  // Add a new generic item to any section
  const addSectionItem = (sectionId) => {
    applyStateWithHistory(prev => ({
      ...prev,
      sections: prev.sections.map(sec => {
        if (sec.id !== sectionId) return sec;
        const newItem = createDefaultItemForSection(sec.type);
        return {
          ...sec,
          items: [...(sec.items || []), newItem]
        };
      })
    }));
  };

  // Delete an item from any section
  const deleteSectionItem = (sectionId, itemId) => {
    applyStateWithHistory(prev => ({
      ...prev,
      sections: prev.sections.map(sec => {
        if (sec.id !== sectionId) return sec;
        // Never allow deleting the main contact item in profile_header
        if (sec.type === 'profile_header') return sec;
        return {
          ...sec,
          items: (sec.items || []).filter(item => item.id !== itemId)
        };
      })
    }));
  };

  // Reorder items within the same section
  const reorderSectionItems = (sectionId, newItems) => {
    applyStateWithHistory(prev => ({
      ...prev,
      sections: prev.sections.map(sec => 
        sec.id === sectionId ? { ...sec, items: newItems } : sec
      )
    }));
  };

  // Move and adapt an item between sections (polymorphic cross-container drag & drop)
  const moveItemBetweenSections = (activeItemId, overItemId, activeSectionId, overSectionId) => {
    applyStateWithHistory(prev => {
      const sourceSec = prev.sections.find(s => s.id === activeSectionId);
      const targetSec = prev.sections.find(s => s.id === overSectionId);

      if (!sourceSec || !targetSec) return prev;

      const sourceItem = (sourceSec.items || []).find(i => i.id === activeItemId);
      if (!sourceItem) return prev;

      // Same section reorder
      if (activeSectionId === overSectionId) {
        const oldIndex = sourceSec.items.findIndex(i => i.id === activeItemId);
        let newIndex = sourceSec.items.findIndex(i => i.id === overItemId);
        if (newIndex === -1) newIndex = sourceSec.items.length - 1;

        const updatedItems = [...sourceSec.items];
        const [moved] = updatedItems.splice(oldIndex, 1);
        updatedItems.splice(newIndex, 0, moved);

        return {
          ...prev,
          sections: prev.sections.map(s => s.id === activeSectionId ? { ...s, items: updatedItems } : s)
        };
      }

      // Cross-section movement: adapt item to target section type
      const adaptedItem = adaptItemToSectionType(sourceItem, targetSec.type);
      const newSourceItems = sourceSec.items.filter(i => i.id !== activeItemId);
      
      const newTargetItems = [...(targetSec.items || [])];
      let insertIndex = newTargetItems.findIndex(i => i.id === overItemId);
      if (insertIndex === -1) {
        newTargetItems.push(adaptedItem);
      } else {
        newTargetItems.splice(insertIndex, 0, adaptedItem);
      }

      return {
        ...prev,
        sections: prev.sections.map(sec => {
          if (sec.id === activeSectionId) return { ...sec, items: newSourceItems };
          if (sec.id === overSectionId) return { ...sec, items: newTargetItems };
          return sec;
        })
      };
    });
  };

  // Add a brand new section container
  const addSection = (column = 'right', type = 'list', title = 'NUEVA SECCIÓN', bulletStyle = undefined) => {
    const newSec = createDefaultSection(column, type, title, bulletStyle);
    applyStateWithHistory(prev => ({
      ...prev,
      sections: [...prev.sections, newSec]
    }));
  };

  // Delete an entire section container
  const deleteSection = (sectionId) => {
    // Protect profile header from being removed
    if (sectionId === 'profile_header') return;
    applyStateWithHistory(prev => {
      const targetSec = prev.sections.find(sec => sec.id === sectionId);
      if (targetSec && (targetSec.id === 'profile_header' || targetSec.type === 'profile_header')) return prev;
      return {
        ...prev,
        sections: prev.sections.filter(sec => sec.id !== sectionId && sec.id !== 'profile_header' && sec.type !== 'profile_header')
      };
    });
  };

  const moveSectionToColumnAndIndex = (activeSectionId, targetColumn, overSectionId = null) => {
    applyStateWithHistory(prev => {
      const activeSec = prev.sections.find(s => s.id === activeSectionId);
      if (!activeSec) return prev;

      // Update column
      const updatedSec = { ...activeSec, column: targetColumn };
      const remainingSections = prev.sections.filter(s => s.id !== activeSectionId);

      let insertIndex = -1;
      if (overSectionId && overSectionId !== activeSectionId) {
        insertIndex = remainingSections.findIndex(s => s.id === overSectionId);
      }

      if (insertIndex === -1) {
        // If no specific overSection, append at the end of that column's sections
        const lastColIndex = remainingSections.reduce((lastIdx, s, idx) => s.column === targetColumn ? idx : lastIdx, -1);
        if (lastColIndex !== -1) {
          insertIndex = lastColIndex + 1;
        } else {
          insertIndex = remainingSections.length;
        }
      }

      const newSections = [...remainingSections];
      newSections.splice(insertIndex, 0, updatedSec);

      return {
        ...prev,
        sections: newSections
      };
    });
  };

  const reorderSections = (newSections) => {
    applyStateWithHistory(prev => ({ ...prev, sections: newSections }));
  };
  
  const updateSectionTitle = (sectionId, title) => {
    applyStateWithHistory(prev => ({
      ...prev,
      sections: prev.sections.map(sec => 
        sec.id === sectionId ? { ...sec, title } : sec
      )
    }));
  };

  const updateSectionBulletStyle = (sectionId, bulletStyle) => {
    applyStateWithHistory(prev => ({
      ...prev,
      sections: prev.sections.map(sec => 
        sec.id === sectionId 
          ? { ...sec, bulletStyle: { ...(sec.bulletStyle || {}), ...bulletStyle } }
          : sec
      )
    }));
  };

  // Language management
  const switchLanguage = (langCode) => {
    if (languagePacks[langCode] && Object.keys(languagePacks[langCode]).length > 0) {
      applyStateWithHistory(prev => applyDictionaryToCVState(prev, languagePacks[langCode]));
      setActiveLanguage(langCode);
      return true;
    }
    return false;
  };

  const importLanguagePack = (langCode, dictionary, applyImmediately = true) => {
    setLanguagePacks(prev => ({
      ...prev,
      [langCode]: dictionary
    }));

    if (applyImmediately) {
      applyStateWithHistory(prev => applyDictionaryToCVState(prev, dictionary));
      setActiveLanguage(langCode);
    }
  };

  const getActiveDictionary = () => {
    if (languagePacks[activeLanguage] && Object.keys(languagePacks[activeLanguage]).length > 0) {
      return languagePacks[activeLanguage];
    }
    return extractDictionaryFromCV(cvData);
  };

  return (
    <CVContext.Provider value={{
      cvData,
      updateLayout,
      updateSectionColumn,
      updateProfile,
      updateSectionItem,
      addSectionItem,
      deleteSectionItem,
      reorderSectionItems,
      moveItemBetweenSections,
      moveSectionToColumnAndIndex,
      addSection,
      deleteSection,
      reorderSections,
      updateSectionTitle,
      updateSectionBulletStyle,
      languagePacks,
      activeLanguage,
      switchLanguage,
      importLanguagePack,
      getActiveDictionary,
      undo,
      redo,
      canUndo: past.length > 0,
      canRedo: future.length > 0,
      loadVersionSnapshot,
      resetToDefault,
      restoreContactSection,
      activeTooltip,
      setActiveTooltip,
      clearActiveTooltip,
      closeTooltip,
      toggleTooltipForSection,
      activeToolbar,
      setActiveToolbar,
      clearActiveToolbar,
      showAITips,
      toast,
      showToast,
      hideToast
    }}>
      {children}
    </CVContext.Provider>
  );
};

export default CVContext;
