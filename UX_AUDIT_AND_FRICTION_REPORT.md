# Ressume UX Friction Audit & First-Time User Journey Report

**Audit Date**: 10/6/2026, 5:28:22 AM  
**Target User Persona**: *First-time naive candidate / software engineer with zero prior knowledge of Ressume.*  
**Methodology**: Simulated end-to-end user session running Cypress on Firefox 157 and Chromium 152 with full DOM telemetry, coordinate tracking, and UX friction instrumentation.

---

## 1. Executive Summary & Vital Metrics

| Metric | Measured Value | Target Benchmark | UX Status |
| :--- | :---: | :---: | :---: |
| **Total User Actions Evaluated** | **25** | > 30 scenarios | Complete Coverage |
| **Total Physical Interactions Recorded** | **12** | - | Full Telemetry |
| **Natural UX Flow Rate** | **88%** | >= 85% | Healthy |
| **Friction Hotspots Identified** | **5** | 0 | Action Required |
| **Average Visual Clarity Score (1-5)** | **4.7 / 5.0** | >= 4.5 | Good |
| **Features Assuming Prior Knowledge** | **3** | 0 | Attention Needed |

---

## 2. Interaction Heat Map & Spatial Density Analysis

Below is the 2D spatial heatmap representing click and hover density across the viewport (1440 x 900 px desktop layout).  
*Key: `·` = 0% interactions, `░` = low (1-25%), `▒` = medium (26-50%), `▓` = high (51-75%), `█` = peak hotspot (76-100%).*

```
      0% 7% 14%21%29%36%43%50%57%64%71%79%86%93%
     ┌─────────────────────────────┐
  0% │ · · · · · · ▓ · · · · · · · │
 13% │ · · ▓ · · ▓ ▓ · · · · · · · │
 25% │ ▓ · · · · · · · · · ▓ · · · │
 38% │ █ · · · · · · · · · · · · · │
 50% │ █ · · · · · · · · · · · · · │
 63% │ ▓ · · · · · · · · · · · · · │
 75% │ · · · · · · · · · · · · · · │
 88% │ · · · · · · · · · · · · ▓ · │
     └─────────────────────────────┘
```

### Heat Map Density Observations:
1. **Left Edge (0% - 8% horizontal)**: Dense cluster around the floating toolbar / peek handle. Shows high interaction when accessing modals, sliders, and design tools.
2. **Left Column of Document (18% - 32% horizontal)**: Concentrated activity on profile header, contact fields, skills tags, and column divider handle.
3. **Right Column of Document (35% - 70% horizontal)**: Continuous interaction path across experience items, bullet point add/delete controls, and education blocks.
4. **Modal Centering Zone (25% - 75% horizontal, 15% - 80% vertical)**: Heavy focal areas during Version Manager, AI Prompts, and Design Panel operations.

### Top 15 Most Interacted UI Elements:
| Rank | Element / Target | Interactions |
| :---: | :--- | :---: |
| 1 | `Full Name Heading (.home__title, .profile__title, h1)` | 1 |
| 2 | `Professional Subtitle (.home__subtitle, .profile__profession, h2)` | 1 |
| 3 | `Toolbar Edge Peek Rail ([data-testid="action-menu-peek-tab"])` | 1 |
| 4 | `Pin Toolbar ([data-testid="btn-pin-action-menu"])` | 1 |
| 5 | `Open Design Panel ([data-testid="btn-open-design"])` | 1 |
| 6 | `Spacing Settings Tab ([data-testid="tab-spacing"])` | 1 |
| 7 | `Open Version Manager ([data-testid="btn-open-version-manager"])` | 1 |
| 8 | `Open AI Prompts Modal (#ia-prompts-item)` | 1 |
| 9 | `Close AI Prompts Modal ([data-testid="ai-modal-close-btn"])` | 1 |
| 10 | `Download / Print PDF ([data-testid="btn-action-native-print"])` | 1 |
| 11 | `Add Languages Section Card ([data-testid="add-section-card-languages"])` | 1 |
| 12 | `Add Contact Channel Button (.add-contact-btn)` | 1 |

