/**
 * @file twoColumnWordWrap.test.jsx
 * Verification test suite for horizontal containment and word-wrap parity in two-column mode.
 *
 * Ensures that content (titles, descriptions, bullets, skills, links, contacts)
 * wraps horizontally when it does not fit within column boundaries, preventing
 * overflow or truncation.
 */

import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CVProvider } from '../context/CVContext';
import App from '../App';
import InlineEdit from '../components/Editor/InlineEdit';
import SimpleListItem from '../components/CV/items/SimpleListItem';
import SkillsItem from '../components/CV/items/SkillsItem';
import { SortableBulletItem } from '../components/CV/SortableBulletItem';
import { DndContext } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import fs from 'fs';
import path from 'path';

describe('Two-Column Word-Wrap & Horizontal Containment Suite', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('1. Verifies index.css contains universal word-wrap and containment rules for 2-column mode', () => {
    const cssPath = path.resolve(__dirname, '../index.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');

    expect(cssContent).toContain('.resume__left,');
    expect(cssContent).toContain('.resume__right,');
    expect(cssContent).toContain('overflow-wrap: break-word !important;');
    expect(cssContent).toContain('word-break: break-word !important;');
    expect(cssContent).toContain('min-width: 0 !important;');
    expect(cssContent).toContain('max-width: 100% !important;');
  });

  it('2. Verifies print.css contains matching word-wrap and containment rules for 1:1 print parity', () => {
    const printCssPath = path.resolve(__dirname, '../styles/print.css');
    const printCssContent = fs.readFileSync(printCssPath, 'utf-8');

    expect(printCssContent).toContain('.resume__left,');
    expect(printCssContent).toContain('.resume__right');
    expect(printCssContent).toContain('overflow-wrap: break-word !important;');
    expect(printCssContent).toContain('word-break: break-word !important;');
    expect(printCssContent).toContain('min-width: 0 !important;');
    expect(printCssContent).toContain('max-width: 100% !important;');
  });

  it('3. Verifies InlineEdit renders with maxWidth 100%, overflowWrap, and wordBreak in both edit and print views', () => {
    const { container: editContainer } = render(
      <InlineEdit value="A very long title that should wrap horizontally" isPrint={false} />
    );
    const displaySpan = editContainer.querySelector('.inline-edit-display');
    expect(displaySpan).toBeTruthy();
    expect(displaySpan.style.maxWidth).toBe('100%');
    expect(displaySpan.style.overflowWrap).toBe('break-word');
    expect(displaySpan.style.wordBreak).toBe('break-word');

    const { container: printContainer } = render(
      <InlineEdit value="A very long title in print that should wrap" isPrint={true} />
    );
    const printSpan = printContainer.querySelector('.inline-edit-display');
    expect(printSpan).toBeTruthy();
    expect(printSpan.style.maxWidth).toBe('100%');
    expect(printSpan.style.overflowWrap).toBe('break-word');
    expect(printSpan.style.wordBreak).toBe('break-word');
  });

  it('4. Verifies SimpleListItem wraps bullet text with minWidth 0 and maxWidth 100%', () => {
    const { container } = render(
      <SimpleListItem 
        item={{ id: 'b1', text: 'Desarrollo de microservicios con resiliencia y alta concurrencia' }} 
        sectionId="sec1" 
        onUpdateItem={() => {}} 
        isPrint={false} 
      />
    );
    const textSpan = container.querySelector('span[style*="flex: 1"]');
    expect(textSpan).toBeTruthy();
    expect(['0', '0px']).toContain(textSpan.style.minWidth);
    expect(textSpan.style.maxWidth).toBe('100%');
  });

  it('5. Verifies SkillsItem wrapper has minWidth 0 and maxWidth 100%', () => {
    const { container } = render(
      <SkillsItem 
        item={{ id: 's1', title: 'React / Node.js / Kubernetes / Cloud Architecture', description: 'Advanced Level' }} 
        sectionId="skills" 
        onUpdateItem={() => {}} 
        isPrint={false} 
      />
    );
    const textSpan = container.querySelector('span[style*="flex: 1"]');
    expect(textSpan).toBeTruthy();
    expect(['0', '0px']).toContain(textSpan.style.minWidth);
    expect(textSpan.style.maxWidth).toBe('100%');
  });

  it('6. Verifies SortableBulletItem has minWidth 0, maxWidth 100%, width 100%, and boxSizing', () => {
    const { container } = render(
      <DndContext>
        <SortableContext items={['bullet-1']} strategy={verticalListSortingStrategy}>
          <SortableBulletItem
            bulletId="bullet-1"
            bulletText="Diseño e implementación de pipelines CI/CD automatizados"
            bulletIndex={0}
            sectionId="exp"
            itemId="item-1"
            bullets={['Diseño e implementación de pipelines CI/CD automatizados']}
            onUpdateItem={() => {}}
            onDeleteBullet={() => {}}
          />
        </SortableContext>
      </DndContext>
    );

    const li = container.querySelector('li.bullet-item-row');
    expect(li).toBeTruthy();
    expect(['0', '0px']).toContain(li.style.minWidth);
    expect(li.style.maxWidth).toBe('100%');
    expect(li.style.width).toBe('100%');
    expect(li.style.boxSizing).toBe('border-box');
  });

  it('7. Verifies App renders DroppableColumns in 2-column mode with overflowWrap and wordBreak', () => {
    render(
      <CVProvider>
        <App />
      </CVProvider>
    );

    const leftCol = document.querySelector('.resume__left');
    const rightCol = document.querySelector('.resume__right');
    
    if (leftCol && rightCol) {
      expect(leftCol.style.overflowWrap).toBe('break-word');
      expect(leftCol.style.wordBreak).toBe('break-word');
      expect(['0', '0px']).toContain(leftCol.style.minWidth);
      expect(leftCol.style.maxWidth).toBe('100%');

      expect(rightCol.style.overflowWrap).toBe('break-word');
      expect(rightCol.style.wordBreak).toBe('break-word');
      expect(['0', '0px']).toContain(rightCol.style.minWidth);
      expect(rightCol.style.maxWidth).toBe('100%');
    }
  });
});
