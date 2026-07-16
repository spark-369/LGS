import { Box, Paper, Typography, Stack, useMediaQuery, Divider } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import Logo from '../Logo';
import ThemeToggle from '../ThemeToggle';
import { GRADIENTS } from '../../theme/theme';

const FEATURES = [
  'Drag-and-drop logic gate editor',
  'Real-time circuit simulation',
  'Live collaboration on shared circuits',
  'Save, duplicate & share your designs',
];

/**
 * Split-screen authentication layout: branded hero panel + form card.
 */
function AuthLayout({ title, subtitle, children, footer }) {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        bgcolor: 'background.default',
      }}
    >
      {/* Brand / hero panel */}
      {isMdUp && (
        <Box
          sx={{
            flex: '1 1 50%',
            position: 'relative',
            color: '#fff',
            background: GRADIENTS.brandSoft,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            p: 6,
            overflow: 'hidden',
          }}
        >
          {/* decorative blobs */}
          <Box
            sx={{
              position: 'absolute',
              width: 420,
              height: 420,
              borderRadius: '50%',
              top: -140,
              right: -120,
              background: 'rgba(255,255,255,0.12)',
              filter: 'blur(8px)',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              width: 320,
              height: 320,
              borderRadius: '50%',
              bottom: -100,
              left: -80,
              background: 'rgba(255,255,255,0.08)',
            }}
          />

          <Logo size="medium" color="#fff" sx={{ position: 'relative' }} />

          <Box sx={{ position: 'relative', maxWidth: 460 }}>
            <Typography variant="overline" sx={{ opacity: 0.85, fontWeight: 700 }}>
              Logic Gate Simulator
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, lineHeight: 1.15 }}>
              Design, simulate & share digital logic circuits.
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, mb: 4 }}>
              A powerful, browser-based playground for building and testing
              logic gate circuits — no installs required.
            </Typography>
            <Stack spacing={1.5}>
              {FEATURES.map((f) => (
                <Stack key={f} direction="row" spacing={1.5} alignItems="center">
                  <CheckCircleRoundedIcon sx={{ fontSize: 20, opacity: 0.95 }} />
                  <Typography variant="body2" sx={{ opacity: 0.95 }}>
                    {f}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>

          <Typography variant="caption" sx={{ position: 'relative', opacity: 0.7 }}>
            © {new Date().getFullYear()} LogicGate Simulator
          </Typography>
        </Box>
      )}

      {/* Form panel */}
      <Box
        sx={{
          flex: '1 1 50%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 2.5, sm: 4 },
          position: 'relative',
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(100,116,139,0.12) 1px, transparent 0)',
          backgroundSize: '22px 22px',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 20,
            right: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          {!isMdUp && (
            <Box sx={{ display: { md: 'none' } }}>
              <ThemeToggle />
            </Box>
          )}
          {isMdUp && <ThemeToggle />}
        </Box>

        <Paper
          elevation={0}
          className="lgs-fade-in"
          sx={{
            width: '100%',
            maxWidth: 420,
            p: { xs: 3, sm: 4.5 },
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: { xs: 3, md: 6 },
          }}
        >
          {!isMdUp && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <Logo size="medium" />
            </Box>
          )}
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, letterSpacing: '-0.02em' }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3.5 }}>
            {subtitle}
          </Typography>
          {children}
          {footer && (
            <>
              <Divider sx={{ my: 3 }}>
                <Typography variant="caption" color="text.secondary">
                  {footer.label || 'or'}
                </Typography>
              </Divider>
              {footer.node}
            </>
          )}
        </Paper>

        {!isMdUp && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 3 }}
          >
            © {new Date().getFullYear()} LogicGate Simulator
          </Typography>
        )}
      </Box>
    </Box>
  );
}

export default AuthLayout;
