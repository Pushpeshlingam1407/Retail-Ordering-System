import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import "./index.css";
import App from "./App.tsx";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1d1d1f", // Apple Dark Charcoal
      light: "#2e2e2e",
      dark: "#000000",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#f5f5f7", // Apple Light Gray
      light: "#fafafa",
      dark: "#e8e8ed",
      contrastText: "#1d1d1f",
    },
    success: { main: "#34c759", contrastText: "#fff" }, // Apple Green
    warning: { main: "#ff9500", contrastText: "#fff" }, // Apple Orange
    error: { main: "#ff3b30", contrastText: "#fff" }, // Apple Red
    info: { main: "#0071e3", contrastText: "#fff" }, // Apple Blue / Samsung CTA
    background: { default: "#faf9f6", paper: "#ffffff" },
    text: { primary: "#1d1d1f", secondary: "#5e5e5e", disabled: "#8e8e8e" },
    divider: "#e6e4dd",
  },
  typography: {
    fontFamily: '"Anthropic", "Cohere"',
    h1: {
      fontFamily: '"Anthropic", "Cohere"',
      fontWeight: 600,
      letterSpacing: "-0.01em",
    },
    h2: {
      fontFamily: '"Anthropic", "Cohere"',
      fontWeight: 600,
      letterSpacing: "-0.01em",
    },
    h3: {
      fontFamily: '"Anthropic", "Cohere"',
      fontWeight: 500,
      letterSpacing: "-0.01em",
    },
    h4: {
      fontFamily: '"Anthropic", "Cohere"',
      fontWeight: 500,
      letterSpacing: "-0.01em",
    },
    h5: {
      fontFamily: '"Anthropic", "Cohere"',
      fontWeight: 500,
      letterSpacing: "-0.01em",
    },
    h6: {
      fontFamily: '"Anthropic", "Cohere"',
      fontWeight: 500,
      letterSpacing: "-0.01em",
    },
    button: {
      fontFamily: '"Anthropic", "Cohere"',
      fontWeight: 600,
      textTransform: "none",
      letterSpacing: "-0.01em",
    },
    body1: { letterSpacing: "-0.01em" },
    body2: { letterSpacing: "-0.01em" },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#F6F5EF",
          backgroundImage: `
            radial-gradient(at 0% 0%, rgba(206, 172, 114, 0.16) 0px, transparent 40%),
            radial-gradient(at 100% 0%, rgba(212, 190, 153, 0.16) 0px, transparent 40%),
            radial-gradient(at 50% 100%, rgba(220, 215, 201, 0.22) 0px, transparent 50%),
            radial-gradient(at 20% 70%, rgba(240, 237, 230, 0.2) 0px, transparent 40%),
            radial-gradient(at 80% 40%, rgba(21, 128, 61, 0.02) 0px, transparent 30%)
          `,
          backgroundAttachment: "fixed",
          backgroundRepeat: "no-repeat",
          minHeight: "100vh",
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: "99px",
          padding: "10px 24px",
          fontWeight: 600,
          letterSpacing: "-0.015em",
          transition:
            "background-color 250ms cubic-bezier(0.4, 0, 0.2, 1), transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1)",
          textTransform: "none",
          border: "1px solid transparent",
          "&:hover": {
            transform: "translateY(-1.5px)",
            boxShadow: "0 6px 16px rgba(25, 25, 25, 0.06)",
          },
          "&:active": {
            transform: "scale(0.96) translateY(0)",
            boxShadow: "0 2px 4px rgba(25, 25, 25, 0.02)",
          },
        },
        outlined: {
          borderColor: "#e6e4dd",
          color: "#5e5e5e",
          "&:hover": {
            borderColor: "#1d1d1f",
            backgroundColor: "rgba(25, 25, 25, 0.03)",
            color: "#1d1d1f",
          },
        },
        contained: {
          backgroundColor: "#1d1d1f",
          color: "#ffffff",
          "&:hover": {
            backgroundColor: "#000000",
            boxShadow: "0 8px 20px rgba(0, 0, 0, 0.12)",
          },
          "&.MuiButton-containedSecondary": {
            backgroundColor: "#f5f5f7",
            color: "#1d1d1f",
            border: "1px solid rgba(0, 0, 0, 0.04)",
            "&:hover": {
              backgroundColor: "#e8e8ed",
              color: "#000000",
              boxShadow: "0 6px 16px rgba(0, 0, 0, 0.03)",
            },
          },
          "&.MuiButton-containedInfo": {
            backgroundColor: "#0071e3",
            color: "#ffffff",
            "&:hover": {
              backgroundColor: "#005bbf",
              boxShadow: "0 8px 20px rgba(0, 113, 227, 0.24)",
            },
          },
          "&.MuiButton-containedSuccess": {
            backgroundColor: "#34c759",
            color: "#ffffff",
            "&:hover": {
              backgroundColor: "#28a745",
              boxShadow: "0 8px 20px rgba(52, 199, 89, 0.24)",
            },
          },
          "&.MuiButton-containedError": {
            backgroundColor: "#ff3b30",
            color: "#ffffff",
            "&:hover": {
              backgroundColor: "#d6251b",
              boxShadow: "0 8px 20px rgba(255, 59, 48, 0.24)",
            },
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
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.03)",
          border: "1px solid rgba(25, 25, 25, 0.08)",
          borderRadius: "16px",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        root: {
          "& .MuiBackdrop-root": {
            backgroundColor: "rgba(25, 25, 25, 0.35)",
            backdropFilter: "blur(8px)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(12px) saturate(180%)",
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.03)",
          border: "1px solid rgba(25, 25, 25, 0.08)",
          borderRadius: "16px",
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
            borderColor: "#1d1d1f",
            borderWidth: "1.5px",
          },
          "&.Mui-focused": {
            boxShadow: "0 0 0 3px rgba(29, 78, 216, 0.04)",
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: "1px solid #e6e4dd",
          padding: "14px 20px",
          fontSize: "14px",
          color: "#1d1d1f",
        },
        head: {
          backgroundColor: "#f3f1eb",
          color: "#5e5e5e",
          fontWeight: 600,
          fontSize: "13px",
          letterSpacing: "0.02em",
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          width: 42,
          height: 26,
          padding: 0,
          display: "inline-flex",
          "& .MuiSwitch-switchBase": {
            padding: 0,
            margin: 2,
            transitionDuration: "300ms",
            "&.Mui-checked": {
              transform: "translateX(16px)",
              color: "#fff",
              "& + .MuiSwitch-track": {
                backgroundColor: "#34c759", // Apple success green
                opacity: 1,
                border: 0,
              },
              "&.Mui-disabled + .MuiSwitch-track": {
                opacity: 0.5,
              },
            },
            "&.Mui-focusVisible .MuiSwitch-thumb": {
              color: "#34c759",
              border: "6px solid #fff",
            },
            "&.Mui-disabled .MuiSwitch-thumb": {
              color: "#f4f3ef",
            },
            "&.Mui-disabled + .MuiSwitch-track": {
              opacity: 0.7,
            },
          },
          "& .MuiSwitch-thumb": {
            boxSizing: "border-box",
            width: 22,
            height: 22,
            boxShadow: "0 2px 4px 0 rgba(0, 35, 11, 0.15)",
          },
          "& .MuiSwitch-track": {
            borderRadius: 13,
            backgroundColor: "#e6e4dd",
            opacity: 1,
            transition: "background-color 500ms",
          },
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
