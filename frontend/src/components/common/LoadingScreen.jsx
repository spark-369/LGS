import { Box, CircularProgress, Typography } from '@mui/material';

/** Centered spinner used while a lazy route chunk or auth state resolves. */
export default function LoadingScreen({ label = 'Loading…' }) {
  return (
    <Box
      sx={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        py: 8,
      }}
    >
      <CircularProgress size={36} thickness={4} />
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}
