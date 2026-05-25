import React, { useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
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
  Link,
  OutlinedInput,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PersonIcon from '@mui/icons-material/Person';

import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { validateEmail, validatePassword } from '../utils/validation';

export default function SignUpPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [name,              setName]              = useState('');
  const [email,             setEmail]             = useState('');
  const [password,          setPassword]          = useState('');
  const [confirmPassword,   setConfirmPassword]   = useState('');
  const [showPassword,      setShowPassword]      = useState(false);
  const [showConfirmPwd,    setShowConfirmPwd]    = useState(false);
  const [touched,           setTouched]           = useState({ name: false, email: false, password: false, confirmPassword: false });
  const [loading,           setLoading]           = useState(false);
  const [signupError,       setSignupError]       = useState('');

  const nameError = touched.name ? (!name.trim() ? 'Name is required' : '') : '';
  const emailError = touched.email ? validateEmail(email) : '';
  const passwordError = touched.password ? validatePassword(password) : '';
  const confirmPasswordError = touched.confirmPassword 
    ? (password && confirmPassword !== password ? 'Passwords do not match' : '')
    : '';
  
  const isValid = !nameError && !emailError && !passwordError && !confirmPasswordError && 
                  name.trim() && email && password && confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true, confirmPassword: true });
    setSignupError('');
    if (!isValid) return;

    try {
      setLoading(true);
      await signup(name.trim(), email, password);
      toast.success('Account created successfully!');
      navigate('/shop');
    } catch (err: any) {
      setSignupError(err.message ?? 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'grey.50',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
        px: 2,
      }}
    >
      <Container maxWidth="sm" disableGutters>

        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Stack alignItems="center" spacing={2}>
            <Avatar sx={{ bgcolor: 'success.main', width: 56, height: 56 }}>
              <PersonAddIcon fontSize="large" />
            </Avatar>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700} color="text.primary">
                Create Account
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                Join RetailOS and start shopping today
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* Sign Up Form Section */}
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>

            {/* Sign up error */}
            <Collapse in={!!signupError} unmountOnExit>
              <Alert
                severity="error"
                onClose={() => setSignupError('')}
                sx={{ mb: 2 }}
              >
                {signupError}
              </Alert>
            </Collapse>

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Stack spacing={2.5}>

                {/* Full Name */}
                <TextField
                  id="signup-name"
                  label="Full name"
                  type="text"
                  value={name}
                  onChange={e => { setName(e.target.value); setSignupError(''); }}
                  onBlur={() => setTouched(t => ({ ...t, name: true }))}
                  error={!!nameError}
                  helperText={nameError}
                  fullWidth
                  autoComplete="name"
                  autoFocus
                  size="medium"
                  placeholder="John Doe"
                />

                {/* Email */}
                <TextField
                  id="signup-email"
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setSignupError(''); }}
                  onBlur={() => setTouched(t => ({ ...t, email: true }))}
                  error={!!emailError}
                  helperText={emailError}
                  fullWidth
                  autoComplete="email"
                  size="medium"
                  placeholder="you@example.com"
                />

                {/* Password */}
                <FormControl
                  fullWidth
                  variant="outlined"
                  error={touched.password && !!passwordError}
                >
                  <OutlinedInput
                    id="signup-password"
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setSignupError(''); }}
                    onBlur={() => setTouched(t => ({ ...t, password: true }))}
                    autoComplete="new-password"
                    placeholder="Min. 8 chars, 1 uppercase, 1 digit, 1 special"
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          onClick={() => setShowPassword(v => !v)}
                          edge="end"
                        >
                          {showPassword
                            ? <VisibilityOffIcon fontSize="small" />
                            : <VisibilityIcon fontSize="small" />
                          }
                        </IconButton>
                      </InputAdornment>
                    }
                  />
                  {touched.password && passwordError && (
                    <FormHelperText>{passwordError}</FormHelperText>
                  )}
                </FormControl>

                {/* Confirm Password */}
                <FormControl
                  fullWidth
                  variant="outlined"
                  error={touched.confirmPassword && !!confirmPasswordError}
                >
                  <OutlinedInput
                    id="signup-confirm-password"
                    label="Confirm password"
                    type={showConfirmPwd ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); setSignupError(''); }}
                    onBlur={() => setTouched(t => ({ ...t, confirmPassword: true }))}
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={showConfirmPwd ? 'Hide password' : 'Show password'}
                          onClick={() => setShowConfirmPwd(v => !v)}
                          edge="end"
                        >
                          {showConfirmPwd
                            ? <VisibilityOffIcon fontSize="small" />
                            : <VisibilityIcon fontSize="small" />
                          }
                        </IconButton>
                      </InputAdornment>
                    }
                  />
                  {touched.confirmPassword && confirmPasswordError && (
                    <FormHelperText>{confirmPasswordError}</FormHelperText>
                  )}
                </FormControl>

                {/* Submit */}
                <Button
                  id="signup-submit"
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={loading}
                  sx={{ mt: 1 }}
                  color="success"
                >
                  {loading
                    ? <CircularProgress size={22} color="inherit" />
                    : 'Create Account'
                  }
                </Button>

              </Stack>
            </Box>

            {/* Divider */}
            <Divider sx={{ my: 2.5 }} />

            {/* Sign in link */}
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                Already have an account?{' '}
                <Link
                  component="button"
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/login');
                  }}
                  sx={{ fontWeight: 600, cursor: 'pointer' }}
                >
                  Sign in here
                </Link>
              </Typography>

              <Stack direction="row" spacing={1} useFlexGap sx={{ justifyContent: 'center', flexWrap: 'wrap' }}>
                <Chip
                  size="small"
                  icon={<PersonIcon />}
                  label="New User → Shop"
                  color="success"
                  variant="outlined"
                />
              </Stack>
            </Stack>

          </CardContent>
        </Paper>

        <Typography variant="caption" color="text.disabled" display="block" sx={{ textAlign: 'center', mt: 3 }}>
          © {new Date().getFullYear()} RetailOS. Backend-connected authentication.
        </Typography>

      </Container>
    </Box>
  );
}
