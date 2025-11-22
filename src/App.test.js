import { render, screen, fireEvent, act } from '@testing-library/react';
import App from './App';

jest.useFakeTimers();

test('initial state is turning-on', () => {
  const { container } = render(<App />);

  // Should have crt-turn-on class
  const crtContainer = container.querySelector('.crt-container.crt-turn-on');
  expect(crtContainer).toBeInTheDocument();

  // Splash screen should NOT be visible yet (waiting for turn-on anim)
  expect(screen.queryByText(/BIOS Date/i)).not.toBeInTheDocument();
});

test('transitions to booting state after turn-on animation', () => {
  render(<App />);

  // Fast-forward turn-on animation (1.5s)
  act(() => {
    jest.advanceTimersByTime(1500);
  });

  // Splash screen should now be visible
  expect(screen.getByText(/BIOS Date/i)).toBeInTheDocument();
});

test('transitions to running state after boot sequence', () => {
  render(<App />);

  // Fast-forward turn-on (1.5s) + boot sequence (2.5s)
  act(() => {
    jest.advanceTimersByTime(4000);
  });

  // Main app should be visible
  expect(screen.getByText(/DEV_PORTFOLIO_V1/i)).toBeInTheDocument();
});
