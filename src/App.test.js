import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import App from './App';

jest.useFakeTimers();

test('renders portfolio title', async () => {
  render(<App />);
  const linkElement = await screen.findByText(/DEV_PORTFOLIO_V1/i);
  expect(linkElement).toBeInTheDocument();
});

test('terminal closes with animation', async () => {
  render(<App />);

  // Open terminal
  const toggleBtn = screen.getByText(/_TERMINAL/i);
  fireEvent.click(toggleBtn);

  // Terminal should be visible
  const terminalHeader = screen.getByText(/^TERMINAL$/);
  expect(terminalHeader).toBeInTheDocument();

  // Click close button
  const closeBtn = screen.getByText('x');
  fireEvent.click(closeBtn);

  // Terminal should still be in document (animating)
  expect(terminalHeader).toBeInTheDocument();

  // Simulate animation end
  const terminalWrapper = terminalHeader.closest('.terminal-wrapper');
  fireEvent.animationEnd(terminalWrapper);

  // Terminal should be removed
  expect(terminalHeader).not.toBeInTheDocument();
});
