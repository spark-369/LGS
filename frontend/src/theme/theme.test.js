import { describe, it, expect } from 'vitest';
import { createAppTheme, GRADIENTS } from './theme';

describe('theme/theme', () => {
  it('builds a light theme with the brand palette and a soft background', () => {
    const theme = createAppTheme('light');
    expect(theme.palette.mode).toBe('light');
    expect(theme.palette.primary.main).toBe('#4f46e5');
    expect(theme.palette.background.default).toBe('#f6f7fb');
    expect(theme.shape.borderRadius).toBe(12);
  });

  it('builds a dark theme with a deep background', () => {
    const theme = createAppTheme('dark');
    expect(theme.palette.mode).toBe('dark');
    expect(theme.palette.background.default).toBe('#0b1120');
  });

  it('defaults to the light palette', () => {
    expect(createAppTheme().palette.mode).toBe('light');
  });

  it('defines a full shadows scale', () => {
    const theme = createAppTheme('light');
    expect(theme.shadows).toHaveLength(25);
    expect(theme.shadows[0]).toBe('none');
  });

  it('exposes the brand gradients', () => {
    expect(GRADIENTS.brand).toMatch(/linear-gradient/);
    expect(GRADIENTS.brandSoft).toMatch(/linear-gradient/);
  });
});
