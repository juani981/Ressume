import { createContext, useState, useEffect, useContext } from 'react';
import { defaultSchema } from '../utils/schema';
import defaultContent from '../../assets/data/content.json';
import { applyDictionaryToCVState, extractDictionaryFromCV } from '../utils/translationEngine';

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
          items: sec.items.map(item => {
            if (item.id !== itemId) return item;
            return { ...item, [key]: value };
          })
        };
      })
    }));
  };

  const reorderSectionItems = (sectionId, newItems) => {
    setCvData(prev => ({
      ...prev,
      sections: prev.sections.map(sec => 
        sec.id === sectionId ? { ...sec, items: newItems } : sec
      )
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
      updateProfile,
      updateLayout,
      updateSectionColumn,
      updateSectionTitle,
      updateSectionItem,
      reorderSections,
      reorderSectionItems,
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
