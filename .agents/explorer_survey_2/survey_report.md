# Survey Report: CV Abstraction & Markdown Generation Engine

**Agent**: Explorer Survey 2  
**Date**: 2026-09-12T02:50:00Z  
**Target Subsystem**: `src/utils/aiExporter.js`, `src/utils/schema.js`, `src/utils/versionValidator.js`, `src/registry/sectionRegistry.js`, `src/components/Editor/AIExportModal.jsx`  
**Reference**: `ORIGINAL_REQUEST.md` (lines 589–658), Requirements R1, R2, R3, R4, R5

---

## 1. Executive Summary

Ressume's CV Abstraction and AI Prompt Generation subsystem (`src/utils/aiExporter.js`) serves as the core semantic translation layer that transforms dynamic in-memory CV state (`cvData`) into static representations for Applicant Tracking Systems (ATS) and Large Language Models (LLMs: Claude, GPT, Gemini, DeepSeek).

The authoritative requirement is to establish **Semantic Markdown with an exhaustive YAML Frontmatter** as the **opinionated canonical source of truth (1:1 with the rendered document)**. In this design:
1. Interactive layout and format dropdowns in `AIExportModal.jsx` are removed/hidden; the active layout mode (`cvData.layout?.type` / `isAtsMode`) is automatically detected.
2. A flexible `user_commentary` input is introduced for all prompts, coexisting with `job_description` on `job_matcher`.
3. The YAML Frontmatter is upgraded from a rudimentary stub to an exhaustive visual and structural specification capturing typography, scaling, spacing, container contrast colors, full contact metadata, and column-segmented section ordering.
4. The Markdown body is audited to guarantee 100% fidelity across all 14+ section types, items, dates, subtitles, bullets, links, descriptions, and credentials.
5. For the **Translation & Localization** prompt (`translate_english`), a compact native `cvData` JSON schema is injected alongside the enriched Markdown, directing the LLM to output a strict JSON code block that is 100% importable via the Version Manager (`src/utils/versionValidator.js`).

---

## 2. Current Implementation of `aiExporter.js` & Serialization Functions

Inspection of `src/utils/aiExporter.js` reveals four primary exports/routines:

### 2.1 `exportToAIMarkdown(cvData)` (Lines 32–177)
- **Layout Detection**: Evaluates `const is1Col = layout.type === '1-column';`. Does not check `layout.isAtsMode`.
- **Frontmatter Generation**:
  - In 1-column mode: Emits `layout_type: "1-column"`, `target_audience`, `reading_flow: "top to bottom"`, and filters `CANONICAL_ATS_ORDER` against `cvData.sections`.
  - In 2-column mode: Emits `layout_type: "2-column"`, `target_audience`, `visual_theme` with `left_sidebar_color` and `right_main_color`, and splits sections by `column === 'left'` vs `column === 'right'`.
  - Emits candidate profile: `name`, `headline` (`subtitle`), `location`, and flat `contact` (`email`, `phone`, `linkedin`, `github`).
- **Header Block**: Emits `# Name`, `**Headline**`, and a contact bar delimited by ` | `.
- **Body Rendering**: Emits `renderSection(sec)` by checking `sec.type === 'about'` directly or querying `getSectionDescriptor(sec.type).renderMarkdown`.
  - In 1-column mode: Iterates `CANONICAL_ATS_ORDER` and appends remaining non-header sections.
  - In 2-column mode: Iterates `(cvData.sections || [])` directly in array order, appending `[Visual Layout: Sidebar / Left Column]` or `[Visual Layout: Main Column]` tags to section titles.
- **Enclosure**: The entire string is wrapped inside ````markdown ... ```` code fence blocks.

### 2.2 `exportToAIXML(cvData)` (Lines 183–274)
- Serializes `cvData` into `<curriculum_vitae schema_version="2.0">`. Handles `<candidate>` and standard section tags (`<skill_category>`, `<education_entry>`, `<item>`, `baseItemXML`).

### 2.3 `exportToATSPlainText(cvData)` (Lines 279–365)
- Produces clean ASCII text with uppercase headers and delimiter lines (`======`, `------`).
- Note: `exportToAIText` is **not exported**; it only exists under the name `exportToATSPlainText`.

