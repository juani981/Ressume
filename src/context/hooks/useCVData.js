/**
 * @file useCVData.js
 * @description Hook managing CV document data schema, profile/section/item CRUD,
 * auto-repair validation, localStorage persistence, and multi-language translation.
 */
import { useState, useEffect, useCallback } from 'react';
import { defaultSchema } from '../../utils/schema';
import { LOCALES } from '../../locales/index';
import { applyDictionaryToCVState, extractDictionaryFromCV } from '../../utils/translationEngine';
import { adaptItemToSectionType, createDefaultItemForSection, createDefaultSection } from '../../utils/itemAdapter';
import { sanitizeAndValidateCVSnapshot } from '../../utils/versionValidator';
import { normalizeItemContacts, syncFlatContactFields } from '../../utils/contactTypes';
import { deletePageFromDOMAndState } from '../../utils/pageDeletionEngine';

/** Default language dictionaries from locales */
export const baseDefaultContent = { es: LOCALES.es.content, en: LOCALES.en.content };

/**
 * Normalizes CV schema to guarantee profile_header section exists and syncs legacy fields.
 * Automatically detaches contact info into a standalone 'contact' section if bundled inside 'profile_header'.
 * @param {Object} data - Raw CV document state.
 * @returns {Object} Normalized CV document state.
 */
export const ensureProfileHeader = (data) => {
  if (!data || !Array.isArray(data.sections)) return defaultSchema;
  let sections = [...data.sections];

  // 1. Ensure profile_header or title_subtitle section exists
  const hasProfileHeader = sections.some(s => s.id === 'profile_header' || s.type === 'profile_header' || s.type === 'title_subtitle');
  if (!hasProfileHeader) {
    sections = [defaultSchema.sections[0], ...sections];
  }

  // 2. Detach Contact section if bundled inside profile_header or missing
  const profSecIndex = sections.findIndex(s => s.id === 'profile_header' || s.type === 'profile_header');
  const hasContactSection = sections.some(s => s.id === 'contact' || s.type === 'contact');
  
  if (!hasContactSection && profSecIndex !== -1) {
    const profSec = sections[profSecIndex];
    const profItem = profSec?.items?.[0] || {};
    const extractedContacts = (Array.isArray(profItem.contacts) && profItem.contacts.length > 0)
      ? profItem.contacts
      : normalizeItemContacts(profItem);

    const contactSection = {
      id: 'contact',
      type: 'contact',
      column: profSec.column || 'left',
      title: '',
      items: [
        {
          id: 'contact1',
          contacts: extractedContacts.length > 0 ? extractedContacts : [
            { id: 'c_loc', type: 'location', value: 'Ciudad, País' },
            { id: 'c_email', type: 'email', value: 'tuemail@ejemplo.com' },
            { id: 'c_phone', type: 'phone', value: '+00 123 456 789' },
            { id: 'c_linkedin', type: 'linkedin', value: 'linkedin.com/in/tu-perfil' },
            { id: 'c_github', type: 'github', value: 'github.com/tu-usuario' }
          ],
          ...syncFlatContactFields(extractedContacts)
        }
      ]
    };
    sections.splice(profSecIndex + 1, 0, contactSection);
  }

  // 3. Guarantee profile_header only retains candidate name & subtitle (no bundled contacts)
  sections = sections.map(sec => {
    if (sec.id === 'profile_header' || sec.type === 'profile_header') {
      const cleanItems = (sec.items || []).map(item => {
        const { contacts, email, phone, location, linkedin, github, ...rest } = item;
        return rest;
      });
      return { ...sec, items: cleanItems };
    }
    return sec;
  });

  // 4. Synchronize profile object if present
  if (data.profile) {
    sections = sections.map(sec => {
      if (sec.id !== 'profile_header' && sec.type !== 'profile_header' && sec.id !== 'contact' && sec.type !== 'contact') return sec;
      const mergedItem = { ...(sec.items?.[0] || {}) };
      if (sec.id === 'profile_header' || sec.type === 'profile_header') {
        ['name', 'subtitle'].forEach(f => {
          if (data.profile[f] !== undefined) mergedItem[f] = data.profile[f];
        });
      } else {
        ['location', 'email', 'phone', 'linkedin', 'github'].forEach(f => {
          if (data.profile[f] !== undefined) mergedItem[f] = data.profile[f];
        });
        if (!Array.isArray(mergedItem.contacts)) mergedItem.contacts = normalizeItemContacts(mergedItem);
      }
      return { ...sec, items: [mergedItem, ...(sec.items ? sec.items.slice(1) : [])] };
    });
  }
  return { ...data, sections };
};

