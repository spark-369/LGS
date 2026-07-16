import { createTheme, alpha } from '@mui/material/styles';

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------
const brand = {
  main: '#4f46e5', // indigo
  light: '#6366f1',
  dark: '#4338ca',
  contrastText: '#ffffff',
};

const accent = {
  main: '#0ea5e9', // sky
  light: '#38bdf8',
  dark: '#0284c7',
  contrastText: '#ffffff',
};

const success = { main: '#16a34a', light: '#22c55e', dark: '#15803d' };
const warning = { main: '#f59e0b', light: '#fbbf24', dark: '#d97706' };
const error = { main: '#ef4444', light: '#f87171', dark: '#dc2626' };
const info = { main: '#0ea5e9', light: '#38bdf8', dark: '#0284c7' };

const fontFamily =
  '"Inter", "Roboto", "Helvetica", "Arial", sans-serif';

// ---------------------------------------------------------------------------
// Palette factory
// ---------------------------------------------------------------------------
function getPalette(mode) {
  const isLight = mode === 'light';
  return {
    mode,
    primary: brand,
    secondary: accent,
    success,
    warning,
    error,
    info,
    ...(isLight
      ? {
          background: {
            default: '#f6f7fb',
            paper: '#ffffff',
          },
          text: {
            primary: '#0f172a',
            secondary: '#64748b',
          },
          divider: '#e5e7eb',
        }
      : {
          background: {
            default: '#0b1120',
            paper: '#111827',
          },
          text: {
            primary: '#f1f5f9',
            secondary: '#94a3b8',
          },
          divider: 'rgba(148, 163, 184, 0.16)',
        }),
  };
}

// ---------------------------------------------------------------------------
// Shadows tuned for a soft, modern SaaS look
// ---------------------------------------------------------------------------
function getShadows(mode) {
  const c = mode === 'light' ? '15, 23, 42' : '0, 0, 0';
  const s = (y, blur, a) => `0 ${y}px ${blur}px rgba(${c}, ${a})`;
  return [
    'none',
    s(1, 2, 0.06),
    s(2, 6, 0.08),
    s(4, 12, 0.08),
    s(6, 16, 0.1),
    s(8, 20, 0.1),
    s(10, 24, 0.12),
    s(12, 28, 0.12),
    s(14, 32, 0.14),
    s(16, 36, 0.14),
    s(18, 40, 0.16),
    s(20, 44, 0.16),
    s(22, 48, 0.18),
    s(24, 52, 0.18),
    s(26, 56, 0.2),
    s(28, 60, 0.2),
    s(30, 64, 0.22),
    s(32, 68, 0.22),
    s(34, 72, 0.24),
    s(36, 76, 0.24),
    s(38, 80, 0.26),
    s(40, 84, 0.26),
    s(42, 88, 0.28),
    s(44, 92, 0.28),
    s(46, 96, 0.3),
  ];
}

// ---------------------------------------------------------------------------
// Theme factory
// ---------------------------------------------------------------------------
export function createAppTheme(mode = 'light') {
  const palette = getPalette(mode);
  const isLight = mode === 'light';

  return createTheme({
    palette,
    shadows: getShadows(mode),
    shape: { borderRadius: 12 },
    typography: {
      fontFamily,
      h1: { fontWeight: 800, letterSpacing: '-0.02em' },
      h2: { fontWeight: 800, letterSpacing: '-0.02em' },
      h3: { fontWeight: 700, letterSpacing: '-0.02em' },
      h4: { fontWeight: 700, letterSpacing: '-0.01em' },
      h5: { fontWeight: 700, letterSpacing: '-0.01em' },
      h6: { fontWeight: 700 },
      subtitle1: { fontWeight: 600 },
      subtitle2: { fontWeight: 600 },
      button: { fontWeight: 600, textTransform: 'none', letterSpacing: 0 },
      overline: { fontWeight: 700, letterSpacing: '0.08em' },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarColor: isLight
              ? '#cbd5e1 transparent'
              : '#334155 transparent',
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: 10,
            paddingInline: 18,
            paddingBlock: 8,
            transition:
              'transform .15s ease, box-shadow .2s ease, background-color .2s ease',
            '&:active': { transform: 'translateY(1px)' },
          },
          containedPrimary: {
            boxShadow: `0 6px 16px ${alpha(brand.main, 0.32)}`,
            '&:hover': {
              boxShadow: `0 8px 22px ${alpha(brand.main, 0.4)}`,
            },
          },
          sizeLarge: { paddingBlock: 11, fontSize: '0.975rem' },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            transition: 'background-color .2s ease, color .2s ease',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
          rounded: { borderRadius: 16 },
        },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            borderRadius: 16,
            border: '1px solid',
            borderColor: palette.divider,
            backgroundColor: palette.background.paper,
            transition:
              'transform .2s ease, box-shadow .25s ease, border-color .2s ease',
          },
        },
      },
      MuiTextField: {
        defaultProps: { variant: 'outlined' },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            backgroundColor: isLight
              ? '#ffffff'
              : alpha('#ffffff', 0.02),
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: palette.divider,
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: alpha(brand.main, 0.5),
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderWidth: 2,
              borderColor: brand.main,
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 600, borderRadius: 8 },
          sizeSmall: { height: 22 },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            borderRadius: 8,
            fontSize: '0.75rem',
            fontWeight: 500,
            paddingInline: 10,
            paddingBlock: 6,
            backgroundColor: isLight ? '#0f172a' : '#1e293b',
          },
          arrow: { color: isLight ? '#0f172a' : '#1e293b' },
        },
      },
      MuiAppBar: {
        defaultProps: { elevation: 0, color: 'default' },
        styleOverrides: {
          root: {
            backgroundColor: alpha(palette.background.paper, 0.8),
            backdropFilter: 'blur(12px)',
            color: palette.text.primary,
            borderBottom: '1px solid',
            borderColor: palette.divider,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: { borderRadius: 18 },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: { borderRadius: 10, fontWeight: 500 },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: 12,
            border: '1px solid',
            borderColor: palette.divider,
            marginTop: 6,
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: { root: { borderRadius: 10 } },
      },
      MuiSkeleton: {
        styleOverrides: { root: { borderRadius: 8 } },
      },
    },
  });
}

export const GRADIENTS = {
  brand: 'linear-gradient(135deg, #6366f1 0%, #0ea5e9 100%)',
  brandSoft: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 55%, #0ea5e9 100%)',
};

export default createAppTheme;
