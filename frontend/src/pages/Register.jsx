import { useState, useMemo } from 'react';
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
  LinearProgress,
  Stack,
} from '@mui/material';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AuthLayout from '../components/auth/AuthLayout';

function getStrength(password) {
  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.min(score, 4);
}

const STRENGTH = [
  { label: 'Very weak', color: 'error' },
  { label: 'Weak', color: 'error' },
  { label: 'Fair', color: 'warning' },
  { label: 'Good', color: 'info' },
  { label: 'Strong', color: 'success' },
];

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { register, loading, error } = useAuth();
  const navigate = useNavigate();

  const strength = useMemo(() => getStrength(password), [password]);
  const mismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) return;
    const result = await register(name, email, password);
    if (result.success) navigate('/dashboard');
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start building logic circuits in seconds."
      footer={{
        label: 'Already have an account?',
        node: (
          <Typography variant="body2" align="center" color="text.secondary">
            Welcome back.{' '}
            <Link
              component={RouterLink}
              to="/login"
              fontWeight={700}
              underline="hover"
            >
              Sign in
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
          label="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          fullWidth
          autoFocus
          autoComplete="name"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PersonRoundedIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
          autoComplete="email"
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
            autoComplete="new-password"
            inputProps={{ minLength: 6 }}
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
          {password.length > 0 && (
            <Stack
              direction="row"
              alignItems="center"
              spacing={1.5}
              sx={{ mt: 1, px: 0.5 }}
            >
              <LinearProgress
                variant="determinate"
                value={(strength / 4) * 100}
                color={STRENGTH[strength].color}
                sx={{ flex: 1, height: 6, borderRadius: 3 }}
              />
              <Typography
                variant="caption"
                color={`${STRENGTH[strength].color}.main`}
                fontWeight={600}
                sx={{ minWidth: 64, textAlign: 'right' }}
              >
                {STRENGTH[strength].label}
              </Typography>
            </Stack>
          )}
        </Box>
        <TextField
          label="Confirm Password"
          type={showPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          fullWidth
          autoComplete="new-password"
          error={mismatch}
          helperText={mismatch ? 'Passwords do not match' : ' '}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockRoundedIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
        />
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={loading || mismatch}
          startIcon={
            loading ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <PersonAddAlt1RoundedIcon />
            )
          }
        >
          {loading ? 'Creating account…' : 'Create Account'}
        </Button>
      </Box>
    </AuthLayout>
  );
}

export default Register;
