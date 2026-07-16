import { Box, Typography, Button, Paper, Container } from '@mui/material';
import FindInPageRoundedIcon from '@mui/icons-material/FindInPageRounded';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { GRADIENTS } from '../theme/theme';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        px: 3,
        textAlign: 'center',
      }}
    >
      <Container maxWidth="sm">
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <Logo size="large" />
        </Box>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, sm: 6 },
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: 6,
            background: (t) =>
              t.palette.mode === 'dark'
                ? 'linear-gradient(180deg, rgba(79,70,229,0.08), transparent)'
                : 'linear-gradient(180deg, rgba(79,70,229,0.05), transparent)',
          }}
        >
          <Box
            sx={{
              width: 84,
              height: 84,
              borderRadius: '50%',
              mx: 'auto',
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: GRADIENTS.brand,
              color: '#fff',
              boxShadow: '0 12px 30px rgba(79,70,229,0.35)',
            }}
          >
            <FindInPageRoundedIcon sx={{ fontSize: 42 }} />
          </Box>
          <Typography variant="h3" fontWeight={800} sx={{ mb: 1, letterSpacing: '-0.02em' }}>
            404
          </Typography>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
            Page not found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4, maxWidth: 380, mx: 'auto' }}>
            The page you’re looking for doesn’t exist or may have been moved.
            Let’s get you back on track.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}
