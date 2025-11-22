import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

test('renders portfolio title', async () => {
  render(<App />);
  const linkElement = await screen.findByText(/DEV_PORTFOLIO_V1/i);
  expect(linkElement).toBeInTheDocument();
});

test('terminal executes neofetch command', async () => {
  render(<App />);

  // Open terminal first
  const toggleBtn = screen.getByText(/_TERMINAL/i);
  fireEvent.click(toggleBtn);

  const input = screen.getByRole('textbox');
  fireEvent.change(input, { target: { value: 'neofetch' } });
  fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

  const neofetchOutput = await screen.findByText(/Debian GNU\/Linux/i);
  expect(neofetchOutput).toBeInTheDocument();
});