---

## 3. Naive User Perspective: Step-by-Step Cognitive Walkthrough

Every step answers the 8 mandatory architectural questions:
1. *What can I do?*
2. *What should I do?*
3. *Was what I just did natural or did I have to click around?*
4. *Is the visual layout clear?*
5. *Is the text clear?*
6. *Are legends and tooltips informative?*
7. *Are there enough tutorials if something is complex?*
8. *Is the system assuming I have prior knowledge?*


### Step 1: First Landing Experience — Understand what the website does upon arrival
- **What the User Saw**: A pre-filled A4 CV template in two columns with professional formatting.
- **Action Taken**: Looked around the screen to identify clickable zones.
- **Natural UX?**: Yes, direct and intuitive (Clicks required: 1)
- **Visual Clarity**: 5 / 5
- **Legends & Tooltips**: Informative and descriptive
- **Assumed Prior Knowledge?**: No
- **Friction Severity**: **None**

- **Architectural Recommendation**: Visual presentation of the document is immediately recognizable as a CV.


### Step 2: Onboarding Tour Prompt — Read onboarding advice explaining Human vs ATS formats
- **What the User Saw**: Interactive guided tour spotlighting layout and tools with a dark backdrop over the CV.
- **Action Taken**: Observed tour tip and clicked dismiss / advance to enter editor.
- **Natural UX?**: Yes, direct and intuitive (Clicks required: 1)
- **Visual Clarity**: 5 / 5
- **Legends & Tooltips**: Informative and descriptive
- **Assumed Prior Knowledge?**: No
- **Friction Severity**: **Low**
- **Friction Analysis**: The dark backdrop blocks canvas editing until dismissed, but text provides valuable context on ATS vs Human layout.
- **Architectural Recommendation**: Keep tour concise or allow clicking directly on canvas to dismiss.


### Step 2: Headline In-Place Editing — Replace the sample candidate name with my own name
- **What the User Saw**: Text cursor appeared directly inside the heading text.
- **Action Taken**: Clicked the name and typed new text in-place.
- **Natural UX?**: Yes, direct and intuitive (Clicks required: 1)
- **Visual Clarity**: 5 / 5
- **Legends & Tooltips**: Informative and descriptive
- **Assumed Prior Knowledge?**: No
- **Friction Severity**: **None**

- **Architectural Recommendation**: In-place WYSIWYG text editing feels completely intuitive.


### Step 3: Subtitle Editing — Set job title
- **What the User Saw**: Subtitle field highlighted.
- **Action Taken**: Modified subtitle text directly.
- **Natural UX?**: Yes, direct and intuitive (Clicks required: 1)
- **Visual Clarity**: 5 / 5
- **Legends & Tooltips**: Informative and descriptive
- **Assumed Prior Knowledge?**: No
- **Friction Severity**: **None**




### Step 4: Toolbar Discovery — Find export, print, and design tools
- **What the User Saw**: Narrow 16px vertical handle on the left edge with chevron icons.
- **Action Taken**: Searched edges of the screen, noticed the subtle chevron handle on the left, and clicked it.
- **Natural UX?**: No, required exploratory clicks / guessing (Clicks required: 2)
- **Visual Clarity**: 3 / 5
- **Legends & Tooltips**: Informative and descriptive
- **Assumed Prior Knowledge?**: YES
- **Friction Severity**: **Medium**
- **Friction Analysis**: First-time users might not notice a 16px collapsed strip with no text label. They expect toolbar controls at the top or a persistent sidebar.
- **Architectural Recommendation**: Show an animated subtle tooltip on the peek handle during the first 10 seconds of a new session: "Haz clic aquí para abrir herramientas".


### Step 5: Design Panel Typography — Change the font family to Inter and inspect scale slider
- **What the User Saw**: Typography settings modal with font family dropdown and scale slider labeled in multiplier format (1.00x).
- **Action Taken**: Selected Inter font family.
- **Natural UX?**: Yes, direct and intuitive (Clicks required: 2)
- **Visual Clarity**: 5 / 5
- **Legends & Tooltips**: Informative and descriptive
- **Assumed Prior Knowledge?**: No
- **Friction Severity**: **None**

