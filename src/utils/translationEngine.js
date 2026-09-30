/**
 * Multi-Language AI Translation & Schema Parser Engine
 * Handles dictionary extraction, rigid prompt generation, response sanitization,
 * schema validation, auto-correction, and mapping back into CV state.
 */

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English (US/Global)', flag: '🇺🇸' },
  { code: 'es', name: 'Español (LatAm / España)', flag: '🇪🇸' },
  { code: 'pt', name: 'Português (Brasil / Portugal)', flag: '🇧🇷' },
  { code: 'de', name: 'Deutsch (Germany / DACH)', flag: '🇩🇪' },
  { code: 'fr', name: 'Français (France / Canada)', flag: '🇫🇷' },
  { code: 'it', name: 'Italiano (Italy)', flag: '🇮🇹' },
  { code: 'zh', name: '中文 (Simplified Chinese)', flag: '🇨🇳' },
  { code: 'ja', name: '日本語 (Japanese)', flag: '🇯🇵' }
];

/**
 * Returns uppercase language legend name for a given language code (e.g. 'es' -> 'ESPAÑOL', 'en' -> 'ENGLISH').
 * @param {string} langCode
 * @returns {string}
 */
export const getLanguageLegend = (langCode) => {
  if (!langCode) return 'ESPAÑOL';
  const code = String(langCode).toLowerCase().trim();
  const legendMap = {
    es: 'ESPAÑOL',
    en: 'ENGLISH',
    pt: 'PORTUGUÊS',
    de: 'DEUTSCH',
    fr: 'FRANÇAIS',
    it: 'ITALIANO',
    zh: 'CHINESE',
    ja: 'JAPANESE'
  };
  return legendMap[code] || code.toUpperCase();
};

/**
 * Extracts a clean, translatable dictionary of text keys from the active cvData state
 * or fallbacks to the standard content.json structure.
 */
