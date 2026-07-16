import { memo } from "react";
import {
  Card,
  CardContent,
  CardActions,
  Box,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
} from "@mui/material";
import EditIcon from "@mui/icons-material/EditRounded";
import CopyIcon from "@mui/icons-material/ContentCopyRounded";
import DeleteIcon from "@mui/icons-material/DeleteOutlineRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import MemoryRoundedIcon from "@mui/icons-material/MemoryRounded";
import HubRoundedIcon from "@mui/icons-material/HubRounded";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";

/**
 * Reusable circuit preview card used by Dashboard and Public Circuits.
 * The menu and actions are configured via props so the same visual can be
 * reused for owned vs. community circuits.
 */
function CircuitCard({
  circuit,
  variant = "owned",
  onOpen,
  onDuplicate,
  onDelete,
  onTogglePublic,
  onMenu,
  menuAnchorEl,
  onMenuClose,
  menuTarget,
}) {
  const hasMenu =
    variant === "owned" &&
    onMenu &&
    menuAnchorEl &&
    menuTarget?._id === circuit._id;

  return (
    <Card
      className="lgs-fade-in"
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: 6,
          borderColor: "primary.main",
        },
      }}
    >
      <CardContent sx={{ flex: 1, pb: 1 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2.5,
              bgcolor: "primary.main",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 1.5,
              boxShadow: 2,
            }}
          >
            <MemoryRoundedIcon />
          </Box>
          {variant === "owned" ? (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onMenu?.(e, circuit);
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          ) : (
            <Tooltip title={circuit.isPublic ? "Public" : "Private"}>
              <Chip
                size="small"
                variant="outlined"
                icon={
                  circuit.isPublic ? (
                    <PublicRoundedIcon sx={{ fontSize: 14 }} />
                  ) : (
                    <LockRoundedIcon sx={{ fontSize: 14 }} />
                  )
                }
                label={circuit.isPublic ? "Public" : "Private"}
                color={circuit.isPublic ? "success" : "default"}
              />
            </Tooltip>
          )}
        </Box>
        <Typography variant="h6" fontWeight={700} noWrap gutterBottom>
          {circuit.name}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: 40,
          }}
        >
          {circuit.description || "No description provided."}
        </Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Chip
            size="small"
            variant="outlined"
            icon={<HubRoundedIcon sx={{ fontSize: 14 }} />}
            label={`${circuit.nodes?.length || 0} gates`}
          />
          <Chip
            size="small"
            variant="outlined"
            icon={<AccountTreeRoundedIcon sx={{ fontSize: 14 }} />}
            label={`${circuit.edges?.length || 0} wires`}
          />
          {variant === "public" && circuit.owner?.name && (
            <Chip
              size="small"
              variant="outlined"
              label={`by ${circuit.owner.name}`}
            />
          )}
          {variant === "owned" && circuit.isPublic && (
            <Chip
              size="small"
              color="success"
              icon={<PublicRoundedIcon sx={{ fontSize: 14 }} />}
              label="Public"
            />
          )}
        </Box>
      </CardContent>
      <Divider />
      <CardActions sx={{ justifyContent: "space-between", px: 2 }}>
        <Button
          size="small"
          startIcon={<EditIcon />}
          onClick={(e) => {
            e.stopPropagation();
            onOpen?.(circuit._id);
          }}
        >
          Open
        </Button>
        <Box>
          {variant === "public" && (
            <Tooltip title="Duplicate to your dashboard">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate?.(circuit._id);
                }}
              >
                <CopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {variant === "owned" && onDuplicate && (
            <Tooltip title="Duplicate">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate?.(circuit._id);
                }}
              >
                <CopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {variant === "owned" && (
            <Tooltip title="Delete">
              <IconButton
                size="small"
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(circuit);
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </CardActions>

      {hasMenu && (
        <Menu anchorEl={menuAnchorEl} open onClose={onMenuClose}>
          <MenuItem
            onClick={() => {
              onMenuClose();
              onOpen?.(menuTarget._id);
            }}
          >
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Open</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => {
              onMenuClose();
              onDuplicate?.(menuTarget._id);
            }}
          >
            <ListItemIcon>
              <CopyIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Duplicate</ListItemText>
          </MenuItem>
          {onTogglePublic && (
            <MenuItem
              onClick={() => {
                onMenuClose();
                onTogglePublic?.(menuTarget);
              }}
            >
              <ListItemIcon>
                <PublicRoundedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>
                {menuTarget.isPublic ? "Make Private" : "Make Public"}
              </ListItemText>
            </MenuItem>
          )}
          <Divider />
          <MenuItem
            sx={{ color: "error.main" }}
            onClick={() => {
              onMenuClose();
              onDelete?.(menuTarget);
            }}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </Menu>
      )}
    </Card>
  );
}

export default memo(CircuitCard);
