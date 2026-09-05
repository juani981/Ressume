import atsRules from './ats.json';
import humanRules from './human.json';
import techRules from './tech.json';
import businessRules from './business.json';
import creativeRules from './creative.json' with { type: 'json' };
import promptsCatalog from './prompts.json' with { type: 'json' };

// Combine all rules into a single knowledge base
const ALL_RULES = [
  ...atsRules,
  ...humanRules,
  ...techRules,
  ...businessRules,
  ...creativeRules
];

export const ALL_PROMPTS = promptsCatalog;

/**
 * Query the AI knowledge base for pre-computed suggestions.
 * 
 * @param {string} target_section - e.g. "global", "experience", "education", "skills", "projects"
 * @param {string} target_layout - e.g. "ATS_1_col", "Human_2_col", "both"
 * @param {string} trigger_context - e.g. "format_scan", "on_edit_description", "color_select"
 * @param {string} [target_industry="all"] - e.g. "all", "tech", "business", "creative"
 * @returns {Array} List of matching suggestion objects.
 */
export const getAISuggestions = (target_section, target_layout, trigger_context, target_industry = "all") => {
  return ALL_RULES.filter(rule => {
    // Check section (allow 'global' to apply everywhere if requested)
    const matchesSection = rule.target_section === target_section || rule.target_section === "global";
    
    // Check layout (allow 'both' to match anything)
    const matchesLayout = rule.target_layout === target_layout || rule.target_layout === "both";
    
    // Check context
    const matchesContext = rule.trigger_context === trigger_context;
    
    // Check industry (allow 'all' to match anything)
    const matchesIndustry = rule.target_industry === target_industry || rule.target_industry === "all";

    return matchesSection && matchesLayout && matchesContext && matchesIndustry;
  });
};

/**
 * Get a specific prompt definition by ID
 */
export const getAIPromptById = (promptId) => {
  return ALL_PROMPTS.find(p => p.id === promptId) || ALL_PROMPTS[0];
};

export default ALL_RULES;

