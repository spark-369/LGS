import { IconButton, Tooltip } from '@mui/material';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import { useColorMode } from '../theme/ColorModeContext';

function ThemeToggle({ size = 'medium' }) {
  const { mode, toggleColorMode } = useColorMode();
  const isDark = mode === 'dark';

  return (
    <Tooltip title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
      <IconButton
        onClick={toggleColorMode}
        size={size}
        color="inherit"
        aria-label="Toggle color mode"
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        {isDark ? (
          <LightModeRoundedIcon fontSize="small" />
        ) : (
          <DarkModeRoundedIcon fontSize="small" />
        )}
      </IconButton>
    </Tooltip>
  );
}

export default ThemeToggle;