export const extractDictionaryFromCV = (cvData) => {
  if (!cvData || typeof cvData !== 'object') return {};

  const dict = {};
  const sections = Array.isArray(cvData.sections) ? cvData.sections : [];
  
  // Profile
  const profileSec = sections.find(s => s?.type === 'profile_header');
  const profItem = Array.isArray(profileSec?.items) ? profileSec.items[0] || {} : {};
  dict['profile_title'] = profItem.name || cvData.profile?.name || '';
  dict['profile_subtitle'] = profItem.subtitle || '';
  dict['profile_location'] = profItem.location || '';
  dict['section_social'] = 'Contacto';

  // About
  const aboutSec = sections.find(s => s?.type === 'about');
  const aboutItem = Array.isArray(aboutSec?.items) ? aboutSec.items[0] || {} : {};
  dict['section_profile'] = aboutSec?.title || 'Perfil Profesional';
  dict['profile_desc'] = aboutItem.description || '';

  // Experience
  const expSec = sections.find(s => s?.id === 'experience' || s?.type === 'list');
  if (expSec) {
    dict['section_experience'] = expSec.title || 'Experiencia Laboral';
    const items = Array.isArray(expSec.items) ? expSec.items : [];
    items.forEach((item, index) => {
      if (!item) return;
      const idx = index + 1;
      dict[`exp${idx}_title`] = item.title || '';
      dict[`exp${idx}_company`] = item.subtitle ? `${item.subtitle} | ${item.date || ''}` : item.date || '';
      if (item.link) dict[`exp${idx}_link`] = item.link;
      if (item.description) {
        dict[`exp${idx}_desc`] = item.description;
      } else if (Array.isArray(item.bullets) && item.bullets.length > 0) {
        dict[`exp${idx}_desc`] = item.bullets.join('\n');
      }
    });
  }

  // Projects
  const projSec = sections.find(s => s?.id === 'projects');
  if (projSec) {
    dict['section_projects'] = projSec.title || 'Proyectos Destacados';
    const items = Array.isArray(projSec.items) ? projSec.items : [];
    items.forEach((item, index) => {
      if (!item) return;
      const idx = index + 1;
      dict[`proj${idx}_title`] = item.title || '';
      dict[`proj${idx}_company`] = item.subtitle ? `${item.subtitle} | ${item.date || ''}` : item.date || '';
      if (item.link) dict[`proj${idx}_link`] = item.link;
      dict[`proj${idx}_desc`] = item.description || (Array.isArray(item.bullets) ? item.bullets.join('\n') : '');
    });
  }

  // Skills
  const skillsSec = sections.find(s => s?.type === 'skills');
  if (skillsSec) {
    dict['section_skills'] = skillsSec.title || 'Habilidades Técnicas';
    const items = Array.isArray(skillsSec.items) ? skillsSec.items : [];
    items.forEach((item, index) => {
      if (!item) return;
      const idx = index + 1;
      dict[`skill${idx}_category`] = item.title || '';
      dict[`skill${idx}_content`] = item.description || '';
    });
  }

  // Education
  const eduSec = sections.find(s => s?.type === 'education');
  if (eduSec) {
    dict['section_education'] = eduSec.title || 'Educación';
    const items = Array.isArray(eduSec.items) ? eduSec.items : [];
    items.forEach((item, index) => {
      if (!item) return;
      const idx = index + 1;
      dict[`edu${idx}_title`] = item.title || '';
      dict[`edu${idx}_study`] = item.subtitle || '';
      dict[`edu${idx}_year`] = item.date || '';
    });
  }

  // Certificates
  const certSec = sections.find(s => s?.id === 'certificates');
  if (certSec) {
    dict['section_certificates'] = certSec.title || 'Certificaciones';
    const items = Array.isArray(certSec.items) ? certSec.items : [];
    items.forEach((item, index) => {
      if (!item) return;
      const idx = index + 1;
      dict[`cert${idx}_title`] = item.text || item.title || '';
    });
  }

  // Languages
  const langSec = sections.find(s => s?.id === 'languages');
  if (langSec) {
    dict['section_languages'] = langSec.title || 'Idiomas';
    const items = Array.isArray(langSec.items) ? langSec.items : [];
    items.forEach((item, index) => {
      if (!item) return;
      const idx = index + 1;
      dict[`lang${idx}`] = item.text || '';
    });
  }

  return dict;
};

/**
 * Builds a rigid, highly constrained translation prompt designed for LLMs
 * ensuring 100% parseable JSON output with specific technical localization rules.
 */