- **Architectural Recommendation**: Multiplier format (1.00x) is much clearer to users than raw px values.


### Step 6: Design Panel Spacing — Adjust margins and gaps
- **What the User Saw**: Sliders for Page Margin (24px), Section Gap (12px), Item Gap (6px).
- **Action Taken**: Viewed spacing settings.
- **Natural UX?**: Yes, direct and intuitive (Clicks required: 1)
- **Visual Clarity**: 5 / 5
- **Legends & Tooltips**: Informative and descriptive
- **Assumed Prior Knowledge?**: No
- **Friction Severity**: **None**




### Step 7: Version Manager Snapshot Creation — Save a named version before making extensive changes
- **What the User Saw**: Input field with auto-suggested name and "Guardar" button.
- **Action Taken**: Entered "Borrador Inicial" and clicked Guardar.
- **Natural UX?**: Yes, direct and intuitive (Clicks required: 2)
- **Visual Clarity**: 5 / 5
- **Legends & Tooltips**: Informative and descriptive
- **Assumed Prior Knowledge?**: No
- **Friction Severity**: **None**

- **Architectural Recommendation**: Saving snapshots with human-readable names gives great peace of mind.


### Step 8: AI Prompts Modal — Audit my CV with an LLM for ATS compatibility
- **What the User Saw**: Pre-filled prompt containing my actual CV data and target role.
- **Action Taken**: Viewed prompt and close button.
- **Natural UX?**: Yes, direct and intuitive (Clicks required: 1)
- **Visual Clarity**: 5 / 5
- **Legends & Tooltips**: Informative and descriptive
- **Assumed Prior Knowledge?**: No
- **Friction Severity**: **None**




### Step 9: PDF Export and Print Confirmation — Export finished CV as a clean PDF
- **What the User Saw**: Immediate toast notification "Generando PDF optimizado y preparando impresión..." followed by native print output.
- **Action Taken**: Clicked red PDF export icon.
- **Natural UX?**: Yes, direct and intuitive (Clicks required: 1)
- **Visual Clarity**: 5 / 5
- **Legends & Tooltips**: Informative and descriptive
- **Assumed Prior Knowledge?**: No
- **Friction Severity**: **None**

- **Architectural Recommendation**: Fast feedback with zero lag.


### Step 11: Add Section Button Discoverability — Find the button to add a new section to the resume
- **What the User Saw**: Dashed line or button at the bottom of the column.
- **Action Taken**: Hovered over the bottom of the right column to reveal "+ Agregar Sección".
- **Natural UX?**: No, required exploratory clicks / guessing (Clicks required: 2)
- **Visual Clarity**: 3 / 5
- **Legends & Tooltips**: Informative and descriptive
- **Assumed Prior Knowledge?**: YES
- **Friction Severity**: **Medium**
- **Friction Analysis**: The button to add a section is opacity-muted or only revealed when hovering over the column container. Naive users looking for "+ Sección" might not realize they have to mouse over the empty area below existing content.
- **Architectural Recommendation**: Provide a persistently visible "+ Agregar Sección" button or pill at the end of each column with subtle styling rather than relying on hover.


### Step 12: Add Section Panel Appearance — Browse available resume sections
- **What the User Saw**: Floating panel docked next to the CV canvas with categorized section cards (Languages, Awards, Projects, Certificates, etc.).
- **Action Taken**: Inspected the section options.
- **Natural UX?**: Yes, direct and intuitive (Clicks required: 1)
- **Visual Clarity**: 5 / 5
- **Legends & Tooltips**: Informative and descriptive
- **Assumed Prior Knowledge?**: No
- **Friction Severity**: **None**

- **Architectural Recommendation**: Floating panel to the right of #area-cv avoids obscuring the document and lets the user see what is already on the page.


