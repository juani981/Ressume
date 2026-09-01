import { createContext, useState, useEffect, useContext } from 'react';
import { defaultSchema } from '../utils/schema';

const CVContext = createContext();

export const useCV = () => useContext(CVContext);

export const CVProvider = ({ children }) => {
  const [cvData, setCvData] = useState(() => {
    const saved = localStorage.getItem('cvData');
    return saved ? JSON.parse(saved) : defaultSchema;
  });

  useEffect(() => {
    localStorage.setItem('cvData', JSON.stringify(cvData));
  }, [cvData]);

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
  }

  return (
    <CVContext.Provider value={{
      cvData,
      updateProfile,
      updateLayout,
      updateSectionColumn,
      updateSectionTitle,
      updateSectionItem,
      reorderSections,
      reorderSectionItems
    }}>
      {children}
    </CVContext.Provider>
  );
};
