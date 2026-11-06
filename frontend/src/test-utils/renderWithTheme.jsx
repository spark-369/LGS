// ---------------------------------------------------------------------------
// Shared helpers for component tests.
//
// Wraps @testing-library/react's render with the MUI theme + CssBaseline so
// components that read the theme (useTheme, alpha, palette mode) render exactly
// as they do in the app.
// ---------------------------------------------------------------------------
import { render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createAppTheme } from '../theme/theme';

/**
 * Render `ui` inside a MUI ThemeProvider.
 *
 * @param {import('react').ReactElement} ui
 * @param {{ mode?: 'light' | 'dark' }} [options]
 */
export function renderWithTheme(ui, { mode = 'light' } = {}) {
  const theme = createAppTheme(mode);
  return render(
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {ui}
    </ThemeProvider>
  );
}

export * from '@testing-library/react';