export const buildTranslationPrompt = (sourceDict, targetLangCode = 'en', sourceLangCode = 'es', customGuidelines = '') => {
  const safeDict = (sourceDict && typeof sourceDict === 'object' && !Array.isArray(sourceDict)) ? sourceDict : {};
  const targetLangObj = SUPPORTED_LANGUAGES.find(l => l.code === targetLangCode) || { name: targetLangCode, code: targetLangCode };
  const sourceLangObj = SUPPORTED_LANGUAGES.find(l => l.code === sourceLangCode) || { name: sourceLangCode, code: sourceLangCode };

  const prompt = [];

  prompt.push(`[SYSTEM INSTRUCTION: ELITE TECHNICAL RESUME TRANSLATOR & LOCALIZER]`);
  prompt.push(`You are an expert technical translator and executive resume localizer specializing in software engineering and IT talent for Fortune 500 and global tech ecosystems.`);
  prompt.push(`Your task is to translate and culturally localize the following CV/Resume text dictionary from ${sourceLangObj.name} (${sourceLangCode}) to ${targetLangObj.name} (${targetLangCode}).`);
  prompt.push('');

  prompt.push(`[STRICT LOCALIZATION DIRECTIVES]`);
  prompt.push(`1. ACADEMIC & DEGREE LOCALIZATION:`);
  prompt.push(`   - "Programador Universitario" -> "Associate Degree in Computer Programming / Software Development"`);
  prompt.push(`   - "Ingeniería en Informática (En etapa de tesis final)" -> "B.S. in Computer Science & Engineering (Final Thesis Stage / In Progress)"`);
  prompt.push(`   - Preserve institution names (e.g. "Universidad Nacional de Tucumán (UNT) – FACET") without garbling.`);
  prompt.push(`2. TECHNICAL ACTION VERBS & TENSE RULES:`);
  prompt.push(`   - Past roles/projects: Use active, strong past-tense verbs (e.g., "Led", "Architected", "Spearheaded", "Refactored", "Optimized", "Streamlined").`);
  prompt.push(`   - Current active roles: Use active present-tense verbs (e.g., "Lead", "Architect", "Spearhead", "Optimize").`);
  prompt.push(`3. HTML & FORMATTING INTEGRITY:`);
  prompt.push(`   - If a string contains HTML tags like <br>, <b>, or <strong>, PRESERVE them exactly in the translated string.`);
  prompt.push(`4. PROPER NOUNS & TECH STACKS:`);
  prompt.push(`   - Do NOT translate technology names, libraries, frameworks, or database products (e.g., PHP, Laravel, .NET, C#, FastAPI, PostgreSQL, Oracle, Docker, GitHub Actions).`);
  
  if (customGuidelines && customGuidelines.trim()) {
    prompt.push(`5. ADDITIONAL USER GUIDELINES:`);
    prompt.push(`   - ${customGuidelines.trim()}`);
  }
  prompt.push('');

  prompt.push(`[CRITICAL OUTPUT FORMAT REQUIREMENTS - ZERO AMBIGUITY]`);
  prompt.push(`- You MUST respond with ONLY valid, raw, unescaped JSON.`);
  prompt.push(`- Do NOT include any conversational text, explanations, greetings, or notes before or after the JSON.`);
  prompt.push(`- Output must strictly follow this exact JSON schema structure:`);
  prompt.push(`{`);
  prompt.push(`  "${targetLangCode}": {`);
  prompt.push(`    "key1": "translated value 1",`);
  prompt.push(`    "key2": "translated value 2",`);
  prompt.push(`    ...`);
  prompt.push(`  }`);
  prompt.push(`}`);
  prompt.push(`- Every single key from the input dictionary MUST be present in the output with the EXACT SAME KEY NAME.`);
  prompt.push(`- Do NOT delete, rename, or combine any keys.`);
  prompt.push('');

  prompt.push(`[SOURCE CONTENT DICTIONARY (${sourceLangCode.toUpperCase()})]`);
  prompt.push(JSON.stringify({ [sourceLangCode]: safeDict }, null, 2));

  return prompt.join('\n');
};

/**
 * Sanitizes and auto-corrects raw LLM responses, stripping code fences,
 * repairing trailing commas, and extracting the target language dictionary.
 */
export const sanitizeAndParseAIResponse = (rawText, expectedLangCode = 'en') => {
  if (!rawText || typeof rawText !== 'string') {
    return { success: false, error: 'Texto de respuesta vacío o inválido.' };
  }

  let cleaned = rawText.trim();

  // 1. Strip Markdown Code Blocks (e.g. ```json ... ``` or ``` ... ```)
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const match = cleaned.match(codeBlockRegex);
  if (match && match[1]) {
    cleaned = match[1].trim();
  }

  // 2. Extract outermost JSON object if surrounded by preamble/postamble
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  // 3. Auto-fix common LLM JSON syntax quirks (trailing commas before } or ])
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');

  // 4. Attempt Parsing
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    // Attempt second repair: replace unescaped literal newlines inside strings
    try {
      const fixedNewlines = cleaned.replace(/([^\\])"\n\s*"/g, '$1",\n"');
      parsed = JSON.parse(fixedNewlines);
    } catch (err2) {
      return {
        success: false,
        error: `Error de sintaxis JSON al parsear la respuesta: ${err.message}`,
        rawCleaned: cleaned
      };
    }
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      success: false,
      error: 'La respuesta parseada no es un objeto JSON válido.',
      rawCleaned: cleaned
    };
  }

  // 5. Normalize root structure (handles {"en": {...}} or direct {...})
  let targetDict = null;
  let resolvedLang = expectedLangCode;

  if (parsed[expectedLangCode] && typeof parsed[expectedLangCode] === 'object' && !Array.isArray(parsed[expectedLangCode])) {
    targetDict = parsed[expectedLangCode];
    resolvedLang = expectedLangCode;
  } else {
    // Check if any key is an object matching a language code
    const keys = Object.keys(parsed);
    const langKey = keys.find(k => k.length <= 5 && typeof parsed[k] === 'object' && !Array.isArray(parsed[k]));
    if (langKey) {
      targetDict = parsed[langKey];
      resolvedLang = langKey;
    } else {
      // Assume root object is the dictionary
      targetDict = parsed;
    }
  }

  if (!targetDict || typeof targetDict !== 'object' || Array.isArray(targetDict) || Object.keys(targetDict).length === 0) {
    return {
      success: false,
      error: 'No se encontró un diccionario de claves válido en la respuesta procesada.'
    };
  }

  return {
    success: true,
    dictionary: targetDict,
    languageCode: resolvedLang,
    rawJson: cleaned
  };
};

