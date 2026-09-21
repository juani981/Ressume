/**
 * @file photoComponentAndSliders.test.jsx
 * @description Dedicated automated tests for:
 * 1. PhotoItem component and 'photo' section registration (Open/Closed architecture).
 * 2. Typography sliders range starting at 0.50 and real-time pixel (px) calculation display.
 * 3. Print engine integration rendering photo cleanly without editor artifacts.
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PhotoItem from '../components/CV/items/PhotoItem';
import { getSectionDescriptor, createDefaultItem } from '../registry/sectionRegistry';
import { CVProvider } from '../context/CVContext';
import ActionMenu from '../components/Editor/ActionMenu';
import { generateCleanPrintHTML } from '../utils/staticHtmlPdfEngine';

describe('Photo Component & Registry Integration', () => {
  it('registers the "photo" section descriptor in sectionRegistry', () => {
    const desc = getSectionDescriptor('photo');
    expect(desc).toBeDefined();
    expect(desc.type).toBe('photo');
    expect(desc.label).toBe('Foto de Perfil');
    expect(desc.defaultColumn).toBe('left');
    expect(desc.hasTitle).toBe(false);
    expect(desc.itemComponent).toBeDefined();
  });

  it('creates default photo item adhering to schema', () => {
    const item = createDefaultItem('photo');
    expect(item).toBeDefined();
    expect(item.shape).toBe('circle');
    expect(item.size).toBe(130);
    expect(item.url).toBe('');
  });

  it('renders PhotoItem in Print mode as pure image without editor controls', () => {
    const item = {
      id: 'photo_test_1',
      url: 'https://example.com/avatar.jpg',
      shape: 'circle',
      size: 140,
      alt: 'Foto de Juan'
    };

    const { container } = render(
      <PhotoItem item={item} sectionId="sec_photo" isPrint={true} />
    );

    const img = container.querySelector('img');
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe('https://example.com/avatar.jpg');
    expect(img.getAttribute('alt')).toBe('Foto de Juan');
    expect(img.style.borderRadius).toBe('50%');
    expect(img.style.width).toBe('140px');
    expect(img.style.height).toBe('140px');

    // Asserts zero editor controls in print mode
    expect(container.querySelector('input')).toBeNull();
    expect(container.querySelector('button')).toBeNull();
    expect(container.querySelector('[data-editor-ui="true"]')).toBeNull();
  });

  it('renders PhotoItem rounded shape correctly in print mode', () => {
    const item = {
      id: 'photo_test_2',
      url: 'https://example.com/rounded.png',
      shape: 'rounded',
      size: 120
    };

    const { container } = render(
      <PhotoItem item={item} sectionId="sec_photo" isPrint={true} />
    );

    const img = container.querySelector('img');
    expect(img).toBeTruthy();
    expect(img.style.borderRadius).toBe('12px');
  });

  it('renders PhotoItem in Edit mode with upload, shape, and size controls', () => {
    const item = {
      id: 'photo_test_3',
      url: '',
      shape: 'circle',
      size: 130
    };

    render(
      <CVProvider>
        <PhotoItem item={item} sectionId="sec_photo" isPrint={false} />
      </CVProvider>
    );

    expect(screen.getByTestId('photo-file-input')).toBeTruthy();
    expect(screen.getByTestId('photo-upload-btn')).toBeTruthy();
    expect(screen.getByTestId('photo-url-input')).toBeTruthy();
    expect(screen.getByTestId('shape-circle-btn')).toBeTruthy();
    expect(screen.getByTestId('shape-rounded-btn')).toBeTruthy();
    expect(screen.getByTestId('shape-square-btn')).toBeTruthy();
    expect(screen.getByTestId('photo-size-select')).toBeTruthy();
  });

  it('keeps controls floating on hover without expanding document flow when mouse is away', () => {
    const item = {
      id: 'photo_test_4',
      url: 'https://example.com/avatar.jpg',
      shape: 'circle',
      size: 130
    };

    const { container } = render(
      <CVProvider>
        <PhotoItem item={item} sectionId="sec_photo" isPrint={false} />
      </CVProvider>
    );

    const editContainer = container.querySelector('.cv-photo-item-edit');
    expect(editContainer).toBeTruthy();
    expect(editContainer.style.position).toBe('relative');

    const floatingControls = container.querySelector('.cv-photo-controls-floating');
    expect(floatingControls).toBeTruthy();
    expect(floatingControls.style.position).toBe('absolute');

    // Initially not hovered
    expect(floatingControls.classList.contains('is-visible')).toBe(false);

    // Hover container: triggers visible floating controls
    fireEvent.mouseEnter(editContainer);
    expect(floatingControls.classList.contains('is-visible')).toBe(true);

    // Mouse leave container: floating controls hide
    fireEvent.mouseLeave(editContainer);
    expect(floatingControls.classList.contains('is-visible')).toBe(false);
  });
});

describe('Typography Sliders: Min 0.50 and Pixel Display', () => {
  it('configures typography sliders to begin at 0.50', () => {
    render(
      <CVProvider>
        <ActionMenu />
      </CVProvider>
    );

    // Open Diseño panel
    const designBtn = screen.getByTestId('btn-open-design');
    fireEvent.click(designBtn);

    const titleSlider = screen.getByTestId('slider-title-scale');
    const bodySlider = screen.getByTestId('slider-body-scale');
    const listSlider = screen.getByTestId('slider-list-scale');
    const fontSlider = screen.getByTestId('slider-font-scale');

    expect(Number(titleSlider.getAttribute('min'))).toBe(0.5);
    expect(Number(bodySlider.getAttribute('min'))).toBe(0.5);
    expect(Number(listSlider.getAttribute('min'))).toBe(0.5);
    expect(Number(fontSlider.getAttribute('min'))).toBe(0.5);
  });

  it('displays calculated pixel (px) feedback for typography sliders', () => {
    const { container } = render(
      <CVProvider>
        <ActionMenu />
      </CVProvider>
    );

    // Open Diseño panel
    const designBtn = screen.getByTestId('btn-open-design');
    fireEvent.click(designBtn);

    const panelText = container.textContent;

    // Checks that pixel indicators (px) are rendered alongside scales
    expect(panelText).toContain('px');
    expect(panelText).toMatch(/H1:\s*~\d+px/);
    expect(panelText).toMatch(/Base:\s*~\d+px/);
  });
});

describe('Print Engine Integration with Photo Section', () => {
  it('generates clean print HTML containing the photo image and 0 editor artifacts', () => {
    const cvData = {
      profile: { name: 'Juan Ignacio Carrizo', subtitle: 'Software Architect' },
      layout: {
        type: '2-column',
        fontFamily: 'Poppins',
        fontScale: 1.0,
        titleScale: 1.0,
        bodyScale: 1.0,
        listScale: 1.0,
        lineHeight: 1.5,
        pagePadding: 24,
        sectionGap: 20,
        itemGap: 10,
        leftColumnWidth: 35,
        leftBg: '#ffffff',
        rightBg: '#ffffff'
      },
      sections: [
        {
          id: 'profile_photo_sec',
          type: 'photo',
          column: 'left',
          title: '',
          items: [
            {
              id: 'item_photo_1',
              url: 'https://example.com/profile.jpg',
              shape: 'circle',
              size: 130,
              alt: 'Juan Foto'
            }
          ]
        }
      ]
    };

    const html = generateCleanPrintHTML(cvData, 'es');

    expect(html).toContain('cv-photo-img');
    expect(html).toContain('https://example.com/profile.jpg');
    expect(html).not.toContain('photo-upload-btn');
    expect(html).not.toContain('photo-url-input');
    expect(html).not.toContain('photo-file-input');
    expect(html).not.toContain('drag-handle');
  });
});
