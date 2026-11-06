import { memo, useState } from 'react';
import {
  Card,
  Box,
  Typography,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Stack,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import EditIcon from '@mui/icons-material/EditRounded';
import CopyIcon from '@mui/icons-material/ContentCopyRounded';
import DeleteIcon from '@mui/icons-material/DeleteOutlineRounded';
import PublicRoundedIcon from '@mui/icons-material/PublicRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import HubRoundedIcon from '@mui/icons-material/HubRounded';
import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import CircuitPreview from './CircuitPreview';
import { MONO_FONT } from '../gates/gateSymbolStyles';

/** "2h ago" / "3d ago" — compact relative time, no dependency. */
const timeAgo = (iso) => {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
};

/** A labelled metric in the card's footer strip. */
function Metric({ icon, value, label, title }) {
  return (
    <Tooltip title={title} arrow>
      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0 }}>
        <Box sx={{ display: 'flex', color: 'text.disabled', '& svg': { fontSize: 14 } }}>{icon}</Box>
        <Typography
          variant="caption"
          sx={{ fontFamily: MONO_FONT, fontWeight: 700, fontSize: '0.72rem', lineHeight: 1 }}
        >
          {value}
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: 'text.secondary', fontSize: '0.68rem', lineHeight: 1 }}
        >
          {label}
        </Typography>
      </Stack>
    </Tooltip>
  );
}

/**
 * Circuit card used by the Dashboard and the Public gallery.
 *
 * Visual language: a bordered "panel" with a status rail, a schematic preview
 * of the actual circuit, and a footer of monospaced metrics — the density and
 * typography you'd expect from an engineering tool rather than a marketing
 * tile. All behaviour (menu, actions, visibility) is prop-driven so the same
 * component serves owned and community circuits.
 */
function CircuitCard({
  circuit,
  variant = 'owned',
  onOpen,
  onDuplicate,
  onDelete,
  onTogglePublic,
  onMenu,
  menuAnchorEl,
  onMenuClose,
  menuTarget,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [hovered, setHovered] = useState(false);

  const isPublic = Boolean(circuit.isPublic);
  const gateCount = circuit.gateCount ?? circuit.nodes?.length ?? 0;
  const wireCount = circuit.wireCount ?? circuit.edges?.length ?? 0;
  const ownerName = circuit.owner?.name;

  const hasMenu =
    variant === 'owned' && onMenu && menuAnchorEl && menuTarget?._id === circuit._id;

  // Status rail colour: visibility is a circuit's primary state.
  const railColor = isPublic ? '#16a34a' : isDark ? '#475569' : '#94a3b8';

  const open = () => onOpen?.(circuit._id);

  return (
    <Card
      className="lgs-fade-in"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        cursor: 'pointer',
        borderRadius: 2.5,
        // Left status rail — reads as a system state indicator.
        borderLeft: '3px solid',
        borderLeftColor: railColor,
        transition: 'border-color .2s ease, box-shadow .25s ease, transform .2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: isDark ? 10 : 6,
          borderColor: alpha(theme.palette.primary.main, 0.5),
          borderLeftColor: isPublic ? '#16a34a' : theme.palette.primary.main,
        },
      }}
    >
      {/* Header: identity + state + menu */}
      <Box sx={{ px: 2, pt: 1.75, pb: 1.25 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              noWrap
              title={circuit.name}
              sx={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.3, letterSpacing: '-0.01em' }}
            >
              {circuit.name}
            </Typography>

            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.5, minWidth: 0 }}>
              {/* Visibility badge */}
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.4,
                  px: 0.6,
                  py: 0.15,
                  borderRadius: 0.75,
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: isPublic ? '#15803d' : 'text.secondary',
                  bgcolor: isPublic
                    ? alpha('#22c55e', isDark ? 0.2 : 0.14)
                    : alpha(isDark ? '#94a3b8' : '#64748b', 0.12),
                  '& svg': { fontSize: 11 },
                }}
              >
                {isPublic ? <PublicRoundedIcon /> : <LockRoundedIcon />}
                {isPublic ? 'Public' : 'Private'}
              </Box>

              {variant === 'public' && ownerName && (
                <Stack direction="row" spacing={0.4} alignItems="center" sx={{ minWidth: 0 }}>
                  <PersonRoundedIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                  <Typography variant="caption" noWrap sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                    {ownerName}
                  </Typography>
                </Stack>
              )}
            </Stack>
          </Box>

          {variant === 'owned' ? (
            <Tooltip title="Circuit actions" arrow>
              <IconButton
                size="small"
                aria-label="Circuit actions"
                onClick={(e) => {
                  e.stopPropagation();
                  onMenu?.(e, circuit);
                }}
                sx={{ mt: -0.5, mr: -0.5 }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="Duplicate into your dashboard" arrow>
              <IconButton
                size="small"
                aria-label="Duplicate circuit"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate?.(circuit._id);
                }}
                sx={{ mt: -0.5, mr: -0.5 }}
              >
                <CopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Schematic preview */}
      <Box onClick={open} sx={{ px: 2, pb: 1.25, position: 'relative', '& svg': { display: 'block' } }}>
        <CircuitPreview
          nodes={circuit.nodes}
          edges={circuit.edges}
          emptyLabel={variant === 'public' ? 'Open to view schematic' : 'Blank circuit'}
        />

        {/* Hover affordance over the preview */}
        {hovered && (
          <Box
            sx={{
              position: 'absolute',
              inset: '0 16px 10px 16px',
              borderRadius: 2,
              bgcolor: alpha(theme.palette.background.paper, 0.72),
              backdropFilter: 'blur(2px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.75,
              pointerEvents: 'none',
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                fontSize: '0.68rem',
              }}
            >
              {variant === 'public' ? 'Open circuit' : 'Open in editor'}
            </Typography>
            <ArrowForwardRoundedIcon sx={{ fontSize: 15 }} />
          </Box>
        )}
      </Box>

      {/* Description */}
      {circuit.description && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            px: 2,
            pb: 1.25,
            fontSize: '0.78rem',
            lineHeight: 1.45,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {circuit.description}
        </Typography>
      )}

      <Box sx={{ flex: 1 }} />

      {/* Footer: metrics + timestamp */}
      <Divider />
      <Box
        sx={{
          px: 2,
          py: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          bgcolor: isDark ? alpha('#fff', 0.015) : alpha('#0f172a', 0.012),
        }}
      >
        <Metric icon={<HubRoundedIcon />} value={gateCount} label="gates" title="Gate count" />
        <Metric icon={<AccountTreeRoundedIcon />} value={wireCount} label="wires" title="Wire count" />
        <Box sx={{ flex: 1 }} />
        <Typography
          variant="caption"
          sx={{ color: 'text.disabled', fontSize: '0.68rem', whiteSpace: 'nowrap' }}
        >
          {timeAgo(circuit.updatedAt || circuit.createdAt)}
        </Typography>
      </Box>

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
            <ListItemText>Open in editor</ListItemText>
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
              <ListItemText>{menuTarget.isPublic ? 'Make private' : 'Make public'}</ListItemText>
            </MenuItem>
          )}
          <Divider />
          <MenuItem
            sx={{ color: 'error.main' }}
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

