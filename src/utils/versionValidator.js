/**
 * src/utils/versionValidator.js
 *
 * Validates and sanitizes a candidate CV data snapshot against defaultSchema.
 * Guarantees profile, layout, sections array, and item IDs are robustly formed.
 * Safely recovers from null, primitive, or corrupt snapshots.
 */

import { defaultSchema } from './schema.js';

/**
 * Validates and sanitizes a candidate CV data snapshot.
 * Merges missing properties with defaultSchema to guarantee application stability.
 *
 * @param {any} snapshot - The candidate snapshot to validate.
 * @returns {object} - Sanitized CV data object.
 */
export function sanitizeAndValidateCVSnapshot(snapshot) {
  const safeSnapshot = (snapshot && typeof snapshot === 'object' && !Array.isArray(snapshot))
    ? snapshot
    : {};

  try {
    // 1. Sanitize Profile
    const rawProfile = safeSnapshot.profile && typeof safeSnapshot.profile === 'object' && !Array.isArray(safeSnapshot.profile)
      ? safeSnapshot.profile
      : {};

    const profile = {
      ...(defaultSchema.profile || {}),
      ...rawProfile,
    };

    // Ensure profile has a valid, non-empty name
    if (typeof profile.name !== 'string' || !profile.name.trim()) {
      profile.name = defaultSchema.profile?.name || 'Nombre Profesional';
    } else {
      profile.name = profile.name.trim();
    }

    // 2. Sanitize Layout
    const rawLayout = safeSnapshot.layout && typeof safeSnapshot.layout === 'object' && !Array.isArray(safeSnapshot.layout)
      ? safeSnapshot.layout
      : {};

    const layout = {
      ...(defaultSchema.layout || {}),
      ...rawLayout,
    };

    // Guarantee layout.type is '1-column' or '2-column'
    if (layout.type !== '1-column' && layout.type !== '2-column') {
      layout.type = layout.isAtsMode ? '1-column' : (defaultSchema.layout?.type || '2-column');
    }
    layout.isAtsMode = Boolean(layout.isAtsMode);

    // Ensure layout styling numerical bounds and defaults
    if (typeof layout.pagePadding !== 'number' || isNaN(layout.pagePadding)) {
      layout.pagePadding = defaultSchema.layout?.pagePadding ?? 24;
    }
    if (typeof layout.sectionGap !== 'number' || isNaN(layout.sectionGap)) {
      layout.sectionGap = defaultSchema.layout?.sectionGap ?? 20;
    }
    if (typeof layout.itemGap !== 'number' || isNaN(layout.itemGap)) {
      layout.itemGap = defaultSchema.layout?.itemGap ?? 8;
    }
    if (!layout.fontFamily) {
      layout.fontFamily = defaultSchema.layout?.fontFamily || 'Poppins';
    }

    // 3. Sanitize Sections Array
    let rawSections = safeSnapshot.sections;
    if (!Array.isArray(rawSections) || rawSections.length === 0) {
      rawSections = defaultSchema.sections || [];
    }

    const seenItemIds = new Set();
    const seenSectionIds = new Set();

    const sanitizedSections = rawSections
      .filter((sec) => sec && typeof sec === 'object' && !Array.isArray(sec))
      .map((sec, secIndex) => {
        // Guarantee section ID
        let secId = typeof sec.id === 'string' && sec.id.trim() ? sec.id.trim() : `sec_${secIndex}_${Date.now()}`;
        if (seenSectionIds.has(secId)) {
          secId = `${secId}_${secIndex}`;
        }
        seenSectionIds.add(secId);

        // Guarantee column ('left' | 'right')
        const column = sec.column === 'right' ? 'right' : 'left';

        // Guarantee type
        const type = typeof sec.type === 'string' && sec.type.trim() ? sec.type.trim() : 'list';

        // Guarantee title
        const title = typeof sec.title === 'string' ? sec.title : '';

        // Guarantee items array with unique IDs
        const rawItems = Array.isArray(sec.items) ? sec.items : [];
        const sanitizedItems = rawItems
          .filter((item) => item && typeof item === 'object' && !Array.isArray(item))
          .map((item, itemIndex) => {
            let itemId = typeof item.id === 'string' && item.id.trim() ? item.id.trim() : '';
            if (!itemId || seenItemIds.has(itemId)) {
              itemId = `${secId}_item_${itemIndex}_${Math.random().toString(36).substring(2, 7)}`;
            }
            seenItemIds.add(itemId);

            return {
              ...item,
              id: itemId,
            };
          });

        return {
          ...sec,
          id: secId,
          column,
          type,
          title,
          items: sanitizedItems,
        };
      });

    // Ensure profile_header section exists
    const hasHeader = sanitizedSections.some((s) => s.id === 'profile_header' || s.type === 'profile_header');
    let finalSections = sanitizedSections;

    if (!hasHeader && defaultSchema.sections && defaultSchema.sections[0]) {
      const defaultHeader = defaultSchema.sections[0];
      finalSections = [
        {
          ...defaultHeader,
          items: (defaultHeader.items || []).map((it) => ({
            ...it,
            name: profile.name,
          })),
        },
        ...sanitizedSections,
      ];
    } else {
      // Synchronize profile.name with profile_header section item if needed
      finalSections = finalSections.map((sec) => {
        if (sec.id === 'profile_header' || sec.type === 'profile_header') {
          if (sec.items && sec.items.length > 0) {
            const firstItem = { ...sec.items[0] };
            if (!firstItem.name && profile.name) {
              firstItem.name = profile.name;
            }
            return {
              ...sec,
              items: [firstItem, ...sec.items.slice(1)],
            };
          }
        }
        return sec;
      });
    }

    return {
      ...safeSnapshot,
      profile,
      layout,
      sections: finalSections,
    };
  } catch (err) {
    console.error('Snapshot validation failed:', err);
    return JSON.parse(JSON.stringify(defaultSchema));
  }
}

export default sanitizeAndValidateCVSnapshot;
