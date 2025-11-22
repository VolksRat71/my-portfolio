import { render, screen, fireEvent, act } from '@testing-library/react';
import App from './App';
import { audioSynth } from './AudioSynth';

// Mock AudioSynth
jest.mock('./AudioSynth', () => ({
  audioSynth: {
    init: jest.fn(),
    playTurnOn: jest.fn(),
    playTurnOff: jest.fn(),
    playClick: jest.fn(),
    playDegauss: jest.fn(),
  }
}));

jest.useFakeTimers();

beforeEach(() => {
  jest.clearAllMocks();
});

test('plays turn-on sound on boot', () => {
  render(<App />);
  // Should attempt to play sound (wrapped in try/catch in component, but mock won't throw)
  expect(audioSynth.playTurnOn).toHaveBeenCalled();
});

test('plays click sound on typing', async () => {
  render(<App />);

  // Fast-forward to main app
  act(() => {
    jest.advanceTimersByTime(4500);
  });

  // Open terminal
  const toggleBtn = screen.getByText(/_TERMINAL/i);
  fireEvent.click(toggleBtn);

  // Type in terminal
  const input = screen.getByRole('textbox');
  fireEvent.change(input, { target: { value: 'a' } });

  expect(audioSynth.playClick).toHaveBeenCalled();
});

test('plays turn-off sound on reboot', async () => {
  render(<App />);

  // Fast-forward to main app
  act(() => {
    jest.advanceTimersByTime(4500);
  });

  // Open terminal
  const toggleBtn = screen.getByText(/_TERMINAL/i);
  fireEvent.click(toggleBtn);

  // Type reboot
  const input = screen.getByRole('textbox');
  fireEvent.change(input, { target: { value: 'reboot' } });
  fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

  expect(audioSynth.playTurnOff).toHaveBeenCalled();
});
