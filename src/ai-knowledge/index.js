import { getRules, getPrompts } from '../locales/index.js';

export const ALL_RULES = getRules('es');
export const ALL_PROMPTS = getPrompts('es');

export const getAISuggestions = (target_section, target_layout, trigger_context, target_industry = "all", lang = "es") => {
  return getRules(lang).filter(rule => {
    const matchesSection = rule.target_section === target_section || rule.target_section === "global";
    const matchesLayout = rule.target_layout === target_layout || rule.target_layout === "both";
    const matchesContext = !trigger_context || rule.trigger_context === trigger_context;
    const matchesIndustry = rule.target_industry === target_industry || rule.target_industry === "all";

    return matchesSection && matchesLayout && matchesContext && matchesIndustry;
  });
};

export const getAIPromptById = (promptId, lang = "es") => {
  const prompts = getPrompts(lang);
  return prompts.find(p => p.id === promptId) || prompts[0];
};

export default ALL_RULES;
