import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  MarkerType,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import '../styles/canvas.css';
import { Box, Snackbar, Alert, Chip, Fade, Tooltip, Skeleton, Stack, Button, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import HubRoundedIcon from '@mui/icons-material/HubRounded';
import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import KeyboardRoundedIcon from '@mui/icons-material/KeyboardRounded';
import { v4 as uuidv4 } from 'uuid';
import Toolbar from '../components/canvas/Toolbar';
import LogicGateNode from '../components/gates/LogicGateNode';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { circuitAPI, getErrorMessage } from '../services/api';
import { simulateCircuit } from '../utils/simulation';
import { serializeNodes, serializeEdges } from '../utils/circuit';
import { getGateTemplate } from '../utils/gateTemplates';
import { GATE_ACCENT } from '../utils/gates';
import { useParams, useNavigate } from 'react-router-dom';

const nodeTypes = {
  logicGate: LogicGateNode,
};

const EDGE_DEFAULTS = (isDark) => ({
  type: 'smoothstep',
  markerEnd: { type: MarkerType.ArrowClosed, color: isDark ? '#94a3b8' : '#64748b' },
  style: { strokeWidth: 2, stroke: isDark ? '#64748b' : '#94a3b8' },
});


function EditorInner() {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { screenToFlowPosition } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [circuitName, setCircuitName] = useState('Untitled Circuit');
  const [circuitId, setCircuitId] = useState(id || null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [loading, setLoading] = useState(Boolean(id));
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const savedSnapshotRef = useRef('');

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);
  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  const showMessage = useCallback(
    (message, severity = 'success') => setSnackbar({ open: true, message, severity }),
    []
  );

  /** Canonical serialization used for both saving and dirty-detection. */
  const snapshot = useCallback(
    (nds, eds, name) =>
      JSON.stringify({
        name,
        nodes: serializeNodes(nds ?? nodesRef.current),
        edges: serializeEdges(eds ?? edgesRef.current),
      }),
    []
  );

  // Mark the document dirty whenever the graph or name drifts from the last
  // saved snapshot.
  useEffect(() => {
    if (loading) return;
    setDirty(snapshot(nodes, edges, circuitName) !== savedSnapshotRef.current);
  }, [nodes, edges, circuitName, loading, snapshot]);

  // Toggle an INPUT node's value (wired into each node via data.onToggle).
  const toggleInput = useCallback(
    (nodeId, value) => {
      setNodes((nds) => nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, value } } : n)));
    },
    [setNodes]
  );

  // Keep the toggle handler fresh on mounted nodes.
  useEffect(() => {
    setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, onToggle: toggleInput } })));
  }, [toggleInput, setNodes]);

  /** Attach the per-node metadata the custom node component expects. */
  const decorateNode = useCallback(
    (node) => ({ ...node, data: { ...node.data, id: node.id, onToggle: toggleInput } }),
    [toggleInput]
  );

  const loadCircuit = useCallback(
    async (targetId) => {
      setLoading(true);
      setLoadError('');
      try {
        const { data } = await circuitAPI.getOne(targetId);
        const circuit = data.circuit;

        const loadedNodes = (circuit.nodes || []).map((n) =>
          decorateNode({
            id: n.id,
            type: 'logicGate',
            position: n.position,
            data: { ...(n.data || {}), type: n.type },
          })
        );
        const loadedEdges = (circuit.edges || []).map((e) => ({ ...e, ...EDGE_DEFAULTS(isDark) }));

        setCircuitName(circuit.name);
        setNodes(loadedNodes);
        setEdges(loadedEdges);
        savedSnapshotRef.current = JSON.stringify({
          name: circuit.name,
          nodes: serializeNodes(loadedNodes),
          edges: serializeEdges(loadedEdges),
        });
        setDirty(false);
      } catch (error) {
        setLoadError(getErrorMessage(error, 'Failed to load circuit'));
      } finally {
        setLoading(false);
      }
    },
    [decorateNode, setNodes, setEdges, isDark]
  );

  useEffect(() => {
    if (circuitId) {
      loadCircuit(circuitId);
    } else {
      savedSnapshotRef.current = JSON.stringify({ name: 'Untitled Circuit', nodes: [], edges: [] });
    }
  }, [circuitId, loadCircuit]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, ...EDGE_DEFAULTS(isDark) }, eds)),
    [setEdges, isDark]
  );

  const addGate = useCallback(
    (gateType) => {
      const template = getGateTemplate(gateType);
      if (!template) {
        showMessage(`Unknown gate type "${gateType}"`, 'error');
        return;
      }
      // Drop new gates near the centre of the visible canvas.
      const position = screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });
      setNodes((nds) => [
        ...nds,
        decorateNode({
          id: uuidv4(),
          type: 'logicGate',
          position,
          // Mirror loadCircuit: the gate type must live in `data` because the
          // node renderer, minimap and simulator all read `data.type`.
          data: { ...template.data, type: gateType },
        }),
      ]);
    },
    [screenToFlowPosition, setNodes, decorateNode, showMessage]
  );

  const toggleSimulation = () => setIsSimulating((prev) => !prev);

  const saveCircuit = useCallback(async () => {
    const name = circuitName.trim() || 'Untitled Circuit';
    setSaving(true);
    try {
      const payload = {
        name,
        nodes: serializeNodes(nodesRef.current),
        edges: serializeEdges(edgesRef.current),
      };

      let saved;
      if (circuitId) {
        const { data } = await circuitAPI.update(circuitId, payload);
        saved = data.circuit;
      } else {
        const { data } = await circuitAPI.create(payload);
        saved = data.circuit;
        setCircuitId(saved._id);
        // Reflect the new id in the URL without remounting the editor.
        navigate(`/editor/${saved._id}`, { replace: true });
      }

      savedSnapshotRef.current = JSON.stringify(payload);
      setDirty(false);
      showMessage('Circuit saved');
      return saved;
    } catch (error) {
      showMessage(getErrorMessage(error, 'Failed to save circuit'), 'error');
      return null;
    } finally {
      setSaving(false);
    }
  }, [circuitName, circuitId, navigate, showMessage]);

  const handleDeleteSelected = useCallback(() => {
    const selectedNodeIds = new Set(nodesRef.current.filter((n) => n.selected).map((n) => n.id));
    if (selectedNodeIds.size === 0) {
      showMessage('Select a gate or wire to delete', 'info');
      return;
    }
    setNodes((nds) => nds.filter((n) => !n.selected));
    // Also drop any wire attached to a removed gate so the graph stays valid.
    setEdges((eds) =>
      eds.filter(
        (e) => !e.selected && !selectedNodeIds.has(e.source) && !selectedNodeIds.has(e.target)
      )
    );
  }, [setNodes, setEdges, showMessage]);

  const requestLeave = useCallback(() => {
    if (dirty) setLeaveOpen(true);
    else navigate('/dashboard');
  }, [dirty, navigate]);

  const confirmLeave = () => {
    setLeaveOpen(false);
    navigate('/dashboard');
  };

  const saveAndLeave = async () => {
    const saved = await saveCircuit();
    if (saved) {
      setLeaveOpen(false);
      navigate('/dashboard');
    }
  };

  // ---- Simulation: fixed-point evaluation on a 120ms poll while running ----
  useEffect(() => {
    if (!isSimulating) return undefined;

    const run = () => {
      const currentNodes = nodesRef.current;
      const currentEdges = edgesRef.current;

      const result = simulateCircuit(
        currentNodes.map((n) => ({
          id: n.id,
          type: n.data?.type,
          data: { value: n.data?.value, inputCount: n.data?.inputCount },
        })),
        currentEdges.map((e) => ({
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle,
          targetHandle: e.targetHandle,
        }))
      );

      setNodes((nds) =>
        nds.map((n) => {
          const next = result.values[n.id];
          if (next === undefined || next === n.data?.value) return n;
          return { ...n, data: { ...n.data, value: next } };
        })
      );
    };

    run();
    const interval = setInterval(run, 120);
    return () => clearInterval(interval);
  }, [isSimulating, setNodes]);

  // ---- Keyboard shortcuts ----
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable;

      if ((e.key === 'Delete' || e.key === 'Backspace') && !typing) {
        handleDeleteSelected();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveCircuit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDeleteSelected, saveCircuit]);

  // ---- Warn before losing unsaved work on tab close / refresh ----
  useEffect(() => {
    if (!dirty) return undefined;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const isDarkTheme = theme.palette.mode === 'dark';

  // ---- Loading / error states -------------------------------------------------
  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Skeleton variant="rounded" height={56} />
        <Skeleton variant="rounded" sx={{ flex: 1, minHeight: '60vh' }} />
      </Box>
    );
  }

  if (loadError) {
    return (
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 10 }}>
        <Alert severity="error" sx={{ maxWidth: 480 }}>
          {loadError}
        </Alert>
        <Stack direction="row" spacing={1.5}>
          <Button variant="outlined" onClick={() => navigate('/dashboard')}>
            Back to dashboard
          </Button>
          {circuitId && (
            <Button variant="contained" onClick={() => loadCircuit(circuitId)}>
              Retry
            </Button>
          )}
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: 'background.default' }}>
      <Toolbar
        circuitName={circuitName}
        setCircuitName={setCircuitName}
        onSave={saveCircuit}
        onAddGate={addGate}
        onToggleSimulation={toggleSimulation}
        isSimulating={isSimulating}
        onDeleteSelected={handleDeleteSelected}
        onBack={requestLeave}
        saving={saving}
        dirty={dirty}
      />

      <Box sx={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          deleteKeyCode={null}
          defaultEdgeOptions={EDGE_DEFAULTS(isDarkTheme)}
        >
          <Background color={isDarkTheme ? '#1e293b' : '#e2e8f0'} gap={20} size={1} />
          <Controls showInteractive={false} />
          <MiniMap
            pannable
            zoomable
            nodeColor={(node) => GATE_ACCENT[node.data?.type] || '#64748b'}
            maskColor={isDarkTheme ? 'rgba(2, 6, 23, 0.6)' : 'rgba(15, 23, 42, 0.08)'}
            style={{ backgroundColor: isDarkTheme ? '#111827' : '#f8fafc' }}
          />
        </ReactFlow>

        {/* Simulation indicator — a slim instrument readout, not a pill */}
        <Fade in={isSimulating}>
          <Box
            sx={{
              position: 'absolute',
              top: 10,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 5,
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              px: 1,
              py: 0.5,
              borderRadius: '3px',
              border: '1px solid',
              borderColor: 'rgba(22,163,74,0.5)',
              bgcolor: (t) =>
                t.palette.mode === 'dark' ? 'rgba(22,163,74,0.16)' : 'rgba(22,163,74,0.1)',
            }}
          >
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: '#16a34a',
                animation: 'lgs-pulse 1.4s ease-in-out infinite',
                '@keyframes lgs-pulse': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.25 },
                },
              }}
            />
            <Typography
              sx={{
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                lineHeight: 1,
                color: '#15803d',
              }}
            >
              Simulating
            </Typography>
          </Box>
        </Fade>

        {/* Empty-canvas hint */}
        {nodes.length === 0 && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <Box
              sx={{
                px: 2,
                py: 1.25,
                borderRadius: '4px',
                border: '1px dashed',
                borderColor: 'divider',
                textAlign: 'center',
              }}
            >
              <Typography
                sx={{
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'text.disabled',
                  lineHeight: 1.4,
                }}
              >
                Canvas empty
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>
                Add a gate from the palette to begin
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      {/* Status bar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 2,
          py: 1,
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          fontSize: '0.78rem',
          color: 'text.secondary',
          flexWrap: 'wrap',
        }}
      >
        <Chip
          size="small"
          icon={<AccountTreeRoundedIcon sx={{ fontSize: 15 }} />}
          label={`${nodes.length} gates`}
          variant="outlined"
          sx={{ fontWeight: 600, height: 24 }}
        />
        <Chip
          size="small"
          icon={<HubRoundedIcon sx={{ fontSize: 15 }} />}
          label={`${edges.length} wires`}
          variant="outlined"
          sx={{ fontWeight: 600, height: 24 }}
        />
        <Chip
          size="small"
          label={isSimulating ? 'Simulation running' : 'Idle'}
          color={isSimulating ? 'success' : 'default'}
          variant={isSimulating ? 'filled' : 'outlined'}
          sx={{ fontWeight: 600, height: 24 }}
        />
        <Box sx={{ flex: 1 }} />
        <Tooltip title="Keyboard shortcuts">
          <Chip
            size="small"
            icon={<KeyboardRoundedIcon sx={{ fontSize: 15 }} />}
            label="Del: delete · Ctrl/⌘+S: save"
            variant="outlined"
            sx={{ fontWeight: 600, height: 24, display: { xs: 'none', sm: 'inline-flex' } }}
          />
        </Tooltip>
        <Chip
          size="small"
          icon={<SaveRoundedIcon sx={{ fontSize: 15 }} />}
          label={dirty ? 'Unsaved changes' : 'All changes saved'}
          color={dirty ? 'warning' : 'default'}
          variant="outlined"
          sx={{ fontWeight: 600, height: 24, display: { xs: 'none', md: 'inline-flex' } }}
        />
      </Box>

      <ConfirmDialog
        open={leaveOpen}
        title="Unsaved changes"
        message="You have unsaved changes. Save before leaving?"
        confirmText="Save & leave"
        cancelText="Discard"
        confirmColor="primary"
        loading={saving}
        onConfirm={saveAndLeave}
        onCancel={confirmLeave}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

function Editor() {
  return (
    <ReactFlowProvider>
      <EditorInner />
    </ReactFlowProvider>
  );
}

export default Editor;


