import { Box, Typography } from "@mui/material";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import { GRADIENTS } from "../theme/theme";

/**
 * Brand mark used across the app (header + auth pages).
 */
function Logo({ size = "medium", showText = true, color, sx }) {
  const dims =
    size === "small"
      ? { box: 30, icon: 18, font: "1rem" }
      : size === "large"
        ? { box: 48, icon: 28, font: "1.5rem" }
        : { box: 38, icon: 22, font: "1.2rem" };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, ...sx }}>
      <Box
        sx={{
          width: dims.box,
          height: dims.box,
          borderRadius: "30%",
          background: GRADIENTS.brand,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          boxShadow: "0 6px 16px rgba(79, 70, 229, 0.4)",
          flexShrink: 0,
        }}
      >
        <BoltRoundedIcon sx={{ fontSize: dims.icon }} />
      </Box>
      {showText && (
        <Typography
          variant="h6"
          sx={{
            fontWeight: 800,
            letterSpacing: "-0.02em",
            fontSize: dims.font,
            color: color || "text.primary",
            whiteSpace: "nowrap",
          }}
        >
          Logic_Gate
          <Box component="span" sx={{ color: "primary.main" }}>
            {" "}
            Simulator
          </Box>
        </Typography>
      )}
    </Box>
  );
}

export default Logo;
