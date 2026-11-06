import { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  InputAdornment,
  IconButton,
  Link,
  CircularProgress,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LoginRoundedIcon from '@mui/icons-material/LoginRounded';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AuthLayout from '../components/auth/AuthLayout';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const { login, loading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Drop any stale error inherited from another auth page.
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Return the user to wherever they were headed before the auth redirect.
  const redirectTo = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(email, password);
    if (result.success) navigate(redirectTo, { replace: true });
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue to your circuits."
      footer={{
        label: 'New here?',
        node: (
          <Typography variant="body2" align="center" color="text.secondary">
            Create an account to start building logic circuits in seconds.{' '}
            <Link
              component={RouterLink}
              to="/register"
              fontWeight={700}
              underline="hover"
            >
              Sign up free
            </Link>
          </Typography>
        ),
      }}
    >
      {error && (
        <Alert severity="error" sx={{ mb: 2.5 }}>
          {error}
        </Alert>
      )}
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: 'flex', flexDirection: 'column', gap: 2.25 }}
      >
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
          autoComplete="email"
          autoFocus
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EmailRoundedIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
        />
        <Box>
          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            autoComplete="current-password"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockRoundedIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((s) => !s)}
                    edge="end"
                    size="small"
                    aria-label="toggle password visibility"
                  >
                    {showPassword ? (
                      <VisibilityOff fontSize="small" />
                    ) : (
                      <Visibility fontSize="small" />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
              }
              label={<Typography variant="body2" color="text.secondary">Keep me signed in</Typography>}
            />
            <Link
              component={RouterLink}
              to="/login"
              variant="body2"
              fontWeight={600}
              underline="hover"
              onClick={(e) => {
                e.preventDefault();
                window.alert('Password reset is not available yet. Please contact support.');
              }}
              sx={{ cursor: 'pointer' }}
            >
              Forgot password?
            </Link>
          </Box>
        </Box>
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={loading}
          startIcon={
            loading ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <LoginRoundedIcon />
            )
          }
          sx={{ mt: 0.5 }}
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </Button>
      </Box>
    </AuthLayout>
  );
}

export default Login;
