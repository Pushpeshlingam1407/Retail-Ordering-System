import {
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import notify from "../utils/notify";

interface CouponSuccessPopupProps {
  open: boolean;
  title: string;
  couponCode: string;
  description: string;
  highlightLabel: string;
  highlightValue: string;
  ctaLabel?: string;
  onClose: () => void;
}

export default function CouponSuccessPopup({
  open,
  title,
  couponCode,
  description,
  highlightLabel,
  highlightValue,
  ctaLabel = "Continue",
  onClose,
}: CouponSuccessPopupProps) {
  const copyCode = () => {
    if (!couponCode) return;
    navigator.clipboard
      .writeText(couponCode)
      .then(() => notify.info(`Copied ${couponCode}`));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogContent sx={{ p: 4, position: "relative" }}>
        <IconButton
          size="small"
          onClick={onClose}
          sx={{
            position: "absolute",
            top: 16,
            right: 16,
            color: "text.secondary",
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>

        <Stack
          spacing={3}
          sx={{ alignItems: "center", textAlign: "center", mt: 1 }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: "16px",
              bgcolor: "#fdf6e2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              border: "1px solid rgba(0,0,0,0.02)",
            }}
          >
            🎉
          </Box>
          <Box>
            <Typography
              sx={{ fontSize: 18, fontWeight: 600, mb: 1, color: "#191919" }}
            >
              {title}
            </Typography>
            <Typography
              sx={{ fontSize: 14, color: "text.secondary", lineHeight: 1.5 }}
            >
              {description}
            </Typography>
          </Box>
          {couponCode && (
            <Box
              onClick={copyCode}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: 3,
                py: 1.5,
                borderRadius: "8px",
                bgcolor: "#faf9f6",
                border: "1px dashed #c8c6be",
                cursor: "pointer",
                transition: "all var(--t-fast)",
                "&:hover": { bgcolor: "#f3f1eb", borderColor: "#1d1d1f" },
              }}
            >
              <Typography
                sx={{
                  fontFamily: '"Anthropic", "Cohere", "Apple"',
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#1d1d1f",
                  letterSpacing: "0.1em",
                }}
              >
                {couponCode}
              </Typography>
              <ContentCopyIcon
                fontSize="small"
                sx={{ color: "text.secondary", fontSize: 16 }}
              />
            </Box>
          )}
          {highlightLabel && (
            <Box>
              <Typography
                sx={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "text.secondary",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  mb: 0.5,
                }}
              >
                {highlightLabel}
              </Typography>
              <Typography
                sx={{ fontSize: 24, fontWeight: 700, color: "success.main" }}
              >
                {highlightValue}
              </Typography>
            </Box>
          )}
          <Button
            variant="contained"
            fullWidth
            onClick={onClose}
            sx={{ mt: 2, py: 1.25, fontWeight: 600 }}
          >
            {ctaLabel}
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
