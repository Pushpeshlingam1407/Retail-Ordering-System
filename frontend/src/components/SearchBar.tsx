import React from "react";
import { TextField, InputAdornment, TextFieldProps } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

export type SearchBarProps = Omit<TextFieldProps, "variant" | "slotProps"> & {
  onSearchChange: (value: string) => void;
};

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearchChange,
  placeholder = "Search...",
  value,
  ...props
}) => {
  return (
    <TextField
      size="small"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onSearchChange(e.target.value)}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
            </InputAdornment>
          ),
        },
      }}
      sx={{
        width: { xs: "100%", sm: 260 },
        "& .MuiOutlinedInput-root": {
          borderRadius: "999px",
          bgcolor: "#f5f3ee",
          pl: 1.5,
          "& fieldset": { borderColor: "transparent" },
          "&:hover fieldset": { borderColor: "rgba(0,0,0,0.1)" },
          "&.Mui-focused fieldset": { borderColor: "#1d1d1f" },
        },
        ...props.sx,
      }}
      {...props}
    />
  );
};