### 2.4 `exportToAIJson(cvData)`
- **Missing Function**: There is currently **no `exportToAIJson` function**. In `buildAIPromptPayload` (line 385), JSON fallback is executed via raw `JSON.stringify(cvData, null, 2)`.

### 2.5 `buildAIPromptPayload(cvData, promptId, options)` (Lines 371–411)
- Assembles:
  ```markdown
  ---
  role: <prompt.system_instruction>

  task: <prompt.task>

  output_format: <prompt.output_format>

  job_description: <optional job description>
  ---
  # DATOS DE ENTRADA DEL CURRÍCULUM VITAE (<FORMAT>)
  <cvFormatted>
  ```
- **Deficiencies Identified**:
  - `user_commentary` parameter is absent.
  - When `output_format` is missing in `prompts.json` (all prompts except `recruiter_audit`), it outputs `output_format: undefined`.
  - No translation-specific compact schema injection is implemented.

---

## 3. Gap Analysis: YAML Frontmatter vs Exhaustive Visual & Structural Fields

A comparison between `defaultSchema` (`src/utils/schema.js`), `colorUtils.js`, and the current Frontmatter demonstrates substantial omissions:

| Domain | Property / Field | In `defaultSchema` / State | Current Frontmatter Status | Required Specification in Frontmatter |
| :--- | :--- | :--- | :--- | :--- |
| **Layout Mode** | `type` | `'1-column'` \| `'2-column'` | Present (`layout_type`) | `layout_type: "1-column"` \| `"2-column"` |
| **Layout Mode** | `isAtsMode` | Boolean | **Missing** | `is_ats_mode: true` \| `false` |
| **Layout Mode** | `reading_flow` | Derived | Hardcoded string | `"strictly_linear_top_to_bottom"` \| `"two_column_visual_hierarchy"` |
| **Spacing** | `pagePadding` | `24` (px) | **Missing** | `page_padding: 24` |
| **Spacing** | `sectionGap` | `20` (px) | **Missing** | `section_gap: 20` |
| **Spacing** | `itemGap` | `8` (px) | **Missing** | `item_gap: 8` |
| **Typography** | `fontFamily` | `'Poppins'` | **Missing** | `font_family: "Poppins"` |
| **Typography** | `fontScale` | `1.0` (0.85–1.25) | **Missing** | `font_scale: 1.0` |
| **Typography** | `titleScale` | `1.0` (0.80–1.40) | **Missing** | `title_scale: 1.0` |
| **Typography** | `bodyScale` | `1.0` (0.80–1.30) | **Missing** | `body_scale: 1.0` |
| **Typography** | `listScale` | `1.0` (0.80–1.30) | **Missing** | `list_scale: 1.0` |
| **Typography** | `lineHeight` | `1.45` (1.25–1.85) | **Missing** | `line_height: 1.45` |
| **Containers** | `leftBg` & `rightBg` | Hex string or empty | Partial (only 2-column) | Full resolved hex values (`#fafafa`, `#ffffff`) |
| **Contrast Colors** | `titleColor`, `textColor`, `circleColor` | Calculated via `getDynamicTextColors()` | **Missing** | Calculated WCAG contrast tokens for sidebar & main container |
| **Column Width** | `leftColumnWidth` | Number (%) or null | **Missing** | `left_column_width_percent: 33` |
| **Section Order (1-col)** | Full rendered order | Array of sections | **Partial** (only canonical; omits custom/awards/pubs) | Exhaustive list with `id`, `title`, `type`, `item_count`, `bullet_style` |
| **Section Order (2-col)** | Left & Right lists | Array of sections | **Incomplete** (strings only) | Full structured YAML lists with `id`, `title`, `type`, `item_count`, `bullet_style` |
| **Bullet Styles** | `bulletStyle` on sections | `{ size, variant, showLine }` | **Missing** | Serialized per section (`size: "normal"`, `variant: "bold"`, `show_line: true`) |
| **Profile Contacts** | `contacts` dynamic array | `[{ id, type, value }]` | **Missing** (only flat fields) | Full normalized contact catalog including whatsapp, telegram, leetcode, portfolio, website, figma, etc. |

