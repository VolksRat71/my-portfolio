import { render, screen, fireEvent, act } from '@testing-library/react';
import App from './App';

jest.useFakeTimers();

test('renders portfolio title', async () => {
  render(<App />);
  const linkElement = await screen.findByText(/DEV_PORTFOLIO_V1/i);
  expect(linkElement).toBeInTheDocument();
});

test('button is visible during closing animation', async () => {
  render(<App />);

  // Open terminal
  const toggleBtn = screen.getByText(/_TERMINAL/i);
  fireEvent.click(toggleBtn);

  // Button should be hidden
  expect(screen.queryByText(/_TERMINAL/i)).not.toBeInTheDocument();

  // Click close button
  const closeBtn = screen.getByText('x');
  fireEvent.click(closeBtn);

  // Button should reappear immediately
  expect(screen.getByText(/_TERMINAL/i)).toBeInTheDocument();

  // Terminal should still be visible (animating)
  const terminalHeader = screen.getByText(/^TERMINAL$/);
  expect(terminalHeader).toBeInTheDocument();

  // Simulate animation end
  const terminalWrapper = terminalHeader.closest('.terminal-wrapper');
  fireEvent.animationEnd(terminalWrapper);

  // Terminal should be removed
  expect(terminalHeader).not.toBeInTheDocument();

  // Button should still be visible
  expect(screen.getByText(/_TERMINAL/i)).toBeInTheDocument();
});
