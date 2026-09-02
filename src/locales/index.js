import esContent from './es/content.json' with { type: 'json' };
import esPrompts from './es/prompts.json' with { type: 'json' };
import esRules from './es/rules.json' with { type: 'json' };
import esUI from './es/ui.json' with { type: 'json' };

import enContent from './en/content.json' with { type: 'json' };
import enPrompts from './en/prompts.json' with { type: 'json' };
import enRules from './en/rules.json' with { type: 'json' };
import enUI from './en/ui.json' with { type: 'json' };

export const LOCALES = {
  es: {
    content: esContent,
    prompts: esPrompts,
    rules: esRules,
    ui: esUI
  },
  en: {
    content: enContent,
    prompts: enPrompts,
    rules: enRules,
    ui: enUI
  }
};

export const SUPPORTED_LOCALES = [
  { code: 'es', name: 'Español', region: 'LatAm / España', flag: '🇪🇸' },
  { code: 'en', name: 'English (US Tech)', region: 'United States / Global Tech', flag: '🇺🇸' }
];

import { defaultSchema } from '../utils/schema';
import { applyDictionaryToCVState } from '../utils/translationEngine';

export const getContent = (lang = 'es') => {
  const dict = LOCALES[lang]?.content || LOCALES.es.content || {};
  const cvStructure = applyDictionaryToCVState(defaultSchema, dict);
  return { ...dict, ...cvStructure };
};

export const getPrompts = (lang = 'es') => {
  return LOCALES[lang]?.prompts || LOCALES.es.prompts;
};

export const getRules = (lang = 'es') => {
  return LOCALES[lang]?.rules || LOCALES.es.rules;
};

export const getUI = (lang = 'es') => {
  return LOCALES[lang]?.ui || LOCALES.es.ui;
};

export default LOCALES;