### Proposed Frontmatter YAML Architecture:
```yaml
---
layout_type: "1-column" # or "2-column"
is_ats_mode: true
target_audience: "ATS Parsers (Workday, Taleo, Greenhouse, Lever) & Technical Recruiters"
reading_flow: "strictly_linear_top_to_bottom" # or "two_column_visual_hierarchy"

typography:
  font_family: "Poppins"
  font_scale: 1.0
  title_scale: 1.0
  body_scale: 1.0
  list_scale: 1.0
  line_height: 1.45

spacing:
  page_padding: 24
  section_gap: 20
  item_gap: 8

visual_theme:
  # In 1-column layout:
  background: "#ffffff"
  title_color: "#0b0a0a"
  text_color: "#403a3a"
  text_color_light: "#707070"
  circle_color: "#cccccc"
  # In 2-column layout:
  left_column_width_percent: 33
  left_column_colors:
    background: "#fafafa"
    title_color: "#0b0a0a"
    text_color: "#403a3a"
    text_color_light: "#707070"
    circle_color: "#cccccc"
  right_column_colors:
    background: "#ffffff"
    title_color: "#0b0a0a"
    text_color: "#403a3a"
    text_color_light: "#707070"
    circle_color: "#cccccc"

section_structure:
  # In 1-column layout:
  order:
    - id: "profile_header"
      title: "Header"
      type: "profile_header"
      items_count: 1
    - id: "about_section"
      title: "Perfil Profesional"
      type: "about"
      items_count: 1
    - id: "skills"
      title: "HABILIDADES TÉCNICAS"
      type: "skills"
      items_count: 2
    - id: "experience"
      title: "EXPERIENCIA LABORAL"
      type: "list"
      items_count: 2
      bullet_style: { size: "normal", variant: "bold", show_line: true }
    # ... all remaining sections
  # In 2-column layout:
  left_column:
    - id: "about_section"
      title: "Perfil Profesional"
      type: "about"
      items_count: 1
    - id: "skills"
      title: "HABILIDADES TÉCNICAS"
      type: "skills"
      items_count: 2
  right_column:
    - id: "experience"
      title: "EXPERIENCIA LABORAL"
      type: "list"
      items_count: 2
      bullet_style: { size: "normal", variant: "bold", show_line: true }

candidate_profile:
  name: "Jane Doe"
  headline: "Senior Software Engineer"
  location: "Buenos Aires, Argentina"
  primary_contact:
    email: "jane.doe@example.com"
    phone: "+54 9 11 1234 5678"
  social_and_web_links:
    - type: "linkedin"
      label: "LinkedIn"
      url: "https://linkedin.com/in/janedoe"
    - type: "github"
      label: "GitHub"
      url: "https://github.com/janedoe"
    - type: "portfolio"
      label: "Portfolio"
      url: "https://janedoe.dev"
---
```

---

## 4. Gap Analysis: Markdown Body vs 100% Section & Item Fidelity

Ressume defines 15 distinct section descriptors in `src/registry/sectionRegistry.js`. An audit of `src/registry/itemFormatters.js` and `aiExporter.js` reveals the following gaps:

