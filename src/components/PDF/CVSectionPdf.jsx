import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { CVItemPdf } from './CVItemPdf';

export const CVSectionPdf = ({ section, colors, fontSizes, spacing, styles }) => {
  if (!section) return null;

  const isProfile = section.type === 'profile_header';
  const isAbout = section.type === 'about';
  const items = section.items || [];

  // If section is a single-block type like about or profile_header, keep entire section atomic
  if (isProfile || isAbout) {
    return (
      <View wrap={false} style={styles.section}>
        {!isProfile && section.title && (
          <Text style={[styles.sectionTitle, { color: colors.titleColor }]}>
            {section.title}
          </Text>
        )}
        {items.map((item, idx) => (
          <CVItemPdf
            key={item.id || idx}
            item={item}
            sectionType={section.type}
            colors={colors}
            fontSizes={fontSizes}
            spacing={spacing}
            isLast={true}
          />
        ))}
      </View>
    );
  }

  // Super-container: Section Title + First Item are bound together in wrap={false}
  // This guarantees that section headers are never orphaned at the bottom of a page
  const firstItem = items[0];
  const remainingItems = items.slice(1);

  return (
    <View style={styles.section}>
      {firstItem && (
        <View wrap={false}>
          {section.title && (
            <Text style={[styles.sectionTitle, { color: colors.titleColor }]}>
              {section.title}
            </Text>
          )}
          <CVItemPdf
            item={firstItem}
            sectionType={section.type}
            colors={colors}
            fontSizes={fontSizes}
            spacing={spacing}
            isLast={items.length === 1}
          />
        </View>
      )}

      {/* Subsequent items paginate cleanly item-by-item without fracturing */}
      {remainingItems.map((item, idx) => (
        <View key={item.id || idx} wrap={false}>
          <CVItemPdf
            item={item}
            sectionType={section.type}
            colors={colors}
            fontSizes={fontSizes}
            spacing={spacing}
            isLast={idx === remainingItems.length - 1}
          />
        </View>
      ))}
    </View>
  );
};

export default CVSectionPdf;
