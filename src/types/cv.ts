/**
 * Core CV document types — Single Source of Truth for the TypeScript migration.
 * Mirrors the runtime shape enforced by src/utils/schema.js + cvSchemaValidator.js.
 */

export type ColumnId = 'left' | 'right' | 'single';
export type LayoutType = '1-column' | '2-column';

export interface CVProfile {
  name?: string;
  subtitle?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  description?: string;
  photo?: string;
  [key: string]: unknown;
}

export interface CVLayout {
  type?: LayoutType;
  isAtsMode?: boolean;
  leftColumnWidth?: number | null;
  fontFamily?: string;
  fontScale?: number;
  titleScale?: number;
  bodyScale?: number;
  listScale?: number;
  lineHeight?: number;
  pagePadding?: number;
  sectionGap?: number;
  itemGap?: number;
  leftBg?: string;
  rightBg?: string;
  language?: string;
  [key: string]: unknown;
}

export interface CVItem {
  id: string;
  title?: string;
  subtitle?: string;
  [key: string]: unknown;
}

export interface CVSection {
  id: string;
  column: ColumnId;
  type: string;
  title?: string;
  items: CVItem[];
  bulletStyle?: string;
  bottomSpacing?: number;
  page?: number;
  targetPage?: number;
  breakBefore?: boolean;
  [key: string]: unknown;
}

export interface CVData {
  profile: CVProfile;
  layout: CVLayout;
  sections: CVSection[];
}

export interface PageModel {
  pageNumber: number;
  totalPages: number;
  isLastPage: boolean;
  leftSections: CVSection[];
  rightSections: CVSection[];
  singleSections: CVSection[];
}

export type SectionDescriptor = {
  type: string;
  label?: string;
  defaultTitle?: string;
  defaultColumn?: ColumnId;
  icon?: string;
  [key: string]: unknown;
};
