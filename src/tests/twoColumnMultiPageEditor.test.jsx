import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { defaultSchema } from '../utils/schema';
import { useDocumentPages } from '../hooks/useDocumentPages';
import { renderHook } from '@testing-library/react';
import App from '../App';
import { CVProvider } from '../context/CVContext';

describe('Two-Column Multi-Page Dynamic Pagination in Editor', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('1. automatically generates 2 pages in 2-column mode when left column content overflows', () => {
    // Add multiple skills and education items to left column to exceed page 1 capacity
    const overflowLeftCv = {
      ...defaultSchema,
      sections: defaultSchema.sections.map((sec) => {
        if (sec.id === 'skills') {
          return {
            ...sec,
            items: [
              { id: 'sk1', title: 'Frontend Architecture', description: 'React, TypeScript, Next.js, Redux, Performance Optimization, Webpack, Vite, State Management' },
              { id: 'sk2', title: 'Backend Systems', description: 'Node.js, Express, PostgreSQL, Redis, Microservices, GraphQL, Docker, Kubernetes, AWS Cloud Infrastructure' },
              { id: 'sk3', title: 'DevOps & CI/CD', description: 'GitHub Actions, GitLab CI, Terraform, Ansible, Monitoring, Prometheus, Grafana, Datadog' },
              { id: 'sk4', title: 'Testing & QA', description: 'Vitest, Jest, Cypress, Playwright, TDD, BDD, Performance Profiling, Chaos Engineering' },
            ],
          };
        }
        if (sec.id === 'education') {
          return {
            ...sec,
            items: [
              { id: 'ed1', title: 'Master en Ingeniería de Software', subtitle: 'Universidad de Buenos Aires', date: '2020 - 2022' },
              { id: 'ed2', title: 'Ingeniería en Sistemas de Información', subtitle: 'UTN FRBA', date: '2015 - 2020' },
              { id: 'ed3', title: 'Licenciatura en Ciencias de la Computación', subtitle: 'UBA FCEN', date: '2012 - 2015' },
            ],
          };
        }
        return sec;
      }),
    };

    const { result } = renderHook(() => useDocumentPages({ cvData: overflowLeftCv }));

    expect(result.current.totalPages).toBe(2);
    expect(result.current.pages).toHaveLength(2);

    const [page1, page2] = result.current.pages;
    expect(page1.pageNumber).toBe(1);
    expect(page1.totalPages).toBe(2);
    expect(page1.leftSections.length).toBeGreaterThan(0);

    expect(page2.pageNumber).toBe(2);
    expect(page2.totalPages).toBe(2);
    expect(page2.leftSections.length).toBeGreaterThan(0);
  });

  it('2. automatically generates 2 pages in 2-column mode when right column content overflows', () => {
    const overflowRightCv = {
      ...defaultSchema,
      sections: defaultSchema.sections.map((sec) => {
        if (sec.id === 'experience') {
          return {
            ...sec,
            items: [
              { id: 'e1', title: 'Principal Architect', subtitle: 'Tech Global', date: '2022 - Present', bullets: ['Architected core distributed platform with micro-frontends', 'Led migration of 200 services across AWS and GCP', 'Optimized multi-region latency reducing p99 by 50%'] },
              { id: 'e2', title: 'Staff Engineer', subtitle: 'Enterprise Corp', date: '2020 - 2022', bullets: ['Designed event-driven backend using Apache Kafka and PostgreSQL', 'Mentored staff and tech leads across 4 distributed teams'] },
              { id: 'e3', title: 'Senior Backend Engineer', subtitle: 'Fintech Hub', date: '2018 - 2020', bullets: ['Implemented real-time payment rails with strict idempotency', 'Achieved PCI-DSS Level 1 compliance with zero critical findings'] },
              { id: 'e4', title: 'Software Engineer III', subtitle: 'Cloud Scale', date: '2016 - 2018', bullets: ['Built high-throughput ingestion engine processing 500k RPS', 'Reduced compute infrastructure spend by 35% through profiling'] },
              { id: 'e5', title: 'Fullstack Developer', subtitle: 'Startup Inc', date: '2015 - 2016', bullets: ['Fullstack development with React, Node, and GraphQL API gateway'] },
              { id: 'e6', title: 'Junior Developer', subtitle: 'WebAgency', date: '2014 - 2015', bullets: ['Built responsive client web applications and REST APIs'] },
              { id: 'e7', title: 'Software Engineer', subtitle: 'Global Systems', date: '2013 - 2014', bullets: ['Maintained scalable database systems and internal tools'] },
            ],
          };
        }
        return sec;
      }),
    };

    const { result } = renderHook(() => useDocumentPages({ cvData: overflowRightCv }));

    expect(result.current.totalPages).toBe(2);
    expect(result.current.pages).toHaveLength(2);

    const [page1, page2] = result.current.pages;
    expect(page1.rightSections.length).toBeGreaterThan(0);
    expect(page2.rightSections.length).toBeGreaterThan(0);
  });

  it('3. renders both A4PageBoxes with 2-column structure in the Editor DOM', () => {
    const overflowCv = {
      ...defaultSchema,
      sections: defaultSchema.sections.map((sec) => {
        if (sec.id === 'experience') {
          return {
            ...sec,
            items: [
              { id: 'e1', title: 'Principal Architect', subtitle: 'Tech Global', date: '2022 - Present', bullets: ['Architected core distributed platform with micro-frontends', 'Led migration of 200 services across AWS and GCP', 'Optimized multi-region latency reducing p99 by 50%'] },
              { id: 'e2', title: 'Staff Engineer', subtitle: 'Enterprise Corp', date: '2020 - 2022', bullets: ['Designed event-driven backend using Apache Kafka and PostgreSQL', 'Mentored staff and tech leads across 4 distributed teams'] },
              { id: 'e3', title: 'Senior Backend Engineer', subtitle: 'Fintech Hub', date: '2018 - 2020', bullets: ['Implemented real-time payment rails with strict idempotency', 'Achieved PCI-DSS Level 1 compliance with zero critical findings'] },
              { id: 'e4', title: 'Software Engineer III', subtitle: 'Cloud Scale', date: '2016 - 2018', bullets: ['Built high-throughput ingestion engine processing 500k RPS', 'Reduced compute infrastructure spend by 35% through profiling'] },
              { id: 'e5', title: 'Fullstack Developer', subtitle: 'Startup Inc', date: '2015 - 2016', bullets: ['Fullstack development with React, Node, and GraphQL API gateway'] },
              { id: 'e6', title: 'Junior Developer', subtitle: 'WebAgency', date: '2014 - 2015', bullets: ['Built responsive client web applications and REST APIs'] },
              { id: 'e7', title: 'Software Engineer', subtitle: 'Global Systems', date: '2013 - 2014', bullets: ['Maintained scalable database systems and internal tools'] },
            ],
          };
        }
        return sec;
      }),
    };

    localStorage.setItem('cvData', JSON.stringify(overflowCv));

    render(
      <CVProvider>
        <App />
      </CVProvider>
    );

    // Both A4 Page Boxes must be rendered
    const pageBox1 = screen.getByTestId('a4-page-box-1');
    const pageBox2 = screen.getByTestId('a4-page-box-2');
    expect(pageBox1).toBeInTheDocument();
    expect(pageBox2).toBeInTheDocument();

    expect(pageBox1).toHaveAttribute('data-page-number', '1');
    expect(pageBox2).toHaveAttribute('data-page-number', '2');

    // Both page boxes must render 2-column layout (resume__left and resume__right)
    const leftCols = document.querySelectorAll('.resume__left');
    const rightCols = document.querySelectorAll('.resume__right');

    expect(leftCols.length).toBe(2);
    expect(rightCols.length).toBe(2);

    // Page badges must reflect Página 1 de 2 and Página 2 de 2
    expect(screen.getByText('Página 1 de 2')).toBeInTheDocument();
    expect(screen.getByText('Página 2 de 2')).toBeInTheDocument();
  });
});