/**
 * Backward-compatible alias for sanitizeAndParseAIResponse
 */
export const cleanAndParseAIResponse = sanitizeAndParseAIResponse;

/**
 * Validates key coverage comparing target dictionary against source dictionary
 */
export const validateKeyCoverage = (sourceDict = {}, targetDict = {}) => {
  const safeSource = (sourceDict && typeof sourceDict === 'object' && !Array.isArray(sourceDict)) ? sourceDict : {};
  const safeTarget = (targetDict && typeof targetDict === 'object' && !Array.isArray(targetDict)) ? targetDict : {};

  const sourceKeys = Object.keys(safeSource);
  const targetKeys = Object.keys(safeTarget);

  const matchedKeys = [];
  const missingKeys = [];
  const extraKeys = [];

  sourceKeys.forEach(key => {
    if (key in safeTarget && safeTarget[key] !== null && String(safeTarget[key]).trim() !== '') {
      matchedKeys.push(key);
    } else {
      missingKeys.push(key);
    }
  });

  targetKeys.forEach(key => {
    if (!(key in safeSource)) {
      extraKeys.push(key);
    }
  });

  const totalSource = sourceKeys.length;
  const matchPercentage = totalSource > 0 ? Math.round((matchedKeys.length / totalSource) * 100) : 100;

  return {
    totalSource,
    matchedCount: matchedKeys.length,
    missingCount: missingKeys.length,
    extraCount: extraKeys.length,
    matchPercentage,
    missingKeys,
    extraKeys
  };
};

/**
 * Maps a translated key-value dictionary onto the full active cvData tree,
 * preserving exact drag-and-drop ordering, column layouts, IDs, and custom colors.
 */