| Section Type | Descriptor Fields Rendered in UI | Markdown Formatter (`itemFormatters.js`) | Coverage Status & Identified Gaps |
| :--- | :--- | :--- | :--- |
| **`profile_header`** | `name`, `subtitle`, `location`, `contacts` array | Rendered in Header Block | **Gap**: Currently formats only `linkedin`, `github`, and `leetcode` as links. Links for `portfolio`, `website`, `gitlab`, `stackoverflow`, `blog`, `figma` are rendered as raw text without markdown anchors. Flat fields lack fallback normalization. |
| **`about`** | `description` | `aboutMarkdown` | **Gap**: If user stores summary in `item.text` or bullets, current inline fallback in `aiExporter.js` only checks `items[0].description`. |
| **`list` (`experience`)** | `title`, `subtitle`, `date`, `link`, `linkText`, `description`, `bullets` | `baseItemMarkdown` | **Solid**: Captures title, metadata bar, link with `linkText`, description, and bullet list. |
| **`projects`** | `title`, `subtitle`, `date`, `link`, `linkText`, `description`, `bullets` | `baseItemMarkdown` | **Solid**: Full coverage. |
| **`education`** | `title`, `subtitle`, `date`, optional `description`, `bullets` | `educationMarkdown` | **Gap**: `educationMarkdown` only formats title, subtitle, date. If adapted or custom items include `description` or `bullets` (e.g., honors, coursework, thesis), they are completely dropped. |
| **`skills`** | `title`, `description` (comma-separated tech) | `skillsMarkdown` | **Solid**: `- **${title}:** ${desc}`. |
| **`certificates`** | `title`, `subtitle`, `date`, `credentialId`, `link`, `linkText`, `description` | `certificatesMarkdown` | **Gap**: Ignores `item.linkText` (hardcodes `[Credencial]`). If `item.description` exists, it is omitted. |
| **`languages`** | `title`, `subtitle` (level), `description` | `languagesMarkdown` | **Solid**: `- **${lang}**: ${level} (${desc})`. |
| **`awards`** | `title`, `subtitle`, `date`, `description` | `awardsMarkdown` | **Solid**: `- 🏆 **${title}** \| ${issuer} \| \`${date}\` \n ${desc}`. |
| **`publications`** | `title`, `subtitle`, `date`, `link`, `linkText`, `description` | `publicationsMarkdown` | **Gap**: Ignores `item.linkText` (hardcodes `[Enlace]`). |
| **`volunteering`**| `title`, `subtitle`, `date`, `description`, `bullets` | `baseItemMarkdown` | **Solid**: Full coverage. |
| **`references`** | `title` (name), `subtitle` (role), `email`, `phone`, `relationship` | `referencesMarkdown` | **Solid**: `- 👤 **${name}** \| ${role} \| ✉️ ${email} \| 📞 ${phone} \| (${rel})`. |
| **`simple_list`** | `text` | `simpleListMarkdown` | **Solid**: `- ${text}`. |
| **`spacer`** | `height`, `backgroundColor` | `() => '\n<br/>\n'` | **Gap**: Raw `<br/>` in markdown can confuse ATS scanners. Better rendered as `<!-- spacer: ${height}px -->` or omitted cleanly. |
| **`mentoring`** | `title`, `mentee`, `date`, `description` | `baseItemMarkdown` | **Gap**: Mentoring item has field `mentee` rather than `subtitle`. `baseItemMarkdown` looks for `item.subtitle || item.company`, so `mentee` is lost! Must support `item.mentee`. |
| **Custom Section** | Dynamic fields (`title`, `subtitle`, `date`, `bullets`, `description`, `link`) | `baseItemMarkdown` | **Solid**: Handled via fallback descriptor. |

### 2-Column Section Ordering in Markdown Body
In 2-column mode, `cvData.sections` is currently iterated in raw array sequence. If sections alternate between left and right columns in the array, the markdown body jumps erratically between sidebar and main column.
**Recommendation**: In 2-column mode, render all Left Column (Sidebar) sections first under an explicit heading/separator, followed by all Right Column (Main) sections, preserving the natural reading hierarchy.

---

## 5. Translation & Localization JSON Schema Injection Architecture

Requirements R2, R3, and R4 specify that when selecting `translate_english` (or any prompt in the `localization` category), the system must produce an output that can be directly imported as a functional CV in the Version Manager.

### 5.1 Version Manager Compatibility Analysis (`versionValidator.js`)
Inspection of `src/utils/versionValidator.js` (`sanitizeAndValidateCVSnapshot`) and `src/components/Editor/VersionManagerModal.jsx` (lines 363–388) indicates:
1. `VersionManagerModal.jsx` accepts either `{ cvData: ... }` or raw `{ profile, layout, sections }`.
2. `sanitizeAndValidateCVSnapshot` enforces:
   - `profile.name`: Non-empty string.
   - `layout.type`: `'1-column'` or `'2-column'`.
   - Numerical bounds for `pagePadding`, `sectionGap`, `itemGap`.
   - Valid `sections` array with `id`, `column`, `type`, `title`, and unique item `id`s.
   - Preserves or auto-creates `profile_header`.

