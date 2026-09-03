import React from 'react';
import { Document, Page, View } from '@react-pdf/renderer';
import { createCvStyles, getDynamicTextColors, computePdfFontSizes, computePdfSpacing } from './pdfStyleFactory';
import { CVSectionPdf } from './CVSectionPdf';

/**
 * CVDocument — Complete React-PDF Document Mirror of #area-cv
 *
 * Capabilities:
 * 1. 2-column & 1-column ATS layout support matching on-screen state
 * 2. 100% vector selectable text via built-in Type 1 fonts (0 network latency)
 * 3. Dynamic YIQ contrast intelligence for user-selected column colors
 * 4. Super-container pagination preventing broken items and orphan titles
 * 5. Full support for all 13 CV section/item types
 */
export const CVDocument = ({ cvData, lang = 'es' }) => {
  const data = cvData || {};
  const layout = data.layout || {};
  const is2Col = layout.type !== '1-column';

  // 1. Data Normalization: merge cvData.profile into profile_header
  const rawSections = Array.isArray(data.sections) ? data.sections : [];
  const sections = data.profile
    ? rawSections.map(sec => {
        if (sec.id === 'profile_header' || sec.type === 'profile_header') {
          const firstItem = (sec.items && sec.items[0]) ? { ...sec.items[0] } : {};
          const mergedItem = {
            ...firstItem,
            ...(data.profile.name !== undefined ? { name: data.profile.name } : {}),
            ...(data.profile.subtitle !== undefined ? { subtitle: data.profile.subtitle } : {}),
            ...(data.profile.location !== undefined ? { location: data.profile.location } : {}),
            ...(data.profile.email !== undefined ? { email: data.profile.email } : {}),
            ...(data.profile.phone !== undefined ? { phone: data.profile.phone } : {}),
            ...(data.profile.linkedin !== undefined ? { linkedin: data.profile.linkedin } : {}),
            ...(data.profile.github !== undefined ? { github: data.profile.github } : {}),
          };
          return { ...sec, items: [mergedItem, ...(sec.items ? sec.items.slice(1) : [])] };
        }
        return sec;
      })
    : rawSections;

  // 2. Layout Geometry & Colors
  const leftColWidthPercent = Number(layout.leftColumnWidth) || 33.33;
  const leftBg = layout.leftBg || '#fafafa';
  const rightBg = layout.rightBg || '#ffffff';

  const leftColors = getDynamicTextColors(leftBg);
  const rightColors = getDynamicTextColors(rightBg);

  const fontSizes = computePdfFontSizes(layout);
  const spacing = computePdfSpacing(layout);
  const styles = createCvStyles(layout);

  // 3. Section Column Filtering
  const leftSections = sections.filter(s => s.column === 'left');
  const rightSections = sections.filter(s => s.column === 'right');

  return (
    <Document
      title={data.profile?.name ? `CV - ${data.profile.name}` : 'Curriculum Vitae'}
      author={data.profile?.name || 'Ressume'}
      subject="Curriculum Vitae"
      creator="Ressume CV Editor"
    >
      <Page size="A4" style={styles.page}>
        {is2Col ? (
          /* ======================================================
             2-COLUMN LAYOUT (Visual Recruiter)
             ====================================================== */
          <View style={styles.twoColumnRow}>
            {/* Left Column */}
            <View
              style={[
                styles.leftColumn,
                {
                  width: `${leftColWidthPercent}%`,
                  backgroundColor: leftBg,
                }
              ]}
            >
              {leftSections.map(section => (
                <CVSectionPdf
                  key={section.id}
                  section={section}
                  colors={leftColors}
                  fontSizes={fontSizes}
                  spacing={spacing}
                  styles={styles}
                />
              ))}
            </View>

            {/* Right Column */}
            <View
              style={[
                styles.rightColumn,
                {
                  width: `${100 - leftColWidthPercent}%`,
                  backgroundColor: rightBg,
                }
              ]}
            >
              {rightSections.map(section => (
                <CVSectionPdf
                  key={section.id}
                  section={section}
                  colors={rightColors}
                  fontSizes={fontSizes}
                  spacing={spacing}
                  styles={styles}
                />
              ))}
            </View>
          </View>
        ) : (
          /* ======================================================
             1-COLUMN ATS OPTIMIZED LAYOUT
             ====================================================== */
          <View style={styles.singleColumnContainer}>
            {sections.map(section => (
              <CVSectionPdf
                key={section.id}
                section={section}
                colors={rightColors}
                fontSizes={fontSizes}
                spacing={spacing}
                styles={styles}
              />
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
};

export default CVDocument;