export const applyDictionaryToCVState = (cvData, translatedDict = {}) => {
  if (!cvData || typeof cvData !== 'object' || !translatedDict || typeof translatedDict !== 'object' || Array.isArray(translatedDict)) {
    return cvData;
  }

  let newCvData;
  try {
    newCvData = JSON.parse(JSON.stringify(cvData));
  } catch (e) {
    return cvData;
  }

  // Profile
  if (translatedDict['profile_title']) {
    newCvData.profile = { ...(newCvData.profile || {}), name: translatedDict['profile_title'] };
  }

  if (!Array.isArray(newCvData.sections)) {
    return newCvData;
  }

  // Iterate and update sections
  newCvData.sections = newCvData.sections.map(sec => {
    if (!sec || typeof sec !== 'object') return sec;

    if (sec.type === 'profile_header') {
      const items = Array.isArray(sec.items) ? sec.items : [];
      sec.items = items.map(item => ({
        ...item,
        name: translatedDict['profile_title'] || item.name,
        subtitle: translatedDict['profile_subtitle'] || item.subtitle,
        location: translatedDict['profile_location'] || item.location
      }));
    } else if (sec.type === 'about') {
      if (translatedDict['section_profile']) sec.title = translatedDict['section_profile'];
      const items = Array.isArray(sec.items) ? sec.items : [];
      sec.items = items.map(item => ({
        ...item,
        description: translatedDict['profile_desc'] || item.description
      }));
    } else if (sec.id === 'experience' || sec.type === 'list') {
      if (sec.id === 'experience' && translatedDict['section_experience']) {
        sec.title = translatedDict['section_experience'];
      }
      const items = Array.isArray(sec.items) ? sec.items : [];
      sec.items = items.map((item, idx) => {
        const num = idx + 1;
        const newTitle = translatedDict[`exp${num}_title`];
        const newCompany = translatedDict[`exp${num}_company`];
        const newDesc = translatedDict[`exp${num}_desc`];

        const updated = { ...item };
        if (newTitle) updated.title = newTitle;
        if (newCompany) {
          if (newCompany.includes('|')) {
            const parts = newCompany.split('|').map(s => s.trim());
            updated.subtitle = parts.slice(0, -1).join(' | ');
            updated.date = parts[parts.length - 1];
          } else {
            updated.subtitle = newCompany;
          }
        }
        if (newDesc) {
          if (newDesc.includes('\n')) {
            updated.bullets = newDesc.split('\n').filter(b => b.trim());
          } else if (updated.bullets && updated.bullets.length > 0) {
            updated.bullets = [newDesc];
          } else {
            updated.description = newDesc;
          }
        }
        return updated;
      });
    } else if (sec.id === 'projects') {
      if (translatedDict['section_projects']) sec.title = translatedDict['section_projects'];
      const items = Array.isArray(sec.items) ? sec.items : [];
      sec.items = items.map((item, idx) => {
        const num = idx + 1;
        const newTitle = translatedDict[`proj${num}_title`];
        const newCompany = translatedDict[`proj${num}_company`];
        const newDesc = translatedDict[`proj${num}_desc`];

        const updated = { ...item };
        if (newTitle) updated.title = newTitle;
        if (newCompany) updated.subtitle = newCompany;
        if (newDesc) updated.description = newDesc;
        return updated;
      });
    } else if (sec.type === 'skills') {
      if (translatedDict['section_skills']) sec.title = translatedDict['section_skills'];
      const items = Array.isArray(sec.items) ? sec.items : [];
      sec.items = items.map((item, idx) => {
        const num = idx + 1;
        const newCat = translatedDict[`skill${num}_category`];
        const newContent = translatedDict[`skill${num}_content`];
        return {
          ...item,
          title: newCat || item.title,
          description: newContent || item.description
        };
      });
    } else if (sec.type === 'education') {
      if (translatedDict['section_education']) sec.title = translatedDict['section_education'];
      const items = Array.isArray(sec.items) ? sec.items : [];
      sec.items = items.map((item, idx) => {
        const num = idx + 1;
        const newTitle = translatedDict[`edu${num}_title`];
        const newStudy = translatedDict[`edu${num}_study`];
        const newYear = translatedDict[`edu${num}_year`];
        return {
          ...item,
          title: newTitle || item.title,
          subtitle: newStudy || item.subtitle,
          date: newYear || item.date
        };
      });
    } else if (sec.id === 'certificates') {
      if (translatedDict['section_certificates']) sec.title = translatedDict['section_certificates'];
      const items = Array.isArray(sec.items) ? sec.items : [];
      sec.items = items.map((item, idx) => {
        const num = idx + 1;
        const newTitle = translatedDict[`cert${num}_title`];
        return {
          ...item,
          text: newTitle || item.text
        };
      });
    } else if (sec.id === 'languages') {
      if (translatedDict['section_languages']) sec.title = translatedDict['section_languages'];
      const items = Array.isArray(sec.items) ? sec.items : [];
      sec.items = items.map((item, idx) => {
        const num = idx + 1;
        const newText = translatedDict[`lang${num}`];
        return {
          ...item,
          text: newText || item.text
        };
      });
    }

    return sec;
  });

  return newCvData;
};