### 5.2 Compact JSON Schema Injection Design
In `aiExporter.js`:
```javascript
/**
 * Produces a clean, compact JSON representation of cvData matching the native schema.
 */
export const exportToAIJson = (cvData, options = {}) => {
  if (!cvData) return '{}';
  const validated = sanitizeAndValidateCVSnapshot(cvData);
  
  // Compact representation strips internal ephemeral runtime variables if any
  const compact = {
    profile: {
      name: validated.profile?.name || ''
    },
    layout: {
      type: validated.layout?.type || '1-column',
      isAtsMode: Boolean(validated.layout?.isAtsMode),
      fontFamily: validated.layout?.fontFamily || 'Poppins',
      fontScale: validated.layout?.fontScale ?? 1.0,
      titleScale: validated.layout?.titleScale ?? 1.0,
      bodyScale: validated.layout?.bodyScale ?? 1.0,
      listScale: validated.layout?.listScale ?? 1.0,
      lineHeight: validated.layout?.lineHeight ?? 1.45,
      pagePadding: validated.layout?.pagePadding ?? 24,
      sectionGap: validated.layout?.sectionGap ?? 20,
      itemGap: validated.layout?.itemGap ?? 8,
      leftBg: validated.layout?.leftBg || '',
      rightBg: validated.layout?.rightBg || '',
      leftColumnWidth: validated.layout?.leftColumnWidth || null
    },
    sections: (validated.sections || []).map(sec => ({
      id: sec.id,
      column: sec.column || 'left',
      type: sec.type || 'list',
      title: sec.title || '',
      bulletStyle: sec.bulletStyle,
      items: (sec.items || []).map(item => ({ ...item }))
    }))
  };

  return JSON.stringify(compact, null, 2);
};
```

### 5.3 Payload Assembly in `buildAIPromptPayload`
When `promptId === 'translate_english'` or `promptDef.category === 'localization'`:
```javascript
if (promptId === 'translate_english' || promptDef?.category === 'localization') {
  payload.push('');
  payload.push('---');
  payload.push('# SCHEMA JSON NATIVO COMPACTO (cvData)');
  payload.push('Para que la traducción pueda ser importada directamente en el Gestor de Versiones de Ressume, a continuación se proporciona la estructura JSON nativa actual del CV. Tu respuesta DEBE ser ÚNICAMENTE un bloque de código ```json ... ``` con esta misma estructura traducida y adaptada al ecosistema Tech de EE.UU.:');
  payload.push('```json');
  payload.push(exportToAIJson(cvData));
  payload.push('```');
}
```

### 5.4 Prompt Definition Update in `prompts.json`
Update `output_format` for `translate_english` in `src/locales/es/prompts.json`, `src/locales/en/prompts.json`, and `src/ai-knowledge/prompts.json`:
- **ES**: `"Bloque de código JSON estricto (\`\`\`json ... \`\`\`) conteniendo el objeto 'cvData' completamente traducido y adaptado al estándar US Tech. El objeto raíz debe contener exactamente las propiedades 'profile', 'layout' y 'sections' con sus correspondientes arrays de 'items' preservando IDs únicos y tipado nativo de Ressume, 100% compatible con el validador del Gestor de Versiones (sanitizeAndValidateCVSnapshot)."`
- **EN**: `"Strict JSON code block (\`\`\`json ... \`\`\`) containing the complete 'cvData' object translated and culturally localized to standard US Tech terminology. The root object must contain strictly 'profile', 'layout', and 'sections' arrays with preserved unique item IDs, 100% compliant with the Ressume Version Manager schema validator (sanitizeAndValidateCVSnapshot)."`

---

## 6. Existing Test Coverage & Proposed Test Suite

### 6.1 Audit of Existing Tests
- Running `npx vitest run` executes 727 tests across 42 test files.
- **Current Baseline Status**: 719 passed, 8 failed (unrelated failures in `ActionMenu` due to `btn-open-actions` selector refactoring).
- **`aiExporter.js` Test Coverage**: **0% (No dedicated test file exists)**. Only `AIExportModal` is shallowly mounted in `adversarial-challenger.test.jsx`.

### 6.2 Proposed Test Suite: `src/tests/aiExporter.test.js`
A dedicated Vitest test suite must be established to test all export formats, prompt assembly, and schema compliance:

```javascript
describe('aiExporter & CV Abstraction Engine', () => {
  describe('exportToAIMarkdown - Frontmatter Generation', () => {
    it('generates exhaustive YAML frontmatter for 1-column ATS mode', () => {
      // Verifies layout_type, is_ats_mode, typography, spacing, visual_theme, section_order, candidate_profile
    });

    it('generates exhaustive YAML frontmatter for 2-column layout with contrast tokens', () => {
      // Verifies left_column_colors, right_column_colors, left_column_sections, right_column_sections
    });

    it('serializes all dynamic contact types into candidate_profile in Frontmatter', () => {
      // Verifies linkedin, github, leetcode, whatsapp, portfolio, etc.
    });
  });

  describe('exportToAIMarkdown - Markdown Body Fidelity', () => {
    it('renders 100% of standard sections without dropping fields', () => {
      // Verifies experience, education, skills, projects, certificates, languages, awards, publications, references, mentoring
    });

    it('renders hyperlinks with custom linkText', () => {
      // Verifies [Demo / Repositorio](https://...) instead of hardcoded labels
    });

    it('handles custom and unrecognized section types gracefully', () => {
      // Verifies fallback descriptor rendering
    });
  });

  describe('buildAIPromptPayload Integration', () => {
    it('includes user_commentary when provided in options', () => {
      // Verifies presence of 'user_commentary: Focus on AWS and Go'
    });

    it('cleanly omits user_commentary when empty or whitespace', () => {
      // Verifies absence of 'user_commentary:'
    });

    it('includes job_description only when provided', () => {
      // Verifies coexistence with user_commentary on job_matcher
    });

    it('injects compact cvData JSON schema for translate_english prompt', () => {
      // Verifies presence of '# SCHEMA JSON NATIVO COMPACTO (cvData)' and valid JSON block
    });

    it('does not inject JSON schema for non-localization prompts', () => {
      // Verifies absence of JSON block in recruiter_audit
    });
  });

  describe('exportToAIJson & Version Manager Compatibility', () => {
    it('produces JSON valid under sanitizeAndValidateCVSnapshot', () => {
      // Verifies that JSON.parse(exportToAIJson(cvData)) passes validator cleanly
    });
  });

  describe('Prompts Schema Integrity', () => {
    it('guarantees 100% of prompts in es, en, and ai-knowledge have non-empty output_format', () => {
      // Iterates all prompts in all 3 files
    });

    it('guarantees all new IT tech prompts exist in both es and en with identical IDs', () => {
      // Verifies system_design_simulator, live_coding_coach, behavioral_leadership_prep, etc.
    });
  });
});
```

---

## 7. Recommended Data Structures & Implementation Architecture

### 7.1 Signature Harmonization in `src/utils/aiExporter.js`
```javascript
// Export core functions
export const exportToAIMarkdown = (cvData, options = {}) => { ... };
export const exportToAIXML = (cvData, options = {}) => { ... };
export const exportToATSPlainText = (cvData) => { ... };
export const exportToAIText = exportToATSPlainText; // Backward-compatible alias
export const exportToAIJson = (cvData, options = {}) => { ... };

