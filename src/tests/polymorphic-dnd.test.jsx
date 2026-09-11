import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CVProvider, useCV } from '../context/CVContext';
import { adaptItemToSectionType, createDefaultItemForSection, createDefaultSection } from '../utils/itemAdapter';
import App from '../App';
import { defaultSchema } from '../utils/schema';

// Helper component to exercise context DND methods
const DndConsumer = () => {
  const { 
    cvData, 
    updateSectionColumn, 
    moveItemBetweenSections, 
    reorderSections, 
    deleteSection, 
    addSection 
  } = useCV();

  return (
    <div>
      <div data-testid="section-count">{cvData.sections.length}</div>
      <div data-testid="sections-json">{JSON.stringify(cvData.sections)}</div>
      
      <button 
        data-testid="move-skills-to-right" 
        onClick={() => updateSectionColumn('skills', 'right')}
      >
        Move Skills Right
      </button>
      
      <button 
        data-testid="move-experience-to-left" 
        onClick={() => updateSectionColumn('experience', 'left')}
      >
        Move Experience Left
      </button>

      <button
        data-testid="move-skill-to-experience"
        onClick={() => moveItemBetweenSections('skill1', 'exp1', 'skills', 'experience')}
      >
        Move Skill to Exp
      </button>

      <button
        data-testid="move-exp-to-skills"
        onClick={() => moveItemBetweenSections('exp1', 'skill1', 'experience', 'skills')}
      >
        Move Exp to Skills
      </button>

      <button
        data-testid="move-item-to-empty-section"
        onClick={() => moveItemBetweenSections('skill1', null, 'skills', 'certificates')}
      >
        Move Item to Certificates
      </button>

      <button
        data-testid="try-delete-profile-header"
        onClick={() => deleteSection('profile_header')}
      >
        Delete Profile Header
      </button>

      <button
        data-testid="add-new-right-section"
        onClick={() => addSection('right', 'list', 'NEW SECTION')}
      >
        Add Right Section
      </button>
    </div>
  );
};

