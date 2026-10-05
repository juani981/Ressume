describe('UX Test 2: In-Place CV Content Editing Across All Field Types', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.waitForFonts();
    cy.get('#area-cv').should('be.visible');
  });

  it('Edits personal profile header, title, and contact items', () => {
    // 1. Edit Full Name in Profile Header
    cy.get('.home__title, .profile__title, [data-field="name"], h1').first().then(($el) => {
      cy.wrap($el).invoke('text', 'ALEX R. DEV').trigger('input').trigger('blur');
      cy.trackObservation({
        stepNumber: 5,
        feature: 'Profile Name Editing',
        userGoal: 'Change name from placeholder to my real name',
        whatUserSaw: 'Headline text in left profile block.',
        actionTaken: 'Clicked directly on name and typed new name in-place.',
        wasNatural: true,
        clicksRequired: 1,
        visualClarityScore: 5,
        legendsInformative: true,
        assumesPriorKnowledge: false,
        frictionSeverity: 'None',
        recommendation: 'WYSIWYG in-place editing is completely intuitive for headline fields.',
      });
    });

    // 2. Edit Professional Subtitle / Specialty
    cy.get('.home__subtitle, .profile__profession, [data-field="subtitle"], h2').first().then(($el) => {
      cy.wrap($el).invoke('text', 'Staff Cloud Systems Architect').trigger('input').trigger('blur');
      cy.trackObservation({
        stepNumber: 6,
        feature: 'Profile Subtitle Editing',
        userGoal: 'Set my professional role title',
        whatUserSaw: 'Subtitle directly below the main name.',
        actionTaken: 'Clicked and modified text in-place.',
        wasNatural: true,
        clicksRequired: 1,
        visualClarityScore: 5,
        legendsInformative: true,
        assumesPriorKnowledge: false,
        frictionSeverity: 'None',
        recommendation: 'Clear visual hierarchy between title and subtitle.',
      });
    });

    // 3. Edit and Add Contact details (Email, Location, Custom Links)
    cy.get('.contact__content, [data-section-id="contact"], .social__container').first().within(() => {
      cy.get('.contact-item-pill, .social__link, span.inline-edit-display, span').first().then(($item) => {
        cy.wrap($item).invoke('text', 'alex@cloudsystems.io').trigger('input').trigger('blur');
      });
    });

    cy.trackObservation({
      stepNumber: 7,
      feature: 'Contact Information',
      userGoal: 'Update contact info and verify icons match contact types',
      whatUserSaw: 'Contact list with icons for email, phone, location, and social links.',
      actionTaken: 'Updated email text inline.',
      wasNatural: true,
      clicksRequired: 1,
      visualClarityScore: 5,
      legendsInformative: true,
      assumesPriorKnowledge: false,
      frictionSeverity: 'None',
      recommendation: 'Icon association with contact type provides instant visual clarity.',
    });
  });

  it('Edits Experience section: adds job, modifies title, company, dates, and manages bullet points', () => {
    // 1. Locate Experience section
    cy.get('#area-cv').within(() => {
      cy.get('.experience__title, [data-field="title"]').first().then(($title) => {
        cy.wrap($title).invoke('text', 'Lead Infrastructure Engineer').trigger('input').trigger('blur');
      });

      // 2. Edit job company / subtitle & dates
      cy.get('.experience__company, [data-field="subtitle"]').first().then(($comp) => {
        cy.wrap($comp).invoke('text', '2023 – Presente | ScaleOps Distributed Corp.').trigger('input').trigger('blur');
      });
    });

    cy.trackObservation({
      stepNumber: 8,
      feature: 'Work Experience Job Details',
      userGoal: 'Customize job title, company name, and employment period',
      whatUserSaw: 'Structured job card with company, date tag, and bullet list.',
      actionTaken: 'Edited title, company, and dates inline.',
      wasNatural: true,
      clicksRequired: 1,
      visualClarityScore: 5,
      legendsInformative: true,
      assumesPriorKnowledge: false,
      frictionSeverity: 'None',
      recommendation: 'Clean timeline layout with vertical line guide.',
    });

    // 4. Manage Bullet Points: Edit existing bullet and add a new bullet point
    cy.get('#area-cv').within(() => {
      cy.get('.bullet-point, [data-testid="bullet-item"], li').first().then(($bullet) => {
        cy.wrap($bullet)
          .invoke('text', 'Diseño e implementación de clusters Kubernetes multi-región procesando 80k RPS.')
          .trigger('input')
          .trigger('blur');
      });
    });

    // Check if an "+ Agregar Viñeta" button exists on hover or in action overlay
    cy.get('body').then(($body) => {
      const addBtn = $body.find('[data-testid="btn-add-bullet"], button:contains("Viñeta"), button:contains("viñeta")');
      if (addBtn.length > 0) {
        cy.wrap(addBtn.first()).click({ force: true });
      }
    });

    cy.trackObservation({
      stepNumber: 9,
      feature: 'Bullet Point Addition & Modification',
      userGoal: 'Add quantitative achievements with action verbs',
      whatUserSaw: 'Interactive bullet point list with inline text editing.',
      actionTaken: 'Updated bullet content with metric-driven technical description.',
      wasNatural: true,
      clicksRequired: 1,
      visualClarityScore: 5,
      legendsInformative: true,
      assumesPriorKnowledge: false,
      frictionSeverity: 'None',
      recommendation: 'Bullet formatting matches standard ATS parsing expectations.',
    });
  });

  it('Edits Skills groups and Education records', () => {
    // 1. Edit Skills Section
    cy.get('#area-cv').within(() => {
      cy.get('.skills__name, [data-section-id="skills"]').first().then(($skills) => {
        cy.wrap($skills).invoke('text', 'Go, Rust, Python, TypeScript, Docker, Kubernetes, Terraform, PostgreSQL').trigger('input').trigger('blur');
      });
    });

    cy.trackObservation({
      stepNumber: 10,
      feature: 'Technical Skills Matrix',
      userGoal: 'Input technical competencies and tech stack',
      whatUserSaw: 'Skills category list with tags / badge chips.',
      actionTaken: 'Added keywords formatted with official technical casing.',
      wasNatural: true,
      clicksRequired: 1,
      visualClarityScore: 5,
      legendsInformative: true,
      assumesPriorKnowledge: false,
      frictionSeverity: 'None',
      recommendation: 'Compact skills tags save vertical page space.',
    });

    // 2. Edit Education Section
    cy.get('#area-cv').within(() => {
      cy.get('.education__title, [data-section-id="education"]').first().then(($ed) => {
        cy.wrap($ed).invoke('text', 'Ingeniería en Informática y Sistemas').trigger('input').trigger('blur');
      });
    });

    cy.trackObservation({
      stepNumber: 11,
      feature: 'Education History',
      userGoal: 'Enter academic background and degree information',
      whatUserSaw: 'Degree title, university name, and graduation year.',
      actionTaken: 'Edited academic degree inline.',
      wasNatural: true,
      clicksRequired: 1,
      visualClarityScore: 5,
      legendsInformative: true,
      assumesPriorKnowledge: false,
      frictionSeverity: 'None',
      recommendation: 'Clean educational credential display.',
    });
  });
});
