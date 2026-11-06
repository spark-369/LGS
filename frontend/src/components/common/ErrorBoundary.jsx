import { Component } from 'react';
import { Box, Button, Container, Paper, Stack, Typography } from '@mui/material';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';

/**
 * Catches render-time errors anywhere below it and shows a recovery screen
 * instead of a blank white page.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Surface the full context in the console for debugging.
    console.error('Unhandled UI error:', error, info?.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    const { children } = this.props;

    if (!error) return children;

    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          p: 3,
        }}
      >
        <Container maxWidth="sm">
          <Paper
            elevation={0}
            sx={{ p: { xs: 3, sm: 5 }, borderRadius: 4, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}
          >
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                mx: 'auto',
                mb: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'error.main',
                color: '#fff',
              }}
            >
              <ErrorOutlineRoundedIcon sx={{ fontSize: 36 }} />
            </Box>
            <Typography variant="h5" fontWeight={800} gutterBottom>
              Something went wrong
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              An unexpected error interrupted this page. You can try again, or reload the app.
            </Typography>
            {import.meta.env.DEV && (
              <Box
                component="pre"
                sx={{
                  textAlign: 'left',
                  p: 2,
                  mb: 3,
                  borderRadius: 2,
                  bgcolor: 'action.hover',
                  fontSize: 12,
                  overflow: 'auto',
                  maxHeight: 200,
                }}
              >
                {String(error?.stack || error?.message || error)}
              </Box>
            )}
            <Stack direction="row" spacing={1.5} justifyContent="center">
              <Button variant="outlined" onClick={this.handleReset}>
                Try again
              </Button>
              <Button variant="contained" startIcon={<RefreshRoundedIcon />} onClick={this.handleReload}>
                Reload
              </Button>
            </Stack>
          </Paper>
        </Container>
      </Box>
    );
  }
}

export default ErrorBoundary;
