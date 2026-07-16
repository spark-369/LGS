import { Box, Typography, Button, Paper } from '@mui/material';
import { useTheme } from '@mui/material/styles';

/**
 * Friendly empty state used across circuit listings. `action` renders a
 * primary button; omit it for read-only empty states.
 */
export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) {
  const theme = useTheme();
  return (
    <Paper
      elevation={0}
      sx={{
        gridColumn: { xs: '1 / -1', md: 'auto' },
        textAlign: 'center',
        py: 8,
        px: 3,
        borderRadius: 4,
        border: '1px dashed',
        borderColor: 'divider',
        width: '100%',
      }}
    >
      <Box
        sx={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          bgcolor: 'action.hover',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 2,
          color: 'text.secondary',
          background:
            theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(14,165,233,0.12))'
              : 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(14,165,233,0.08))',
        }}
      >
        {icon}
      </Box>
      <Typography variant="h6" fontWeight={700}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 420, mx: 'auto' }}>
        {description}
      </Typography>
      {actionLabel && onAction && (
        <Button variant="contained" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Paper>
  );
}
