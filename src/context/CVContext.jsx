import { createContext, useState, useEffect, useContext } from 'react';
import { defaultSchema } from '../utils/schema';
import defaultContent from '../../assets/data/content.json';
import { applyDictionaryToCVState, extractDictionaryFromCV } from '../utils/translationEngine';
import { adaptItemToSectionType, createDefaultItemForSection, createDefaultSection } from '../utils/itemAdapter';

const CVContext = createContext();

export const useCV = () => useContext(CVContext);

export const CVProvider = ({ children }) => {
  // Load saved cvData or fallback to defaultSchema
  const [cvData, setCvData] = useState(() => {
    const saved = localStorage.getItem('cvData');
    return saved ? JSON.parse(saved) : defaultSchema;
  });

  // Load language packs (defaults to content.json + saved custom slots)
  const [languagePacks, setLanguagePacks] = useState(() => {
    const savedPacks = localStorage.getItem('cvLanguagePacks');
    if (savedPacks) {
      try {
        return { ...defaultContent, ...JSON.parse(savedPacks) };
      } catch (e) {
        console.error('Error parsing cvLanguagePacks', e);
      }
    }
    return defaultContent;
  });

  const [activeLanguage, setActiveLanguage] = useState(() => {
    return localStorage.getItem('cvActiveLanguage') || 'es';
  });

  // Persistence
  useEffect(() => {
    localStorage.setItem('cvData', JSON.stringify(cvData));
  }, [cvData]);

  useEffect(() => {
    localStorage.setItem('cvLanguagePacks', JSON.stringify(languagePacks));
  }, [languagePacks]);

  useEffect(() => {
    localStorage.setItem('cvActiveLanguage', activeLanguage);
  }, [activeLanguage]);

  // Layout updates
  const updateLayout = (key, value) => {
    setCvData(prev => ({
      ...prev,
      layout: { ...(prev.layout || defaultSchema.layout), [key]: value }
    }));
  };

  const updateSectionColumn = (sectionId, newColumn) => {
    setCvData(prev => ({
      ...prev,
      sections: prev.sections.map(sec => 
        sec.id === sectionId ? { ...sec, column: newColumn } : sec
      )
    }));
  };

  const updateProfile = (key, value) => {
    setCvData(prev => ({
      ...prev,
      profile: { ...prev.profile, [key]: value }
    }));
  };

  const updateSectionItem = (sectionId, itemId, key, value) => {
    setCvData(prev => ({
      ...prev,
      sections: prev.sections.map(sec => {
        if (sec.id !== sectionId) return sec;
        return {
          ...sec,
          items: (sec.items || []).map(item => {
            if (item.id !== itemId) return item;
            return { ...item, [key]: value };
          })
        };
      })
    }));
  };

  // Add a new generic item to any section
  const addSectionItem = (sectionId) => {
    setCvData(prev => ({
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
    setCvData(prev => ({
      ...prev,
      sections: prev.sections.map(sec => {
        if (sec.id !== sectionId) return sec;
        return {
          ...sec,
          items: (sec.items || []).filter(item => item.id !== itemId)
        };
      })
    }));
  };

  // Reorder items within the same section
  const reorderSectionItems = (sectionId, newItems) => {
    setCvData(prev => ({
      ...prev,
      sections: prev.sections.map(sec => 
        sec.id === sectionId ? { ...sec, items: newItems } : sec
      )
    }));
  };

  // Move and adapt an item between sections (polymorphic cross-container drag & drop)
  const moveItemBetweenSections = (activeItemId, overItemId, activeSectionId, overSectionId) => {
    setCvData(prev => {
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
  const addSection = (column = 'right', type = 'list', title = 'NUEVA SECCIÓN') => {
    const newSec = createDefaultSection(column, type, title);
    setCvData(prev => ({
      ...prev,
      sections: [...prev.sections, newSec]
    }));
  };

  // Delete an entire section container
  const deleteSection = (sectionId) => {
    // Protect profile header from being completely removed
    if (sectionId === 'profile_header') return;
    setCvData(prev => ({
      ...prev,
      sections: prev.sections.filter(sec => sec.id !== sectionId)
    }));
  };

  const reorderSections = (newSections) => {
    setCvData(prev => ({ ...prev, sections: newSections }));
  };
  
  const updateSectionTitle = (sectionId, title) => {
    setCvData(prev => ({
      ...prev,
      sections: prev.sections.map(sec => 
        sec.id === sectionId ? { ...sec, title } : sec
      )
    }));
  };

  // Language management
  const switchLanguage = (langCode) => {
    if (languagePacks[langCode] && Object.keys(languagePacks[langCode]).length > 0) {
      setCvData(prev => applyDictionaryToCVState(prev, languagePacks[langCode]));
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
      setCvData(prev => applyDictionaryToCVState(prev, dictionary));
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
      addSection,
      deleteSection,
      reorderSections,
      updateSectionTitle,
      languagePacks,
      activeLanguage,
      switchLanguage,
      importLanguagePack,
      getActiveDictionary
    }}>
      {children}
    </CVContext.Provider>
  );
};
