import React, { useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  Container,
  Divider,
  FormControl,
  FormHelperText,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';

import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { validateEmail, validatePassword } from '../utils/validation';

const DEMO_CREDS = [
  { label: 'Admin', email: 'admin@retailos.com', password: 'Admin@1234', role: 'ADMIN' as const },
  { label: 'User',  email: 'user@retailos.com',  password: 'User@1234',  role: 'USER'  as const },
];

export default function LoginPage() {
  const { login } = useAuth();

  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched,      setTouched]      = useState({ email: false, password: false });
  const [loading,      setLoading]      = useState(false);
  const [loginError,   setLoginError]   = useState('');

  const emailError    = touched.email    ? validateEmail(email)       : '';
  const passwordError = touched.password ? validatePassword(password) : '';
  const isValid       = !validateEmail(email) && !validatePassword(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    setLoginError('');
    if (!isValid) return;
    try {
      setLoading(true);
      await login(email, password);
      toast.success('Logged in successfully!');
    } catch (err: any) {
      setLoginError(err.message ?? 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
    setTouched({ email: true, password: true });
    setLoginError('');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'grey.100',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
        px: 2,
      }}
    >
      <Container maxWidth="xs" disableGutters>

        {/* Brand */}
        <Stack alignItems="center" spacing={1} sx={{ mb: 3 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 52, height: 52 }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography variant="h5" fontWeight={700} color="text.primary">
            RetailOS
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sign in to your account
          </Typography>
        </Stack>

        {/* Card */}
        <Card variant="outlined" sx={{ borderRadius: 3 }}>

          {/* Demo fill section */}
          <Box sx={{ px: 3, pt: 2.5, pb: 2, bgcolor: 'grey.50' }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={1}>
              Try a demo account
            </Typography>
            <Stack direction="row" spacing={1}>
              {DEMO_CREDS.map(d => (
                <Chip
                  key={d.label}
                  label={d.label}
                  size="small"
                  color={d.role === 'ADMIN' ? 'primary' : 'success'}
                  variant="outlined"
                  icon={
                    d.role === 'ADMIN'
                      ? <AdminPanelSettingsIcon />
                      : <PersonIcon />
                  }
                  onClick={() => fillDemo(d.email, d.password)}
                  clickable
                />
              ))}
            </Stack>
          </Box>

          <Divider />

          <CardContent sx={{ p: 3 }}>

            {/* Login error */}
            <Collapse in={!!loginError} unmountOnExit>
              <Alert
                severity="error"
                onClose={() => setLoginError('')}
                sx={{ mb: 2 }}
              >
                {loginError}
              </Alert>
            </Collapse>

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Stack spacing={2}>

                {/* Email */}
                <TextField
                  id="login-email"
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setLoginError(''); }}
                  onBlur={() => setTouched(t => ({ ...t, email: true }))}
                  error={!!emailError}
                  helperText={emailError}
                  fullWidth
                  autoComplete="email"
                  autoFocus
                />

                {/* Password */}
                <FormControl
                  fullWidth
                  variant="outlined"
                  error={touched.password && !!passwordError}
                >
                  <InputLabel htmlFor="login-password">Password</InputLabel>
                  <OutlinedInput
                    id="login-password"
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setLoginError(''); }}
                    onBlur={() => setTouched(t => ({ ...t, password: true }))}
                    autoComplete="current-password"
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          onClick={() => setShowPassword(v => !v)}
                          edge="end"
                        >
                          {showPassword
                            ? <VisibilityOffIcon fontSize="small" />
                            : <VisibilityIcon   fontSize="small" />
                          }
                        </IconButton>
                      </InputAdornment>
                    }
                  />
                  {touched.password && passwordError && (
                    <FormHelperText>{passwordError}</FormHelperText>
                  )}
                </FormControl>


                {/* Submit */}
                <Button
                  id="login-submit"
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={loading}
                  sx={{ mt: 1 }}
                >
                  {loading
                    ? <CircularProgress size={22} color="inherit" />
                    : 'Sign In'
                  }
                </Button>

              </Stack>
            </Box>

            {/* Role info */}
            <Divider sx={{ my: 2.5 }} />
            <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" useFlexGap>
              <Chip
                size="small"
                icon={<AdminPanelSettingsIcon />}
                label="Admin → Full Dashboard"
                color="primary"
                variant="outlined"
              />
              <Chip
                size="small"
                icon={<PersonIcon />}
                label="User → My Orders"
                color="success"
                variant="outlined"
              />
            </Stack>

          </CardContent>
        </Card>

        <Typography variant="caption" color="text.disabled" display="block" textAlign="center" mt={2}>
          © {new Date().getFullYear()} RetailOS. Frontend-only auth — backend untouched.
        </Typography>

      </Container>
    </Box>
  );
}