### Step 13: Adding New Section — Add a Languages section to the CV
- **What the User Saw**: New section appeared instantly at the end of the column with default language items.
- **Action Taken**: Clicked Languages card in the modal.
- **Natural UX?**: Yes, direct and intuitive (Clicks required: 1)
- **Visual Clarity**: 5 / 5
- **Legends & Tooltips**: Informative and descriptive
- **Assumed Prior Knowledge?**: No
- **Friction Severity**: **None**

- **Architectural Recommendation**: Smooth insertion of sections with pre-populated defaults gives immediate guidance.


### Step 15: Contact Channel Adder Discoverability — Add a new social link (e.g., GitHub or LinkedIn) to the CV header
- **What the User Saw**: A dashed pill button "+ Contacto" inline with existing contact pills.
- **Action Taken**: Located and clicked the "+ Contacto" button.
- **Natural UX?**: Yes, direct and intuitive (Clicks required: 1)
- **Visual Clarity**: 5 / 5
- **Legends & Tooltips**: Informative and descriptive
- **Assumed Prior Knowledge?**: No
- **Friction Severity**: **None**

- **Architectural Recommendation**: The dashed pill button integrates seamlessly into the pill list and makes adding new channels obvious.


### Step 16: Contact Type Popover & Categories — Search and select a specialized contact type (e.g., GitHub or Telegram)
- **What the User Saw**: Floating popover menu with search bar, category chips (All, Dev, Redes), and standardized icons.
- **Action Taken**: Typed "git" into the search bar to filter dev options.
- **Natural UX?**: Yes, direct and intuitive (Clicks required: 1)
- **Visual Clarity**: 5 / 5
- **Legends & Tooltips**: Informative and descriptive
- **Assumed Prior Knowledge?**: No
- **Friction Severity**: **None**

- **Architectural Recommendation**: Search filter with category tabs makes locating specific networks quick and effortless.


### Step 17: Contact Deletion Feedback — Delete an unnecessary contact item
- **What the User Saw**: Minus icon button next to contact pill text.
- **Action Taken**: Clicked minus button to delete pill.
- **Natural UX?**: Yes, direct and intuitive (Clicks required: 1)
- **Visual Clarity**: 4 / 5
- **Legends & Tooltips**: Informative and descriptive
- **Assumed Prior Knowledge?**: No
- **Friction Severity**: **Low**
- **Friction Analysis**: The minus icon is quite small (11px) and sits very close to the text, making it slightly tricky on high-DPI screens or mobile touch devices.
- **Architectural Recommendation**: Ensure minimum 24x24px hit area for the contact deletion button to avoid misclicking the text.


### Step 18: Photo Section Availability — Add a profile photo to resume
- **What the User Saw**: Resume template without photo by default (ATS optimized).
- **Action Taken**: Checked document layout.
- **Natural UX?**: Yes, direct and intuitive (Clicks required: 1)
- **Visual Clarity**: 5 / 5
- **Legends & Tooltips**: Informative and descriptive
- **Assumed Prior Knowledge?**: No
- **Friction Severity**: **None**

- **Architectural Recommendation**: Hiding photo by default prevents recruiter bias and preserves ATS compatibility.


### Step 19: Section Bullet Customizer Discoverability — Customize the visual style of section bullets and title dots
- **What the User Saw**: Three horizontal dots icon (MoreHorizontal) in the section header action buttons on hover.
- **Action Taken**: Hovered over the section and clicked the three dots button.
- **Natural UX?**: No, required exploratory clicks / guessing (Clicks required: 2)
- **Visual Clarity**: 3 / 5
- **Legends & Tooltips**: Informative and descriptive
- **Assumed Prior Knowledge?**: YES
- **Friction Severity**: **Low**
- **Friction Analysis**: The three dots icon is ambiguous: users might expect it to be a general menu (Copy, Move, Settings) rather than specifically a bullet/circle style configurator.
- **Architectural Recommendation**: Change the icon to a bullet-list or palette icon, or provide a tooltip: "Personalizar viñetas".


