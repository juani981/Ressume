import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CustomTooltip } from '../components/CustomTooltip';

describe('CustomTooltip - "No volver a mostrar" Checkbox & Tour Controls', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders correctly with minimal props without crashing', () => {
    render(
      <CustomTooltip
        step={{ content: 'Texto de prueba del paso' }}
      />
    );

    expect(screen.getByText('Texto de prueba del paso')).toBeInTheDocument();
    expect(screen.getByText('No volver a mostrar este tour')).toBeInTheDocument();
    const checkbox = screen.getByTestId('checkbox-dont-show-again');
    expect(checkbox).not.toBeChecked();
  });

  it('initializes as checked if localStorage has skip_onboarding_tour = "true"', () => {
    localStorage.setItem('skip_onboarding_tour', 'true');

    render(
      <CustomTooltip
        step={{ content: 'Paso 1' }}
      />
    );

    const checkbox = screen.getByTestId('checkbox-dont-show-again');
    expect(checkbox).toBeChecked();
  });

  it('initializes as checked if controlled prop dontShowAgain is true', () => {
    render(
      <CustomTooltip
        step={{ content: 'Paso 1' }}
        dontShowAgain={true}
      />
    );

    const checkbox = screen.getByTestId('checkbox-dont-show-again');
    expect(checkbox).toBeChecked();
  });

  it('toggling the checkbox saves to localStorage immediately', () => {
    render(
      <CustomTooltip
        step={{ content: 'Paso 1' }}
      />
    );

    const checkbox = screen.getByTestId('checkbox-dont-show-again');
    expect(checkbox).not.toBeChecked();
    expect(localStorage.getItem('skip_onboarding_tour')).toBeNull();

    // Check the box
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(localStorage.getItem('skip_onboarding_tour')).toBe('true');

    // Uncheck the box
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
    expect(localStorage.getItem('skip_onboarding_tour')).toBeNull();
  });

  it('invokes setDontShowAgain callback when toggled', () => {
    const setDontShowAgainMock = vi.fn();

    render(
      <CustomTooltip
        step={{ content: 'Paso 1' }}
        dontShowAgain={false}
        setDontShowAgain={setDontShowAgainMock}
      />
    );

    const checkbox = screen.getByTestId('checkbox-dont-show-again');
    fireEvent.click(checkbox);

    expect(setDontShowAgainMock).toHaveBeenCalledTimes(1);
    expect(setDontShowAgainMock).toHaveBeenCalledWith(true);
    expect(localStorage.getItem('skip_onboarding_tour')).toBe('true');
  });

  it('clicking the label toggles the checkbox', () => {
    render(
      <CustomTooltip
        step={{ content: 'Paso 1' }}
      />
    );

    const label = screen.getByTestId('label-dont-show-again');
    const checkbox = screen.getByTestId('checkbox-dont-show-again');

    expect(checkbox).not.toBeChecked();

    fireEvent.click(label);
    expect(checkbox).toBeChecked();
    expect(localStorage.getItem('skip_onboarding_tour')).toBe('true');
  });

  it('calls skipProps.onClick when clicking "Saltar" and persists skip preference if checked', () => {
    const onSkipMock = vi.fn();

    render(
      <CustomTooltip
        step={{ content: 'Paso 1' }}
        skipProps={{ onClick: onSkipMock }}
      />
    );

    const checkbox = screen.getByTestId('checkbox-dont-show-again');
    fireEvent.click(checkbox);
    expect(localStorage.getItem('skip_onboarding_tour')).toBe('true');

    const skipBtn = screen.getByText('Saltar');
    fireEvent.click(skipBtn);

    expect(onSkipMock).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('skip_onboarding_tour')).toBe('true');
  });

  it('calls primaryProps.onClick when clicking "Finalizar" on last step and persists skip preference', () => {
    const onPrimaryMock = vi.fn();

    render(
      <CustomTooltip
        index={2}
        isLastStep={true}
        step={{ content: 'Paso final' }}
        primaryProps={{ onClick: onPrimaryMock }}
      />
    );

    const finishBtn = screen.getByText('Finalizar');
    expect(finishBtn).toBeInTheDocument();

    const checkbox = screen.getByTestId('checkbox-dont-show-again');
    fireEvent.click(checkbox);

    fireEvent.click(finishBtn);
    expect(onPrimaryMock).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('skip_onboarding_tour')).toBe('true');
  });

  it('renders "Atrás" button when index > 0 and handles click', () => {
    const onBackMock = vi.fn();

    render(
      <CustomTooltip
        index={1}
        step={{ content: 'Paso 2' }}
        backProps={{ onClick: onBackMock }}
      />
    );

    const backBtn = screen.getByText('Atrás');
    expect(backBtn).toBeInTheDocument();

    fireEvent.click(backBtn);
    expect(onBackMock).toHaveBeenCalledTimes(1);
  });
});
