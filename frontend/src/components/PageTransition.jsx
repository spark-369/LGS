import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';

/**
 * Wraps routed pages with a subtle fade + lift so navigation feels intentional
 * rather than abrupt. Respects reduced-motion via the global stylesheet.
 */
export default function PageTransition({ children }) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        animation: 'lgs-page-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) both',
        '@keyframes lgs-page-in': {
          from: { opacity: 0, transform: 'translateY(10px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        [theme.breakpoints.up('sm')]: { px: 0 },
      }}
    >
      {children}
    </Box>
  );
}