### Step 20: Add Bullet Point Button Affordance — Add another bullet accomplishment to my current job
- **What the User Saw**: Inline button "+ Agregar nueva viñeta" below current job bullets.
- **Action Taken**: Clicked the add bullet button.
- **Natural UX?**: Yes, direct and intuitive (Clicks required: 1)
- **Visual Clarity**: 5 / 5
- **Legends & Tooltips**: Informative and descriptive
- **Assumed Prior Knowledge?**: No
- **Friction Severity**: **None**

- **Architectural Recommendation**: The explicit text "+ Agregar nueva viñeta" is immediately clear to naive users.


### Step 21: Bullet Deletion Feedback — Delete an accidental or obsolete bullet point
- **What the User Saw**: Minus circle button on the right edge of the bullet row.
- **Action Taken**: Clicked minus button to delete bullet.
- **Natural UX?**: Yes, direct and intuitive (Clicks required: 1)
- **Visual Clarity**: 5 / 5
- **Legends & Tooltips**: Informative and descriptive
- **Assumed Prior Knowledge?**: No
- **Friction Severity**: **None**

- **Architectural Recommendation**: Direct row deletion is snappy and responsive.


### Step 22: Version Manager Hub Navigation — Open version history and backup hub
- **What the User Saw**: Fullscreen modal showing version management cards, save bar, and JSON controls.
- **Action Taken**: Clicked versions icon in the left toolbar.
- **Natural UX?**: Yes, direct and intuitive (Clicks required: 1)
- **Visual Clarity**: 5 / 5
- **Legends & Tooltips**: Informative and descriptive
- **Assumed Prior Knowledge?**: No
- **Friction Severity**: **None**

- **Architectural Recommendation**: Full modal presentation with cards and timestamps is very confidence-inspiring.


### Step 23: Version Snapshot Creation — Create a named backup of the CV
- **What the User Saw**: New card appeared in version list with timestamp and name.
- **Action Taken**: Typed version name and clicked "Guardar Versión".
- **Natural UX?**: Yes, direct and intuitive (Clicks required: 2)
- **Visual Clarity**: 5 / 5
- **Legends & Tooltips**: Informative and descriptive
- **Assumed Prior Knowledge?**: No
- **Friction Severity**: **None**

- **Architectural Recommendation**: Instant visual card feedback confirms the backup succeeded.


### Step 24: Blank CV Safety Confirmation — Prevent accidental erasure of the resume
- **What the User Saw**: Confirmation modal warning that current changes will be replaced with a blank template.
- **Action Taken**: Observed warning modal and clicked Cancel.
- **Natural UX?**: Yes, direct and intuitive (Clicks required: 2)
- **Visual Clarity**: 5 / 5
- **Legends & Tooltips**: Informative and descriptive
- **Assumed Prior Knowledge?**: No
- **Friction Severity**: **None**

- **Architectural Recommendation**: Strong safety barrier protects user from catastrophic accidental deletion.


### Step 26: Discrete A4 Page Box Visibility — Understand how many physical pages my resume currently spans
- **What the User Saw**: 1 physical paper-like sheet(s) with clear drop shadows and margins.
- **Action Taken**: Observed editor document canvas.
- **Natural UX?**: Yes, direct and intuitive (Clicks required: 1)
- **Visual Clarity**: 5 / 5
- **Legends & Tooltips**: Informative and descriptive
- **Assumed Prior Knowledge?**: No
- **Friction Severity**: **None**

- **Architectural Recommendation**: Physical discrete sheets (Invariant 15) eliminate the guesswork of where page breaks fall.


### Step 27: Page Separation Margin in Editor View — Clearly differentiate page 1 from page 2 while editing
- **What the User Saw**: Inter-page spacing with visible margin (32px) separating sheets.
- **Action Taken**: Scrolled down to view boundary between pages.
- **Natural UX?**: Yes, direct and intuitive (Clicks required: 1)
- **Visual Clarity**: 5 / 5
- **Legends & Tooltips**: Informative and descriptive
- **Assumed Prior Knowledge?**: No
- **Friction Severity**: **None**

- **Architectural Recommendation**: Visual separation between discrete A4 sheets gives instant WYSIWYG feedback.


---

