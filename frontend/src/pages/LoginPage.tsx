import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Collapse,
  FormControl,
  FormHelperText,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Stack,
  Typography,
  Link,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { validateEmail, validatePassword } from "../utils/validation";
import notify from "../utils/notify";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const emailError = touched.email ? validateEmail(email) : "";
  const passwordError = touched.password ? validatePassword(password) : "";
  const isValid = !validateEmail(email) && !validatePassword(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    setLoginError("");
    if (!isValid) return;
    try {
      setLoading(true);
      await login(email, password, "USER");
      notify.success("Welcome back!");
      navigate("/");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setLoginError(err?.message ?? "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", bgcolor: "transparent" }}>
      {/* Left Pane - Editorial Brand Highlight */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          flex: "1 1 42%",
          bgcolor: "#1d1d1f",
          backgroundImage: 
            "radial-gradient(circle at 80% 20%, rgba(206,172,114,0.15) 0%, transparent 60%), radial-gradient(circle at 20% 80%, rgba(21,128,61,0.05) 0%, transparent 50%)",
          color: "#fff",
          flexDirection: "column",
          justifyContent: "space-between",
          p: 6,
          borderRight: "1px solid rgba(255,255,255,0.05)"
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "8px",
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              fontWeight: 700,
              color: "#1d1d1f",
            }}
          >
            R
          </Box>
          <Typography sx={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" }}>
            RetailOS
          </Typography>
        </Box>

        <Box>
          <Typography variant="h3" sx={{ fontWeight: 500, mb: 3, letterSpacing: "-0.03em", lineHeight: 1.15 }}>
            Operational control, <br />
            <span style={{ color: "#D4BE99" }}>designed for growth.</span>
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: 15, lineHeight: 1.6, maxWidth: 440, fontWeight: 400 }}>
            Experience an enterprise-grade retail orchestrator built with precision. Manage products, optimize inventory thresholds, and track orders in a single, high-fidelity console.
          </Typography>
        </Box>

        <Box>
          <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
            © 2026 RetailOS. Design System Transformation v1.0.
          </Typography>
        </Box>
      </Box>

      {/* Right Pane - Authentication Form */}
      <Box
        sx={{
          flex: "1 1 58%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: { xs: 3, md: 6 },
          backgroundImage: "radial-gradient(at 0% 0%, rgba(206,172,114,0.06) 0%, transparent 50%)",
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 380 }}>
          {/* Logo for mobile view */}
          <Box sx={{ display: { xs: "flex", md: "none" }, alignItems: "center", gap: 1, mb: 5 }}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: "6px",
                background: "#1d1d1f",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 700,
                color: "#fff",
              }}
            >
              R
            </Box>
            <Typography sx={{ fontSize: 16, fontWeight: 600, color: "#1d1d1f" }}>
              RetailOS
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 600, color: "#1d1d1f", letterSpacing: "-0.03em" }}>
              Welcome back
            </Typography>
            <Typography sx={{ mt: 1, fontSize: 14, color: "text.secondary" }}>
              Please sign in to your retail console
            </Typography>
          </Box>

          <Collapse in={!!loginError} unmountOnExit sx={{ mb: 3 }}>
            <Alert severity="error" onClose={() => setLoginError("")} sx={{ borderRadius: "8px" }}>
              {loginError}
            </Alert>
          </Collapse>

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Stack spacing={2.5}>
              <FormControl fullWidth error={!!emailError}>
                <InputLabel>Email address</InputLabel>
                <OutlinedInput
                  label="Email address"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setLoginError("");
                  }}
                  onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                />
                {emailError && <FormHelperText>{emailError}</FormHelperText>}
              </FormControl>

              <FormControl fullWidth error={!!passwordError}>
                <InputLabel>Password</InputLabel>
                <OutlinedInput
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setLoginError("");
                  }}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((v) => !v)}
                        edge="end"
                        size="small"
                        sx={{ color: "text.secondary" }}
                      >
                        {showPassword ? (
                          <VisibilityOffIcon fontSize="small" />
                        ) : (
                          <VisibilityIcon fontSize="small" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  }
                />
                {passwordError && (
                  <FormHelperText>{passwordError}</FormHelperText>
                )}
              </FormControl>

              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                disabled={loading}
                fullWidth
                sx={{ py: 1.4, mt: 1, fontWeight: 600 }}
              >
                {loading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  "Sign In"
                )}
              </Button>
            </Stack>
          </Box>

          <Typography
            sx={{
              mt: 4,
              fontSize: 14,
              textAlign: "center",
              color: "text.secondary",
            }}
          >
            New here?{" "}
            <Link
              component="button"
              type="button"
              onClick={(e) => {
                e.preventDefault();
                navigate("/signup");
              }}
              sx={{
                fontWeight: 600,
                color: "#1d1d1f",
                textDecoration: "none",
                "&:hover": { textDecoration: "underline" }
              }}
            >
              Create an account
            </Link>
          </Typography>

          <Typography
            sx={{
              mt: 2.5,
              fontSize: 13,
              textAlign: "center",
              color: "text.secondary",
            }}
          >
            <Link
              component="button"
              type="button"
              onClick={(e) => {
                e.preventDefault();
                navigate("/admin-login");
              }}
              sx={{
                color: "text.secondary",
                textDecoration: "none",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              Admin Portal
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
