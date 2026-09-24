import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import AddBulletPoint from '../components/Editor/AddBulletPoint';
import ExperienceItem from '../components/CV/items/ExperienceItem';
import ProjectsItem from '../components/CV/items/ProjectsItem';
import VolunteeringItem from '../components/CV/items/VolunteeringItem';
import { CVProvider } from '../context/CVContext';
import App from '../App';

describe('AddBulletPoint Component and Bullet Point Addition Interactions', () => {
  it('AddBulletPoint invokes handleAddBullet callback when clicked', () => {
    const handleAddBullet = vi.fn();
    const { container } = render(
      <AddBulletPoint 
        helperText="Agregar nueva viñeta personalizada" 
        handleAddBullet={handleAddBullet} 
      />
    );

    const button = container.querySelector('.add-bullet-btn');
    expect(button).toBeInTheDocument();
    expect(button.getAttribute('title')).toBe('Agregar nueva viñeta personalizada');

    fireEvent.click(button);
    expect(handleAddBullet).toHaveBeenCalledTimes(1);
  });

  it('ExperienceItem adds a new bullet when .add-bullet-btn is clicked', () => {
    const onUpdateItem = vi.fn();
    const item = {
      id: 'exp-1',
      title: 'Software Developer',
      bullets: ['Existing bullet 1']
    };

    const { container } = render(
      <ExperienceItem 
        item={item} 
        sectionId="experience" 
        onUpdateItem={onUpdateItem} 
      />
    );

    const addBtn = container.querySelector('.add-bullet-btn');
    expect(addBtn).toBeInTheDocument();

    fireEvent.click(addBtn);

    expect(onUpdateItem).toHaveBeenCalledWith(
      'experience',
      'exp-1',
      'bullets',
      ['Existing bullet 1', 'Nuevo logro o responsabilidad']
    );
  });

  it('ProjectsItem adds a new bullet when .add-bullet-btn is clicked', () => {
    const onUpdateItem = vi.fn();
    const item = {
      id: 'proj-1',
      title: 'E-commerce App',
      bullets: ['Feature 1']
    };

    const { container } = render(
      <ProjectsItem 
        item={item} 
        sectionId="projects" 
        onUpdateItem={onUpdateItem} 
      />
    );

    const addBtn = container.querySelector('.add-bullet-btn');
    expect(addBtn).toBeInTheDocument();

    fireEvent.click(addBtn);

    expect(onUpdateItem).toHaveBeenCalledWith(
      'projects',
      'proj-1',
      'bullets',
      ['Feature 1', 'Logro o funcionalidad clave implementada']
    );
  });

  it('VolunteeringItem adds a new bullet when .add-bullet-btn is clicked', () => {
    const onUpdateItem = vi.fn();
    const item = {
      id: 'vol-1',
      title: 'Community Mentor',
      bullets: []
    };

    const { container } = render(
      <VolunteeringItem 
        item={item} 
        sectionId="volunteering" 
        onUpdateItem={onUpdateItem} 
      />
    );

    const addBtn = container.querySelector('.add-bullet-btn');
    expect(addBtn).toBeInTheDocument();

    fireEvent.click(addBtn);

    expect(onUpdateItem).toHaveBeenCalledWith(
      'volunteering',
      'vol-1',
      'bullets',
      ['Actividad o contribución voluntaria realizada']
    );
  });

  it('adds bullet point dynamically in App and updates the DOM list', () => {
    const { container } = render(
      <CVProvider>
        <App />
      </CVProvider>
    );

    const addBtns = container.querySelectorAll('.add-bullet-btn');
    expect(addBtns.length).toBeGreaterThan(0);

    const initialBulletCount = container.querySelectorAll('.bullet-item-row').length;

    // Click the first add-bullet button
    fireEvent.click(addBtns[0]);

    const updatedBulletCount = container.querySelectorAll('.bullet-item-row').length;
    expect(updatedBulletCount).toBe(initialBulletCount + 1);
  });
});
