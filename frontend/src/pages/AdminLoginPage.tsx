import React, { useState } from 'react';
import {
  Alert, Box, Button, CircularProgress, Collapse,
  FormControl, FormHelperText, IconButton, InputAdornment,
  InputLabel, OutlinedInput, Stack, Typography, Link, Paper
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { validateEmail, validatePassword } from '../utils/validation';
import notify from '../utils/notify';

export default function AdminLoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched]         = useState({ email: false, password: false });
  const [loading, setLoading]         = useState(false);
  const [loginError, setLoginError]   = useState('');

  const emailError    = touched.email    ? validateEmail(email) : '';
  const passwordError = touched.password ? validatePassword(password) : '';
  const isValid       = !validateEmail(email) && !validatePassword(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    setLoginError('');
    if (!isValid) return;
    try {
      setLoading(true);
      await login(email, password, 'ADMIN');
      notify.success('Admin authenticated.');
      navigate('/');
    } catch (err: any) {
      setLoginError(err?.message ?? 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="auth-bg">
      <Paper sx={{ width: '100%', maxWidth: 440, p: { xs: 3, md: 5 }, borderRadius: '12px', borderTop: '4px solid #0f172a' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 4, justifyContent: 'center' }}>
          <Box sx={{ width: 28, height: 28, borderRadius: '6px', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff' }}>R</Box>
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>RetailOS</Typography>
        </Box>

        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h5">Admin Portal</Typography>
          <Typography sx={{ mt: 0.5, fontSize: 14, color: 'text.secondary' }}>
            Sign in with administrator credentials
          </Typography>
        </Box>

        <Collapse in={!!loginError} unmountOnExit sx={{ mb: 3 }}>
          <Alert severity="error" onClose={() => setLoginError('')}>{loginError}</Alert>
        </Collapse>

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={2.5}>
            <FormControl fullWidth error={!!emailError}>
              <InputLabel>Admin Email</InputLabel>
              <OutlinedInput
                label="Admin Email" type="email" autoComplete="email"
                value={email} onChange={e => { setEmail(e.target.value); setLoginError(''); }}
                onBlur={() => setTouched(t => ({ ...t, email: true }))}
              />
              {emailError && <FormHelperText>{emailError}</FormHelperText>}
            </FormControl>

            <FormControl fullWidth error={!!passwordError}>
              <InputLabel>Password</InputLabel>
              <OutlinedInput
                label="Password" type={showPassword ? 'text' : 'password'} autoComplete="current-password"
                value={password} onChange={e => { setPassword(e.target.value); setLoginError(''); }}
                onBlur={() => setTouched(t => ({ ...t, password: true }))}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(v => !v)} edge="end" size="small">
                      {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                }
              />
              {passwordError && <FormHelperText>{passwordError}</FormHelperText>}
            </FormControl>

            <Button type="submit" variant="contained" color="primary" size="large" disabled={loading} fullWidth sx={{ py: 1.25 }}>
              {loading ? <CircularProgress size={20} color="inherit" /> : 'Sign In as Admin'}
            </Button>
          </Stack>
        </Box>

        <Typography sx={{ mt: 3, fontSize: 13, textAlign: 'center', color: 'text.secondary' }}>
          <Link component="button" type="button" onClick={e => { e.preventDefault(); navigate('/login'); }} sx={{ color: 'text.secondary', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
            Return to User Login
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}