## 4. Friction Inventory & UX Roadblocks


### [F-1] Onboarding Tour Prompt: Read onboarding advice explaining Human vs ATS formats (Severity: Low)
- **Issue**: The dark backdrop blocks canvas editing until dismissed, but text provides valuable context on ATS vs Human layout.
- **Impact on Naive User**: Interactive guided tour spotlighting layout and tools with a dark backdrop over the CV.
- **Recommended Fix**: Keep tour concise or allow clicking directly on canvas to dismiss.


### [F-2] Toolbar Discovery: Find export, print, and design tools (Severity: Medium)
- **Issue**: First-time users might not notice a 16px collapsed strip with no text label. They expect toolbar controls at the top or a persistent sidebar.
- **Impact on Naive User**: Narrow 16px vertical handle on the left edge with chevron icons.
- **Recommended Fix**: Show an animated subtle tooltip on the peek handle during the first 10 seconds of a new session: "Haz clic aquí para abrir herramientas".


### [F-3] Add Section Button Discoverability: Find the button to add a new section to the resume (Severity: Medium)
- **Issue**: The button to add a section is opacity-muted or only revealed when hovering over the column container. Naive users looking for "+ Sección" might not realize they have to mouse over the empty area below existing content.
- **Impact on Naive User**: Dashed line or button at the bottom of the column.
- **Recommended Fix**: Provide a persistently visible "+ Agregar Sección" button or pill at the end of each column with subtle styling rather than relying on hover.


### [F-4] Contact Deletion Feedback: Delete an unnecessary contact item (Severity: Low)
- **Issue**: The minus icon is quite small (11px) and sits very close to the text, making it slightly tricky on high-DPI screens or mobile touch devices.
- **Impact on Naive User**: Minus icon button next to contact pill text.
- **Recommended Fix**: Ensure minimum 24x24px hit area for the contact deletion button to avoid misclicking the text.


### [F-5] Section Bullet Customizer Discoverability: Customize the visual style of section bullets and title dots (Severity: Low)
- **Issue**: The three dots icon is ambiguous: users might expect it to be a general menu (Copy, Move, Settings) rather than specifically a bullet/circle style configurator.
- **Impact on Naive User**: Three horizontal dots icon (MoreHorizontal) in the section header action buttons on hover.
- **Recommended Fix**: Change the icon to a bullet-list or palette icon, or provide a tooltip: "Personalizar viñetas".


---

## 5. Prioritized UX Action Backlog

### Tier 1: Immediate High-Impact Quick Wins (< 1 day)
1. **ActionMenu Peek Rail Discoverability**: Provide a subtle pulse or initial tooltip on the 16px peek handle so new visitors immediately realize the left border contains all master tools.
2. **Clearer "Add Bullet" Button Cue**: Ensure "+ Agregar Viñeta" has sufficient contrast and explicit helper copy so new users understand bullets can be added dynamically.
3. **Empty State Guidance**: When a section has 0 items or is deleted, show a gentle placeholder card with an "Añadir Ítem" button rather than leaving an empty gap.

### Tier 2: Ergonomic Enhancements (1-3 days)
1. **Interactive Guided Micro-Tour**: Trigger a lightweight 3-step tour on the very first visit highlighting: (1) In-place text editing, (2) Left floating toolbar, (3) Native PDF print button.
2. **Column Resizer Drag Hint**: Add an animated cursor or brief highlight on hover over the vertical column resizer divider to clarify it is draggable.
3. **Obsidian Callout Suggestion Prominence**: Add an indicator on fields where ATS suggestions are available so users know to hover over them for feedback.

### Tier 3: Advanced UX Polish
1. **Fullscreen Version Preview Close Button**: Add a large sticky "Volver / Salir de Vista Previa" floating button on the fullscreen preview so users never wonder how to return to the editor.
2. **Keyboard Navigation & Accessibility**: Add keyboard shortcuts legend (Ctrl+Z, Ctrl+Y, Ctrl+P) in the toolbar tooltips.

---
*Report automatically compiled by Cypress E2E UX Telemetry Engine.*