/**
 * Loads initial CV data from localStorage with fallback to defaultSchema.
 * @returns {Object} Initialized CV state.
 */
export const loadInitialCVData = () => {
  if (typeof window === 'undefined') return defaultSchema;
  try {
    const parsed = JSON.parse(localStorage.getItem('cvData') || '');
    if (parsed && typeof parsed === 'object') {
      return ensureProfileHeader({ ...defaultSchema, ...parsed, layout: { ...defaultSchema.layout, ...(parsed.layout || {}) } });
    }
  } catch (_) {}
  return defaultSchema;
};

/**
 * Hook managing CV document data, items, sections, and i18n dictionaries.
 * @param {Object} [options] - Configuration options.
 * @returns {Object} CV data state and mutation handlers.
 */
export const useCVData = ({
  cvData: externalCvData,
  setCvData: externalSetCvData,
  applyStateWithHistory: externalApplyState,
  clearHistory: externalClearHistory
} = {}) => {
  const [internalCvData, setInternalCvData] = useState(loadInitialCVData);
  const cvData = externalCvData !== undefined ? externalCvData : internalCvData;
  const setCvData = externalSetCvData || setInternalCvData;
  const applyStateWithHistory = externalApplyState || setCvData;

  const [languagePacks, setLanguagePacks] = useState(() => {
    if (typeof window === 'undefined') return baseDefaultContent;
    try { return { ...baseDefaultContent, ...JSON.parse(localStorage.getItem('cvLanguagePacks') || '') }; }
    catch (_) { return baseDefaultContent; }
  });

  const [activeLanguage, setActiveLanguage] = useState(() => (
    typeof window === 'undefined' ? 'es' : (localStorage.getItem('cvActiveLanguage') || 'es')
  ));

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('cvData', JSON.stringify(cvData));
  }, [cvData]);
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('cvLanguagePacks', JSON.stringify(languagePacks));
  }, [languagePacks]);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('cvActiveLanguage', activeLanguage);
    if (typeof document !== 'undefined') document.documentElement.lang = activeLanguage || 'es';
  }, [activeLanguage]);
  useEffect(() => {
    try { setLanguagePacks(prev => ({ ...prev, [activeLanguage]: extractDictionaryFromCV(cvData) })); }
    catch (e) { console.warn('Error extracting dictionary on cvData update', e); }
  }, [cvData, activeLanguage]);

  /**
   * Updates cvData.profile AND propagates the change into the corresponding
   * section item (profile_header / title_subtitle for name/subtitle,
   * contact for contact fields). Keeps both representations in sync so the
   * print engine never overwrites user-edited values with stale profile defaults.
   */
  const updateProfile = useCallback((key, value) => {
    applyStateWithHistory(prev => {
      const updatedProfile = { ...prev.profile, [key]: value };
      const titleKeys = ['name', 'subtitle'];
      const contactKeys = ['location', 'email', 'phone', 'linkedin', 'github'];

      const updatedSections = prev.sections.map(sec => {
        if ((sec.type === 'profile_header' || sec.type === 'title_subtitle') && titleKeys.includes(key)) {
          const firstItem = { ...(sec.items?.[0] || {}), [key]: value };
          return { ...sec, items: [firstItem, ...(sec.items?.slice(1) || [])] };
        }
        if (sec.type === 'contact' && contactKeys.includes(key)) {
          const firstItem = { ...(sec.items?.[0] || {}), [key]: value };
          const existingContacts = Array.isArray(firstItem.contacts) ? firstItem.contacts : [];
          const updatedContacts = existingContacts.map(c => c.type === key ? { ...c, value } : c);
          return { ...sec, items: [{ ...firstItem, contacts: updatedContacts }, ...(sec.items?.slice(1) || [])] };
        }
        return sec;
      });

      return { ...prev, profile: updatedProfile, sections: updatedSections };
    });
  }, [applyStateWithHistory]);
  const addSection = useCallback((column = 'right', type = 'list', title = 'NUEVA SECCIÓN', bulletStyle = undefined) => {
    applyStateWithHistory(prev => ({ ...prev, sections: [...prev.sections, createDefaultSection(column, type, title, bulletStyle)] }));
  }, [applyStateWithHistory]);
  const deleteSection = useCallback((sectionId) => {
    if (sectionId === 'profile_header') return;
    applyStateWithHistory(prev => {
      const target = prev.sections.find(s => s.id === sectionId);
      if (target && (target.id === 'profile_header' || target.type === 'profile_header')) return prev;
      return { ...prev, sections: prev.sections.filter(s => s.id !== sectionId) };
    });
  }, [applyStateWithHistory]);
  const reorderSections = useCallback((newSections) => {
    applyStateWithHistory(prev => ({ ...prev, sections: newSections }));
  }, [applyStateWithHistory]);
  const updateSectionTitle = useCallback((sectionId, title) => {
    applyStateWithHistory(prev => ({ ...prev, sections: prev.sections.map(s => s.id === sectionId ? { ...s, title } : s) }));
  }, [applyStateWithHistory]);
  const updateSectionBulletStyle = useCallback((sectionId, bulletStyle) => {
    applyStateWithHistory(prev => ({
      ...prev, sections: prev.sections.map(s => s.id === sectionId ? { ...s, bulletStyle: { ...(s.bulletStyle || {}), ...bulletStyle } } : s)
    }));
  }, [applyStateWithHistory]);

  const updateSectionProperty = useCallback((sectionId, key, value) => {
    applyStateWithHistory(prev => ({
      ...prev,
      sections: prev.sections.map(sec => {
        if (sec.id !== sectionId) return sec;
        const updates = typeof key === 'object' && key !== null ? key : { [key]: value };
        const updated = { ...sec, ...updates };
        if (sec.type === 'spacer' && ('height' in updates || 'backgroundColor' in updates) && updated.items?.length > 0) {
          updated.items = updated.items.map(item => ({
            ...item, ...('height' in updates ? { height: updates.height } : {}), ...('backgroundColor' in updates ? { backgroundColor: updates.backgroundColor } : {})
          }));
        }
        return updated;
      })
    }));
  }, [applyStateWithHistory]);

  const addSectionItem = useCallback((sectionId) => {
    applyStateWithHistory(prev => ({
      ...prev, sections: prev.sections.map(s => s.id === sectionId ? { ...s, items: [...(s.items || []), createDefaultItemForSection(s.type)] } : s)
    }));
  }, [applyStateWithHistory]);
  const deleteSectionItem = useCallback((sectionId, itemId) => {
    applyStateWithHistory(prev => ({
      ...prev, sections: prev.sections.map(s => s.id !== sectionId || s.type === 'profile_header' || s.type === 'title_subtitle' || s.type === 'contact' ? s : { ...s, items: (s.items || []).filter(i => i.id !== itemId) })
    }));
  }, [applyStateWithHistory]);
  /**
   * Updates a section item and, for profile_header/title_subtitle/contact sections,
   * also propagates the relevant fields back into cvData.profile so the print
   * engine always receives consistent data.
   */
  const updateSectionItem = useCallback((sectionId, itemId, key, value) => {
    applyStateWithHistory(prev => {
      const targetSec = prev.sections.find(s => s.id === sectionId);
      const isProfileSec = targetSec && (
        targetSec.type === 'profile_header' ||
        targetSec.type === 'title_subtitle' ||
        targetSec.type === 'contact'
      );

      const updatedSections = prev.sections.map(sec => sec.id !== sectionId ? sec : {
        ...sec, items: (sec.items || []).map(i => i.id === itemId
          ? { ...i, ...(typeof key === 'object' && key !== null ? key : { [key]: value }) }
          : i)
      });

      // Propagate back to profile if editing a header/contact section
      if (isProfileSec) {
        const updates = typeof key === 'object' && key !== null ? key : { [key]: value };
        const titleKeys = ['name', 'subtitle'];
        const contactKeys = ['location', 'email', 'phone', 'linkedin', 'github'];
        const profileUpdates = {};
        Object.entries(updates).forEach(([k, v]) => {
          if (targetSec.type !== 'contact' && titleKeys.includes(k)) profileUpdates[k] = v;
          if (targetSec.type === 'contact' && contactKeys.includes(k)) profileUpdates[k] = v;
        });
        if (Object.keys(profileUpdates).length > 0) {
          return {
            ...prev,
            sections: updatedSections,
            profile: { ...prev.profile, ...profileUpdates }
          };
        }
      }

      return { ...prev, sections: updatedSections };
    });
  }, [applyStateWithHistory]);
  const reorderSectionItems = useCallback((sectionId, newItems) => {
    applyStateWithHistory(prev => ({ ...prev, sections: prev.sections.map(s => s.id === sectionId ? { ...s, items: newItems } : s) }));
  }, [applyStateWithHistory]);

  const moveItemBetweenSections = useCallback((activeItemId, overItemId, activeSectionId, overSectionId, position = null) => {
    applyStateWithHistory(prev => {
      const sourceSec = prev.sections.find(s => s.id === activeSectionId);
      const targetSec = prev.sections.find(s => s.id === overSectionId);
      if (!sourceSec || !targetSec) return prev;
      const sourceItem = (sourceSec.items || []).find(i => i.id === activeItemId);
      if (!sourceItem) return prev;

      if (activeSectionId === overSectionId) {
        if (activeItemId === overItemId) return prev;

        const oldIndex = sourceSec.items.findIndex(i => i.id === activeItemId);
        let newIndex = sourceSec.items.findIndex(i => i.id === overItemId);
        if (newIndex === -1) {
          newIndex = sourceSec.items.length - 1;
        } else if (position === 'below' || position === 'after') {
          if (oldIndex > newIndex) {
            newIndex = newIndex + 1;
          }
        } else if (position === 'above' || position === 'before') {
          if (oldIndex < newIndex) {
            newIndex = newIndex - 1;
          }
        }

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const updatedItems = [...sourceSec.items];
          const [moved] = updatedItems.splice(oldIndex, 1);
          updatedItems.splice(newIndex, 0, moved);
          return { ...prev, sections: prev.sections.map(s => s.id === activeSectionId ? { ...s, items: updatedItems } : s) };
        }
        return prev;
      }

      const adaptedItem = adaptItemToSectionType(sourceItem, targetSec.type);
      const newSourceItems = sourceSec.items.filter(i => i.id !== activeItemId);
      const newTargetItems = [...(targetSec.items || [])];
      const insertIndex = newTargetItems.findIndex(i => i.id === overItemId);
      if (insertIndex === -1) {
        newTargetItems.push(adaptedItem);
      } else {
        const finalInsertIndex = (position === 'below' || position === 'after') ? insertIndex + 1 : insertIndex;
        newTargetItems.splice(finalInsertIndex, 0, adaptedItem);
      }

      return {
        ...prev,
        sections: prev.sections.map(s => s.id === activeSectionId ? { ...s, items: newSourceItems } : s.id === overSectionId ? { ...s, items: newTargetItems } : s)
      };
    });
  }, [applyStateWithHistory]);

  const loadVersionSnapshot = useCallback((snapshot, { clearHistory = false } = {}) => {
    const sanitized = sanitizeAndValidateCVSnapshot(snapshot);
    if (!sanitized) throw new Error('Invalid snapshot structure');
    if (snapshot && typeof snapshot === 'object') {
      ['versionName', 'activeVersionName', 'activeVersionId'].forEach(k => {
        if (snapshot[k] !== undefined) sanitized[k] = snapshot[k];
      });
    }
    if (clearHistory) {
      if (typeof externalClearHistory === 'function') externalClearHistory();
      setCvData(sanitized);
    } else {
      applyStateWithHistory(() => sanitized);
    }
    return sanitized;
  }, [applyStateWithHistory, externalClearHistory, setCvData]);
  const resetToDefault = useCallback(() => (
    applyStateWithHistory(() => ({ ...defaultSchema, versionName: null, activeVersionName: null, activeVersionId: null }))
  ), [applyStateWithHistory]);
  /**
   * Restores the default contact section if it is absent from the current CV.
   * Previously this incorrectly inserted profile_header (sections[0]) and stripped
   * the existing profile_header — now it idempotently appends the contact section only
   * when missing, preserving all other sections intact.
   */
  const restoreContactSection = useCallback(() => (
    applyStateWithHistory(prev => {
      const hasContact = prev.sections.some(s => s.id === 'contact' || s.type === 'contact');
      if (hasContact) return prev; // already present, nothing to do
      const defaultContact = defaultSchema.sections.find(s => s.type === 'contact') || defaultSchema.sections[1];
      // Insert after profile_header if found, otherwise append at the end
      const profileHeaderIdx = prev.sections.findIndex(s => s.id === 'profile_header' || s.type === 'profile_header');
      const insertAt = profileHeaderIdx !== -1 ? profileHeaderIdx + 1 : prev.sections.length;
      const newSections = [...prev.sections];
      newSections.splice(insertAt, 0, JSON.parse(JSON.stringify(defaultContact)));
      return { ...prev, sections: newSections };
    })
  ), [applyStateWithHistory]);

  const switchLanguage = useCallback((langCode) => {
    if (!languagePacks[langCode] || Object.keys(languagePacks[langCode]).length === 0) return false;
    applyStateWithHistory(prev => applyDictionaryToCVState(prev, languagePacks[langCode]));
    setActiveLanguage(langCode);
    return true;
  }, [languagePacks, applyStateWithHistory]);
  const importLanguagePack = useCallback((langCode, dictionary, applyImmediately = true) => {
    setLanguagePacks(prev => ({ ...prev, [langCode]: dictionary }));
    if (applyImmediately) {
      applyStateWithHistory(prev => applyDictionaryToCVState(prev, dictionary));
      setActiveLanguage(langCode);
    }
  }, [applyStateWithHistory]);
  const getActiveDictionary = useCallback(() => (
    (languagePacks[activeLanguage] && Object.keys(languagePacks[activeLanguage]).length > 0)
      ? languagePacks[activeLanguage] : extractDictionaryFromCV(cvData)
  ), [languagePacks, activeLanguage, cvData]);

  const deletePage = useCallback((pageNumber) => {
    return deletePageFromDOMAndState({
      cvData,
      applyStateWithHistory,
      pageNumber
    });
  }, [cvData, applyStateWithHistory]);

  return {
    cvData, setCvData, languagePacks, activeLanguage, setActiveLanguage,
    updateProfile, addSection, deleteSection, reorderSections,
    updateSectionTitle, updateSectionBulletStyle, updateSectionProperty,
    addSectionItem, deleteSectionItem, updateSectionItem, reorderSectionItems,
    moveItemBetweenSections, loadVersionSnapshot, resetToDefault,
    restoreContactSection, switchLanguage, importLanguagePack, getActiveDictionary,
    deletePage,
  };
};

export default useCVData;
