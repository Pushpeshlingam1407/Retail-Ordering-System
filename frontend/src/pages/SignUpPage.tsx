import React, { useMemo, useState } from "react";
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
  Link,
  OutlinedInput,
  Stack,
  TextField,
  Typography,
  Paper,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  validateEmail,
  getPasswordRuleResults,
  isPasswordValid,
} from "../utils/validation";
import notify from "../utils/notify";

interface SignUpForm {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  password: string;
  confirmPassword: string;
}

const INITIAL_FORM: SignUpForm = {
  name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  postalCode: "",
  password: "",
  confirmPassword: "",
};

export default function SignUpPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<SignUpForm>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [signupError, setSignupError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const passwordRules = useMemo(
    () => getPasswordRuleResults(form.password),
    [form.password],
  );
  const passwordStrength = passwordRules.filter((r) => r.met).length; // 0–5
  const strengthColor =
    passwordStrength <= 1
      ? "#b91c1c"
      : passwordStrength <= 3
        ? "#b45309"
        : "#15803d";
  const strengthLabel =
    passwordStrength === 0
      ? ""
      : passwordStrength <= 2
        ? "Weak"
        : passwordStrength <= 3
          ? "Fair"
          : passwordStrength === 4
            ? "Good"
            : "Strong";

  const errors = useMemo(() => {
    const e: Partial<Record<keyof SignUpForm, string>> = {};
    if (!form.name.trim()) e.name = "Required";
    const emailErr = validateEmail(form.email);
    if (emailErr) e.email = emailErr;
    if (!/^\d{10}$/.test(form.phone.trim())) e.phone = "10 digits";
    if (form.address.trim().length < 8) e.address = "Min 8 chars";
    if (!form.city.trim()) e.city = "Required";
    if (!form.state.trim()) e.state = "Required";
    if (!/^\d{6}$/.test(form.postalCode.trim())) e.postalCode = "6 digits";
    if (!isPasswordValid(form.password)) e.password = "Invalid";
    if (form.confirmPassword !== form.password)
      e.confirmPassword = "Must match";
    return e;
  }, [form]);

  const isValid = Object.keys(errors).length === 0;

  const setField = <K extends keyof SignUpForm>(
    key: K,
    value: SignUpForm[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSignupError("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (!isValid) {
      notify.warning("Please correct the highlighted fields.");
      return;
    }
    try {
      setLoading(true);
      await signup({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        postalCode: form.postalCode.trim(),
      });
      notify.success("Account created!");
      navigate("/shop");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = e as any;
      setSignupError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to create account.",
      );
    } finally {
      setLoading(false);
    }
  };

  const fieldError = (key: keyof SignUpForm) =>
    submitted ? errors[key] : undefined;

  return (
    <Box className="auth-bg">
      <Paper
        sx={{
          width: "100%",
          maxWidth: 520,
          p: { xs: 3, md: 5 },
          borderRadius: "12px",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mb: 3,
            justifyContent: "center",
          }}
        >
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: "6px",
              background: "#191919",
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
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#191919" }}>
            RetailOS
          </Typography>
        </Box>

        <Typography variant="h5" sx={{ textAlign: "center", mb: 3 }}>
          Create your account
        </Typography>

        <Collapse in={!!signupError} unmountOnExit>
          <Alert
            severity="error"
            onClose={() => setSignupError("")}
            sx={{ mb: 3 }}
          >
            {signupError}
          </Alert>
        </Collapse>

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={2}>
            <TextField
              label="Full name"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              error={!!fieldError("name")}
              helperText={fieldError("name")}
              fullWidth
            />
            <Box
              sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}
            >
              <TextField
                label="Email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                error={!!fieldError("email")}
                helperText={fieldError("email")}
              />
              <TextField
                label="Phone"
                value={form.phone}
                onChange={(e) =>
                  setField(
                    "phone",
                    e.target.value.replace(/\D/g, "").slice(0, 10),
                  )
                }
                error={!!fieldError("phone")}
                helperText={fieldError("phone")}
              />
            </Box>
            <TextField
              label="Address line"
              value={form.address}
              onChange={(e) => setField("address", e.target.value)}
              error={!!fieldError("address")}
              helperText={fieldError("address")}
              fullWidth
            />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 120px",
                gap: 2,
              }}
            >
              <TextField
                label="City"
                value={form.city}
                onChange={(e) => setField("city", e.target.value)}
                error={!!fieldError("city")}
                helperText={fieldError("city")}
              />
              <TextField
                label="State"
                value={form.state}
                onChange={(e) => setField("state", e.target.value)}
                error={!!fieldError("state")}
                helperText={fieldError("state")}
              />
              <TextField
                label="Postal code"
                value={form.postalCode}
                onChange={(e) =>
                  setField(
                    "postalCode",
                    e.target.value.replace(/\D/g, "").slice(0, 6),
                  )
                }
                error={!!fieldError("postalCode")}
                helperText={fieldError("postalCode")}
              />
            </Box>
            <Box>
              <FormControl fullWidth error={!!fieldError("password")}>
                <InputLabel>Password</InputLabel>
                <OutlinedInput
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((v) => !v)}
                        edge="end"
                        size="small"
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
                {fieldError("password") && (
                  <FormHelperText>{fieldError("password")}</FormHelperText>
                )}
              </FormControl>
              {form.password && (
                <Box sx={{ mt: 1 }}>
                  <Box sx={{ display: "flex", gap: 0.5, mb: 0.5 }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Box
                        key={i}
                        sx={{
                          flex: 1,
                          height: 3,
                          borderRadius: 2,
                          background:
                            i <= passwordStrength ? strengthColor : "#e2e8f0",
                        }}
                      />
                    ))}
                  </Box>
                  <Typography
                    sx={{
                      fontSize: 11,
                      color: strengthColor,
                      fontWeight: 600,
                      mb: 0.5,
                    }}
                  >
                    {strengthLabel}
                  </Typography>
                  <Stack spacing={0.25}>
                    {passwordRules.map((r) => (
                      <Typography
                        key={r.label}
                        sx={{
                          fontSize: 11,
                          color: r.met ? "#10b981" : "#64748b",
                        }}
                      >
                        {r.met ? "✓" : "○"} {r.label}
                      </Typography>
                    ))}
                  </Stack>
                </Box>
              )}
            </Box>
            <FormControl fullWidth error={!!fieldError("confirmPassword")}>
              <InputLabel>Confirm password</InputLabel>
              <OutlinedInput
                label="Confirm password"
                type={showConfirm ? "text" : "password"}
                value={form.confirmPassword}
                onChange={(e) => setField("confirmPassword", e.target.value)}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirm((v) => !v)}
                      edge="end"
                      size="small"
                    >
                      {showConfirm ? (
                        <VisibilityOffIcon fontSize="small" />
                      ) : (
                        <VisibilityIcon fontSize="small" />
                      )}
                    </IconButton>
                  </InputAdornment>
                }
              />
              {fieldError("confirmPassword") && (
                <FormHelperText>{fieldError("confirmPassword")}</FormHelperText>
              )}
            </FormControl>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={loading}
              fullWidth
              sx={{ py: 1.25 }}
            >
              {loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                "Create Account"
              )}
            </Button>
          </Stack>
        </Box>
        <Typography
          sx={{
            mt: 3,
            fontSize: 14,
            textAlign: "center",
            color: "text.secondary",
          }}
        >
          Already have an account?{" "}
          <Link
            component="button"
            type="button"
            onClick={(e) => {
              e.preventDefault();
              navigate("/login");
            }}
            sx={{
              fontWeight: 600,
              color: "primary.main",
              textDecoration: "none",
            }}
          >
            Sign in
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}