export const buildAIPromptPayload = (cvData, promptId = 'recruiter_audit', options = {}) => {
  const {
    format = 'markdown',
    jobDescription = '',
    userCommentary = '',
    lang = 'es'
  } = options;
  // ...
};
```

### 7.2 UI Integration in `src/components/Editor/AIExportModal.jsx`
1. **Automatic Layout Mode Detection**:
   ```javascript
   const isAts = Boolean(cvData.layout?.isAtsMode || cvData.layout?.type === '1-column');
   const activeLayoutMode = isAts ? '1-column' : '2-column';
   ```
   Do not offer dropdowns to switch layout mode or format; format is pinned to `'markdown'`.
2. **`user_commentary` State**:
   ```javascript
   const [userCommentary, setUserCommentary] = useState('');
   ```
   Provide a clean textarea visible across all prompts.
3. **`job_description` Coexistence**:
   When `selectedPrompt.required_inputs?.includes('job_description')`, display both the `job_description` textarea and the `user_commentary` textarea.
4. **Live Payload Preview**:
   Pass `userCommentary` and `jobDescription` into `buildAIPromptPayload` so the preview reacts immediately.

---

## 8. Conclusion & Handoff Readiness

This investigation provides the complete structural blueprint, gap analysis, and test specifications needed to refactor `aiExporter.js`, enrich Frontmatter and Markdown body to 100% fidelity, integrate `user_commentary`, and configure Translation & Localization with native JSON schema injection. All recommendations align strictly with `AGENTS.md`, `schema.js`, and `versionValidator.js`.
