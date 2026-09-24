# Dispatch: Worker Remediation 2 — Fix YAML Syntax, XML tag, and HTML strip in aiExporter.js

## Mandatory Reading
- `/home/juani/Documentos/Ressume/.agents/ORIGINAL_REQUEST.md` (lines 589-658)
- `/home/juani/Documentos/Ressume/.agents/challenger_1/handoff.md` (Findings 1, 2, 3)
- `AGENTS.md`

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

STRICT RULE: DO NOT execute automated git commits. Changes must stay in the working tree for user review.

## File Ownership
You exclusively own and may modify:
- `src/utils/aiExporter.js`

DO NOT modify any other files.

## Tasks
Implement the 3 specific fixes identified by Challenger 1 in `src/utils/aiExporter.js`:
1. **Fix 2-Column YAML Syntax Error**:
   In `src/utils/aiExporter.js` lines 198 & 202, change:
   ```javascript
   lines.push(`    - "${escapeYaml(sec.id)}" (${escapeYaml(sec.title || sec.id)})`);
   ```
   to:
   ```javascript
   lines.push(`    - "${escapeYaml(sec.id)} (${escapeYaml(sec.title || sec.id)})"`);
   ```
   so that the entire item is enclosed inside double quotes, making it valid YAML.
2. **Fix Missing `<sections>` Opening Tag in `exportToAIXML`**:
   In `src/utils/aiExporter.js` right after `xml.push('  </candidate>');` (around line 438) and before iterating `sectionsToRender.forEach(...)`:
   Add:
   ```javascript
   xml.push('  <sections>');
   ```
   so that the closing `xml.push('  </sections>');` on line 482 matches an opened `<sections>` tag.
3. **Strip HTML in Profile Header in Frontmatter**:
   In `src/utils/aiExporter.js` lines 207-209 and 253-255:
   Wrap `candidateName`, `candidateHeadline`, `candidateLocation` with `stripHtml(...)` (which is already imported or defined in `itemFormatters.js` or `richTextEngine.js` or define a simple clean helper `const cleanText = (str) => stripHtml(str)`).

## Verification
1. Run Node check to verify 2-col YAML parsing:
   ```bash
   node -e "
   import('yaml').then(async ({ default: YAML }) => {
     const { exportToAIMarkdown } = await import('./src/utils/aiExporter.js');
     const cv = {
       layout: { type: '2-column', isAtsMode: false },
       profile: { name: 'Test' },
       sections: [{ id: 'skills', column: 'left', type: 'skills', title: 'Skills', items: [] }]
     };
     const md = exportToAIMarkdown(cv);
     const match = md.match(/```markdown\n---\n([\s\S]*?)\n---/);
     YAML.parse(match[1]);
     console.log('YAML 2-col parse: SUCCESS');
   });
   "
   ```
2. Run `npx vitest run src/tests/challenger-ai-abstraction-stress.test.js`
3. Run full test suite: `npx vitest run`
4. Run `npm run build`
5. Verify 0 automated git commits.

Write your handoff report to `/home/juani/Documentos/Ressume/.agents/worker_remediation_2/handoff.md` and notify parent.

## 2026-09-12T03:11:41Z
You are Worker Remediation 2. Your working directory is: /home/juani/Documentos/Ressume/.agents/worker_remediation_2
Read your dispatch instructions in:
/home/juani/Documentos/Ressume/.agents/worker_remediation_2/DISPATCH.md
and Challenger 1's findings in:
/home/juani/Documentos/Ressume/.agents/challenger_1/handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

STRICT RULE: DO NOT execute automated git commits. Changes must stay in the working tree for user review.

File ownership:
- src/utils/aiExporter.js

Apply the 3 fixes:
1. Lines 198 & 202: 2-column mode enclose entire item in quotes: - "${escapeYaml(sec.id)} (${escapeYaml(sec.title || sec.id)})"
2. After line 438: add opening xml.push('  <sections>');
3. Lines 207-209: wrap candidateHeadline and candidateLocation with stripHtml.

Verify with tests and npm run build.
Write your handoff report to:
/home/juani/Documentos/Ressume/.agents/worker_remediation_2/handoff.md
When done, notify parent.
