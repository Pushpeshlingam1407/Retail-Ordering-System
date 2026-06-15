import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import "./index.css";
import App from "./App.tsx";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#191919",
      light: "#2e2e2e",
      dark: "#0a0a0a",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#5e5e5e",
      light: "#7e7e7e",
      dark: "#3a3a3a",
      contrastText: "#ffffff",
    },
    success: { main: "#15803d", contrastText: "#fff" },
    warning: { main: "#b45309", contrastText: "#fff" },
    error: { main: "#b91c1c", contrastText: "#fff" },
    info: { main: "#1d4ed8", contrastText: "#fff" },
    background: { default: "#faf9f6", paper: "#ffffff" },
    text: { primary: "#191919", secondary: "#5e5e5e", disabled: "#8e8e8e" },
    divider: "#e6e4dd",
  },
  typography: {
    fontFamily: '"CohereText", "Anthropic Sans", -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Plus Jakarta Sans", "Instrument Sans", system-ui, sans-serif',
    h1: { fontWeight: 700, letterSpacing: "-0.03em" },
    h2: { fontWeight: 700, letterSpacing: "-0.03em" },
    h3: { fontWeight: 600, letterSpacing: "-0.02em" },
    h4: { fontWeight: 600, letterSpacing: "-0.02em" },
    h5: { fontWeight: 600, letterSpacing: "-0.01em" },
    h6: { fontWeight: 600, letterSpacing: "-0.01em" },
    button: { fontWeight: 500, textTransform: "none", letterSpacing: "0.01em" },
    body1: { letterSpacing: "-0.01em" },
    body2: { letterSpacing: "-0.01em" },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: "8px",
          padding: "10px 20px",
          transition: "all 150ms cubic-bezier(0.16, 1, 0.3, 1)",
          "&:active": {
            transform: "scale(0.97)",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(12px) saturate(180%)",
          boxShadow:
            "0 8px 32px -4px rgba(25, 25, 25, 0.04), 0 2px 12px -2px rgba(25, 25, 25, 0.02)",
          border: "1px solid rgba(230, 228, 221, 0.6)",
          borderRadius: "12px",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(12px) saturate(180%)",
          boxShadow:
            "0 8px 32px -4px rgba(25, 25, 25, 0.04), 0 2px 12px -2px rgba(25, 25, 25, 0.02)",
          border: "1px solid rgba(230, 228, 221, 0.6)",
          borderRadius: "12px",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff",
          borderRadius: "8px",
          transition: "all 150ms cubic-bezier(0.16, 1, 0.3, 1)",
          "& fieldset": { borderColor: "#e6e4dd" },
          "&:hover fieldset": { borderColor: "#cbd5e1" },
          "&.Mui-focused fieldset": { 
            borderColor: "#191919",
            borderWidth: "1.5px"
          },
          "&.Mui-focused": {
            boxShadow: "0 0 0 3px rgba(25, 25, 25, 0.04)"
          }
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: "1px solid #e6e4dd",
          padding: "14px 20px",
          fontSize: "14px",
          color: "#191919"
        },
        head: {
          backgroundColor: "#f3f1eb",
          color: "#5e5e5e",
          fontWeight: 600,
          fontSize: "13px",
          letterSpacing: "0.02em"
        },
      },
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>,
);