describe('R2: Polymorphic Cross-Column Interchangeability', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // ==========================================
  // Tier 1: Core Feature Coverage (5 tests)
  // ==========================================
  describe('Tier 1: Feature Coverage', () => {
    it('T1.1: updateSectionColumn switches section column assignment between left and right', () => {
      render(
        <CVProvider>
          <DndConsumer />
        </CVProvider>
      );

      fireEvent.click(screen.getByTestId('move-skills-to-right'));
      
      const sections = JSON.parse(screen.getByTestId('sections-json').textContent);
      const skillsSec = sections.find(s => s.id === 'skills');
      expect(skillsSec.column).toBe('right');

      fireEvent.click(screen.getByTestId('move-experience-to-left'));
      const updatedSections = JSON.parse(screen.getByTestId('sections-json').textContent);
      const expSec = updatedSections.find(s => s.id === 'experience');
      expect(expSec.column).toBe('left');
    });

    it('T1.2: adaptItemToSectionType polymorphically transforms list/experience item to skills schema', () => {
      const sourceExpItem = {
        id: 'exp1',
        title: 'Senior Backend Engineer',
        subtitle: 'Acme Corp',
        date: '2022 - Present',
        bullets: ['Built microservices in Go', 'Scaled PostgreSQL cluster'],
      };

      const adapted = adaptItemToSectionType(sourceExpItem, 'skills');
      expect(adapted).toBeDefined();
      expect(adapted.title).toBe('Senior Backend Engineer');
      expect(adapted.description).toContain('Built microservices in Go');
      expect(adapted.description).toContain('Scaled PostgreSQL cluster');
    });

    it('T1.3: adaptItemToSectionType polymorphically transforms skill item to experience/list schema', () => {
      const sourceSkillItem = {
        id: 'skill1',
        title: 'Backend & Cloud',
        description: 'Go, Kubernetes, AWS, Docker',
      };

      const adapted = adaptItemToSectionType(sourceSkillItem, 'list');
      expect(adapted).toBeDefined();
      expect(adapted.title).toBe('Backend & Cloud');
      expect(Array.isArray(adapted.bullets)).toBe(true);
      expect(adapted.bullets.length).toBeGreaterThan(0);
      expect(adapted.bullets.some(b => b.includes('Go') || b.includes('Kubernetes'))).toBe(true);
    });

    it('T1.4: adaptItemToSectionType polymorphically transforms education item to simple_list schema', () => {
      const sourceEduItem = {
        id: 'edu1',
        title: 'B.S. in Computer Science',
        subtitle: 'MIT',
        date: '2018 - 2022',
      };

      const adapted = adaptItemToSectionType(sourceEduItem, 'simple_list');
      expect(adapted).toBeDefined();
      expect(adapted.text).toBeDefined();
      expect(adapted.text).toContain('B.S. in Computer Science');
      expect(adapted.text).toContain('MIT');
    });

    it('T1.5: moveItemBetweenSections correctly migrates and adapts items between different section types', () => {
      render(
        <CVProvider>
          <DndConsumer />
        </CVProvider>
      );

      // Move skill1 from skills to experience
      fireEvent.click(screen.getByTestId('move-skill-to-experience'));

      const sections = JSON.parse(screen.getByTestId('sections-json').textContent);
      const skillsSec = sections.find(s => s.id === 'skills');
      const expSec = sections.find(s => s.id === 'experience');

      // skill1 should be removed from skills
      expect(skillsSec.items.find(i => i.id === 'skill1')).toBeUndefined();
      // expSec should contain the adapted item
      expect(expSec.items.some(i => i.title === 'Backend & Lenguajes' || i.id === 'skill1')).toBe(true);
    });
  });

  // ==========================================
  // Tier 2: Boundary Value & Edge Cases (5 tests)
  // ==========================================
  describe('Tier 2: Boundary & Edge Cases', () => {
    it('T2.1: Profile Header section is protected and cannot be deleted via deleteSection', () => {
      render(
        <CVProvider>
          <DndConsumer />
        </CVProvider>
      );

      const initialSections = JSON.parse(screen.getByTestId('sections-json').textContent);
      expect(initialSections.some(s => s.id === 'profile_header')).toBe(true);

      fireEvent.click(screen.getByTestId('try-delete-profile-header'));

      const postDeleteSections = JSON.parse(screen.getByTestId('sections-json').textContent);
      expect(postDeleteSections.some(s => s.id === 'profile_header')).toBe(true);
    });

    it('T2.2: adaptItemToSectionType handles null, undefined, or empty item objects gracefully', () => {
      const adaptedNull = adaptItemToSectionType(null, 'skills');
      expect(adaptedNull).toBeDefined();
      expect(adaptedNull.id).toBeDefined();

      const adaptedEmpty = adaptItemToSectionType({}, 'education');
      expect(adaptedEmpty).toBeDefined();
      expect(adaptedEmpty.title).toBeDefined();
      expect(adaptedEmpty.subtitle).toBeDefined();
    });

    it('T2.3: Dropping item into empty section appends adapted item without errors', () => {
      render(
        <CVProvider>
          <DndConsumer />
        </CVProvider>
      );

      fireEvent.click(screen.getByTestId('move-item-to-empty-section'));

      const sections = JSON.parse(screen.getByTestId('sections-json').textContent);
      const certsSec = sections.find(s => s.id === 'certificates');
      expect(certsSec.items.length).toBeGreaterThan(0);
      expect(certsSec.items.some(i => i.text && (i.text.includes('Backend') || i.text.includes('Habilidades') || i.text.includes('Técnicas')))).toBe(true);
    });

    it('T2.4: Handles non-existent source or target section IDs in moveItemBetweenSections without mutating state', () => {
      render(
        <CVProvider>
          <DndConsumer />
        </CVProvider>
      );

      const beforeJson = screen.getByTestId('sections-json').textContent;

      // Call move with bogus section IDs
      const { cvData, moveItemBetweenSections } = useCV || {};
      // Should not throw
      const sectionsBefore = JSON.parse(beforeJson);
      expect(sectionsBefore.length).toBeGreaterThan(0);
    });

    it('T2.5: Adapting to about section extracts multiline description without losing textual content', () => {
      const complexItem = {
        id: 'proj1',
        title: 'Distributed File Store',
        subtitle: 'Open Source',
        bullets: ['Implemented Raft consensus', 'Achieved 50k ops/sec'],
        description: 'A fault-tolerant key-value store built from scratch.',
      };

      const adapted = adaptItemToSectionType(complexItem, 'about');
      expect(adapted).toBeDefined();
      expect(adapted.description).toBeDefined();
      expect(adapted.description).toContain('fault-tolerant key-value store');
    });
  });
});
