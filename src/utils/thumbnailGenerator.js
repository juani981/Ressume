/**
 * src/utils/thumbnailGenerator.js
 *
 * Fast, lightweight, asynchronous visual thumbnail generator for CV snapshots.
 * Generates an authentic SVG data URL representing the CV's layout (1-column ATS vs 2-column Recruiter),
 * background colors, candidate profile header, and section geometry.
 * Zero external dependencies. DO NOT use html2canvas.
 */

/**
 * Escapes characters for strict XML/SVG compliance.
 *
 * @param {string} unsafe
 * @returns {string}
 */
function escapeXml(unsafe) {
  if (typeof unsafe !== 'string') return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generates a clean, authentic visual thumbnail Data URL representing the given CV state.
 *
 * @param {object} cvData - The CV data snapshot.
 * @returns {Promise<string>} - SVG Data URL string (<20KB).
 */
export async function generateThumbnail(cvData) {
  try {
    const layout = cvData?.layout || {};
    const isAts = Boolean(layout.isAtsMode || layout.type === '1-column');
    const leftBg = layout.leftBg || '#f4f5f7';
    const rightBg = layout.rightBg || '#ffffff';

    // Extract profile name & subtitle
    const profileHeader = (cvData?.sections || []).find(
      (s) => s.id === 'profile_header' || s.type === 'profile_header'
    );
    const firstHeaderItem = profileHeader?.items?.[0] || {};
    const candidateName =
      cvData?.profile?.name || firstHeaderItem.name || 'CV Snapshot';
    const candidateSubtitle =
      firstHeaderItem.subtitle || 'Perfil Profesional';

    // Collect left and right sections
    const allSections = Array.isArray(cvData?.sections) ? cvData.sections : [];
    const nonHeaderSections = allSections.filter(
      (s) => s.id !== 'profile_header' && s.type !== 'profile_header'
    );

    let svgContent = '';

    if (isAts) {
      // ==========================================
      // ATS 1-Column Layout Representation
      // ==========================================
      let yOffset = 56;
      let bodyElements = '';

      const atsSections = nonHeaderSections.slice(0, 5);
      atsSections.forEach((sec) => {
        const title = escapeXml((sec.title || sec.type || 'SECCIÓN').toUpperCase());
        bodyElements += `
          <!-- Section: ${title} -->
          <rect x="18" y="${yOffset}" width="3" height="7" rx="1" fill="#2563eb" />
          <text x="25" y="${yOffset + 6}" font-family="system-ui, sans-serif" font-size="5.5" font-weight="700" fill="#1e3a8a">${title}</text>
          <line x1="18" y1="${yOffset + 9}" x2="182" y2="${yOffset + 9}" stroke="#e5e7eb" stroke-width="0.6" />
        `;
        yOffset += 13;

        // Render preview item lines
        const itemCount = Math.min((sec.items || []).length || 2, 3);
        for (let i = 0; i < itemCount; i++) {
          if (yOffset > 260) break;
          const w1 = 120 + ((i * 23) % 40);
          const w2 = 90 + ((i * 17) % 35);
          bodyElements += `
            <rect x="22" y="${yOffset}" width="${w1}" height="2.5" rx="1" fill="#4b5563" opacity="0.75" />
            <rect x="22" y="${yOffset + 4.5}" width="${w2}" height="2" rx="1" fill="#9ca3af" opacity="0.5" />
          `;
          yOffset += 11;
        }
        yOffset += 4;
      });

      svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 280" width="200" height="280">
          <defs>
            <filter id="cardShadow" x="-5%" y="-5%" width="110%" height="110%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.08" />
            </filter>
          </defs>

          <!-- Sheet Canvas -->
          <rect x="0" y="0" width="200" height="280" rx="3" fill="${escapeXml(rightBg)}" stroke="#e2e8f0" stroke-width="1" />

          <!-- ATS Mode Badge -->
          <rect x="156" y="8" width="34" height="11" rx="3" fill="#e0f2fe" stroke="#bae6fd" stroke-width="0.5" />
          <text x="173" y="15.5" font-family="system-ui, sans-serif" font-size="4.8" font-weight="700" text-anchor="middle" fill="#0369a1">ATS 1-COL</text>

          <!-- Header -->
          <text x="100" y="26" font-family="system-ui, sans-serif" font-size="8.5" font-weight="700" text-anchor="middle" fill="#0f172a">${escapeXml(candidateName.toUpperCase())}</text>
          <text x="100" y="35" font-family="system-ui, sans-serif" font-size="5" text-anchor="middle" fill="#64748b">${escapeXml(candidateSubtitle)}</text>
          <line x1="20" y1="42" x2="180" y2="42" stroke="#cbd5e1" stroke-width="0.8" />

          <!-- Body Sections -->
          ${bodyElements}
        </svg>
      `;
    } else {
      // ==========================================
      // Visual Recruiter 2-Column Layout Representation
      // ==========================================
      const leftColWidth = 66;
      const rightColWidth = 134;

      // Left column elements
      let leftY = 46;
      let leftElements = '';

      const leftSections = nonHeaderSections.filter((s) => s.column === 'left').slice(0, 4);
      leftSections.forEach((sec) => {
        const title = escapeXml((sec.title || sec.type || 'SECCIÓN').toUpperCase());
        leftElements += `
          <text x="8" y="${leftY}" font-family="system-ui, sans-serif" font-size="4.8" font-weight="700" fill="#1e40af">${title}</text>
          <line x1="8" y1="${leftY + 2.5}" x2="58" y2="${leftY + 2.5}" stroke="#bfdbfe" stroke-width="0.6" />
        `;
        leftY += 7;

        const count = Math.min((sec.items || []).length || 2, 3);
        for (let i = 0; i < count; i++) {
          if (leftY > 265) break;
          const w = 38 + ((i * 7) % 16);
          leftElements += `
            <rect x="8" y="${leftY}" width="${w}" height="2" rx="1" fill="#4b5563" opacity="0.7" />
          `;
          leftY += 5;
        }
        leftY += 5;
      });

      // Right column elements
      let rightY = 22;
      let rightElements = '';

      const rightSections = nonHeaderSections.filter((s) => s.column === 'right').slice(0, 4);
      rightSections.forEach((sec) => {
        const title = escapeXml((sec.title || sec.type || 'EXPERIENCIA').toUpperCase());
        rightElements += `
          <text x="74" y="${rightY}" font-family="system-ui, sans-serif" font-size="5.5" font-weight="700" fill="#0f172a">${title}</text>
          <line x1="74" y1="${rightY + 2.5}" x2="190" y2="${rightY + 2.5}" stroke="#cbd5e1" stroke-width="0.6" />
        `;
        rightY += 8;

        const count = Math.min((sec.items || []).length || 2, 3);
        for (let i = 0; i < count; i++) {
          if (rightY > 265) break;
          const w1 = 90 + ((i * 11) % 25);
          const w2 = 70 + ((i * 13) % 20);
          rightElements += `
            <rect x="74" y="${rightY}" width="${w1}" height="2.5" rx="1" fill="#1e293b" opacity="0.8" />
            <rect x="74" y="${rightY + 4}" width="${w2}" height="2" rx="1" fill="#64748b" opacity="0.5" />
          `;
          rightY += 10;
        }
        rightY += 4;
      });

      svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 280" width="200" height="280">
          <!-- Canvas Backgrounds -->
          <rect x="0" y="0" width="${leftColWidth}" height="280" fill="${escapeXml(leftBg)}" />
          <rect x="${leftColWidth}" y="0" width="${rightColWidth}" height="280" fill="${escapeXml(rightBg)}" />

          <!-- Outer Border & Column Divider -->
          <rect x="0" y="0" width="200" height="280" rx="3" fill="none" stroke="#e2e8f0" stroke-width="1" />
          <line x1="${leftColWidth}" y1="0" x2="${leftColWidth}" y2="280" stroke="#e2e8f0" stroke-width="0.8" />

          <!-- Left Column Profile Header -->
          <text x="8" y="20" font-family="system-ui, sans-serif" font-size="6.5" font-weight="700" fill="#0f172a">${escapeXml(candidateName)}</text>
          <text x="8" y="27" font-family="system-ui, sans-serif" font-size="4" fill="#64748b">${escapeXml(candidateSubtitle)}</text>
          <line x1="8" y1="32" x2="58" y2="32" stroke="#cbd5e1" stroke-width="0.6" />

          <!-- Contact mini lines -->
          <rect x="8" y="36" width="30" height="1.8" rx="0.9" fill="#94a3b8" opacity="0.6" />
          <rect x="8" y="39.5" width="25" height="1.8" rx="0.9" fill="#94a3b8" opacity="0.6" />

          <!-- Left Column Sections -->
          ${leftElements}

          <!-- Right Column Sections -->
          ${rightElements}
        </svg>
      `;
    }

    // Minify SVG string slightly
    const cleanedSvg = svgContent.trim().replace(/\s{2,}/g, ' ');
    const encoded = encodeURIComponent(cleanedSvg);
    return `data:image/svg+xml;charset=utf-8,${encoded}`;
  } catch (err) {
    console.error('generateThumbnail encountered an error, falling back to minimal SVG:', err);
    const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 280"><rect width="200" height="280" fill="#ffffff" stroke="#e2e8f0"/><text x="100" y="140" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#94a3b8">CV</text></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(fallbackSvg)}`;
  }
}

export default generateThumbnail;
