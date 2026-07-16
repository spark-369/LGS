import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ReactFlow, Background, Controls, MiniMap, addEdge,
  useNodesState, useEdgesState, MarkerType, ReactFlowProvider, useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import '../styles/canvas.css';
import { Box, Snackbar, Alert, Chip, Fade, Tooltip, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import SensorsRoundedIcon from '@mui/icons-material/SensorsRounded';
import HubRoundedIcon from '@mui/icons-material/HubRounded';
import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import KeyboardRoundedIcon from '@mui/icons-material/KeyboardRounded';
import { v4 as uuidv4 } from 'uuid';
import Toolbar from '../components/canvas/Toolbar';
import LogicGateNode from '../components/gates/LogicGateNode';
import { circuitAPI } from '../services/api';
import { simulateCircuit } from '../utils/simulation';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const nodeTypes = {
  logicGate: LogicGateNode,
};

const GATE_TEMPLATES = {
  INPUT: { type: 'INPUT', data: { label: 'Input', value: false, inputCount: 0 } },
  OUTPUT: { type: 'OUTPUT', data: { label: 'Output', value: false, inputCount: 1 } },
  AND: { type: 'AND', data: { label: 'AND', value: false, inputCount: 2 } },
  OR: { type: 'OR', data: { label: 'OR', value: false, inputCount: 2 } },
  NOT: { type: 'NOT', data: { label: 'NOT', value: false, inputCount: 1 } },
  NAND: { type: 'NAND', data: { label: 'NAND', value: false, inputCount: 2 } },
  NOR: { type: 'NOR', data: { label: 'NOR', value: false, inputCount: 2 } },
  XOR: { type: 'XOR', data: { label: 'XOR', value: false, inputCount: 2 } },
  XNOR: { type: 'XNOR', data: { label: 'XNOR', value: false, inputCount: 2 } },
  BUFFER: { type: 'BUFFER', data: { label: 'BUF', value: false, inputCount: 1 } },
  TRISTATE: { type: 'TRISTATE', data: { label: 'TS', value: false, inputCount: 2 } },
  AND3: { type: 'AND3', data: { label: 'AND3', value: false, inputCount: 3 } },
  OR3: { type: 'OR3', data: { label: 'OR3', value: false, inputCount: 3 } },
  NOR3: { type: 'NOR3', data: { label: 'NOR3', value: false, inputCount: 3 } },
  NAND3: { type: 'NAND3', data: { label: 'NAND3', value: false, inputCount: 3 } },
  XOR3: { type: 'XOR3', data: { label: 'XOR3', value: false, inputCount: 3 } },
  XNOR3: { type: 'XNOR3', data: { label: 'XNOR3', value: false, inputCount: 3 } },
  AND4: { type: 'AND4', data: { label: 'AND4', value: false, inputCount: 4 } },
  OR4: { type: 'OR4', data: { label: 'OR4', value: false, inputCount: 4 } },
  NAND4: { type: 'NAND4', data: { label: 'NAND4', value: false, inputCount: 4 } },
  NOR4: { type: 'NOR4', data: { label: 'NOR4', value: false, inputCount: 4 } },
  XOR4: { type: 'XOR4', data: { label: 'XOR4', value: false, inputCount: 4 } },
  XNOR4: { type: 'XNOR4', data: { label: 'XNOR4', value: false, inputCount: 4 } },
  MUX2: { type: 'MUX2', data: { label: 'MUX2', value: false, inputCount: 3 } },
  MUX4: { type: 'MUX4', data: { label: 'MUX4', value: false, inputCount: 6 } },
  AOI21: { type: 'AOI21', data: { label: 'AOI21', value: false, inputCount: 3 } },
  OAI21: { type: 'OAI21', data: { label: 'OAI21', value: false, inputCount: 3 } },
  MAJ3: { type: 'MAJ3', data: { label: 'MAJ3', value: false, inputCount: 3 } },
  MUX8: { type: 'MUX8', data: { label: 'MUX8', value: false, inputCount: 10 } },
  AOI22: { type: 'AOI22', data: { label: 'AOI22', value: false, inputCount: 5 } },
  OAI22: { type: 'OAI22', data: { label: 'OAI22', value: false, inputCount: 5 } },
  AOI31: { type: 'AOI31', data: { label: 'AOI31', value: false, inputCount: 4 } },
  OAI31: { type: 'OAI31', data: { label: 'OAI31', value: false, inputCount: 4 } },
  AOI33: { type: 'AOI33', data: { label: 'AOI33', value: false, inputCount: 6 } },
  OAI33: { type: 'OAI33', data: { label: 'OAI33', value: false, inputCount: 6 } },
  AOI32: { type: 'AOI32', data: { label: 'AOI32', value: false, inputCount: 5 } },
  OAI32: { type: 'OAI32', data: { label: 'OAI32', value: false, inputCount: 5 } },
  AND5: { type: 'AND5', data: { label: 'AND5', value: false, inputCount: 5 } },
  OR5: { type: 'OR5', data: { label: 'OR5', value: false, inputCount: 5 } },
  NAND5: { type: 'NAND5', data: { label: 'NAND5', value: false, inputCount: 5 } },
  NOR5: { type: 'NOR5', data: { label: 'NOR5', value: false, inputCount: 5 } },
  XOR5: { type: 'XOR5', data: { label: 'XOR5', value: false, inputCount: 5 } },
  XNOR5: { type: 'XNOR5', data: { label: 'XNOR5', value: false, inputCount: 5 } },
  EQ2: { type: 'EQ2', data: { label: 'EQ2', value: false, inputCount: 2 } },
  EQ3: { type: 'EQ3', data: { label: 'EQ3', value: false, inputCount: 3 } },
  MAJ4: { type: 'MAJ4', data: { label: 'MAJ4', value: false, inputCount: 4 } },
  MAJ5: { type: 'MAJ5', data: { label: 'MAJ5', value: false, inputCount: 5 } },
};

function EditorInner() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { screenToFlowPosition } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [circuitName, setCircuitName] = useState('Untitled Circuit');
  const [circuitId, setCircuitId] = useState(id || null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);

  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { edgesRef.current = edges; }, [edges]);

  const showMessage = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Toggle an INPUT node's value (wired into each node via data.onToggle).
  const toggleInput = useCallback(
    (nodeId, value) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, value } } : n
        )
      );
    },
    [setNodes]
  );

  // Ensure every node carries its own id + toggle handler in `data` so the
  // custom node component can render switches and report input changes.
  const decorateNode = useCallback(
    (node) => ({
      ...node,
      data: { ...node.data, id: node.id, onToggle: toggleInput },
    }),
    [toggleInput]
  );

  const loadCircuit = useCallback(async (circuitId) => {
    try {
      const { data } = await circuitAPI.getOne(circuitId);
      const { circuit } = data;
      setCircuitName(circuit.name);
      setNodes(
        (circuit.nodes || []).map((n) =>
          decorateNode({
            id: n.id,
            type: 'logicGate',
            position: n.position,
            data: { ...(n.data || {}), type: n.type },
          })
        )
      );
      setEdges(
        (circuit.edges || []).map((e) => ({
          ...e,
          markerEnd: { type: MarkerType.ArrowClosed, color: '#555' },
          style: { strokeWidth: 2 },
        }))
      );
    } catch (err) {
      console.error(err);
      showMessage('Failed to load circuit', 'error');
    }
  }, [setNodes, setEdges, decorateNode]);

  useEffect(() => {
    if (circuitId) {
      loadCircuit(circuitId);
    }
  }, [circuitId, loadCircuit]);

  const onConnect = useCallback((params) => {
    setEdges((eds) => addEdge({ ...params, markerEnd: { type: MarkerType.ArrowClosed, color: '#555' }, style: { strokeWidth: 2 } }, eds));
  }, [setEdges]);

  const addGate = useCallback((gateType) => {
    const template = GATE_TEMPLATES[gateType];
    const position = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });
    const id = uuidv4();
    const newNode = decorateNode({
      id,
      type: 'logicGate',
      position,
      data: { ...template.data, type: template.type },
    });
    setNodes((nds) => [...nds, newNode]);
  }, [screenToFlowPosition, setNodes, decorateNode]);

  const toggleSimulation = () => {
    setIsSimulating((prev) => !prev);
  };

  useEffect(() => {
    // When simulation stops, reset every non-input gate/output back to LOW so
    // the canvas reflects an idle circuit.
    if (!isSimulating) {
      setNodes((nds) =>
        nds.map((node) =>
          node.data?.type === 'INPUT'
            ? node
            : { ...node, data: { ...node.data, value: false } }
        )
      );
      return undefined;
    }

    const runOnce = () => {
      const currentNodes = nodesRef.current;
      const currentEdges = edgesRef.current;
      const result = simulateCircuit(
        currentNodes.map((n) => ({
          id: n.id,
          type: n.data.type,
          data: n.data,
        })),
        currentEdges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle,
          targetHandle: e.targetHandle,
        }))
      );

      const valueById = result.values;
      setNodes((nds) =>
        nds.map((node) => {
          const value = valueById[node.id];
          if (value === undefined || value === node.data.value) return node;
          return { ...node, data: { ...node.data, value } };
        })
      );
    };

    runOnce(); // evaluate immediately for instant feedback
    const interval = setInterval(runOnce, 120);
    return () => clearInterval(interval);
  }, [isSimulating, setNodes]);

  const handleSave = async () => {
    const serializeNodes = () =>
      nodes.map((n) => ({
        id: n.id,
        type: n.data?.type,
        position: n.position,
        data: n.data,
      }));
    const serializeEdges = () =>
      edges.map((e) => ({
        id: e.id,
        source: e.source,
        sourceHandle: e.sourceHandle,
        target: e.target,
        targetHandle: e.targetHandle,
      }));

    // Guard: never send nodes without a valid gate type (schema requires it).
    const invalid = nodes.find((n) => !n.data?.type);
    if (invalid) {
      showMessage('Cannot save: a gate is missing its type. Try re-adding it.', 'error');
      return;
    }

    if (!circuitId) {
      try {
        const { data } = await circuitAPI.create({
          name: circuitName,
          nodes: serializeNodes(),
          edges: serializeEdges(),
        });
        setCircuitId(data.circuit._id);
        navigate(`/editor/${data.circuit._id}`, { replace: true });
        showMessage('Circuit created successfully');
      } catch (err) {
        showMessage('Failed to create circuit', 'error');
      }
      return;
    }

    try {
      await circuitAPI.update(circuitId, {
        name: circuitName,
        nodes: serializeNodes(),
        edges: serializeEdges(),
      });
      showMessage('Circuit saved successfully');
    } catch (err) {
      showMessage('Failed to save circuit', 'error');
    }
  };

  const handleDeleteSelected = () => {
    setNodes((nds) => nds.filter((n) => !n.selected));
    setEdges((eds) => eds.filter((e) => !e.selected));
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        handleDeleteSelected();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setNodes, setEdges, handleSave, handleDeleteSelected]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <Toolbar
        circuitName={circuitName}
        setCircuitName={setCircuitName}
        onSave={handleSave}
        onAddGate={addGate}
        onToggleSimulation={toggleSimulation}
        isSimulating={isSimulating}
        onDeleteSelected={handleDeleteSelected}
      />
      <Box sx={{ flex: 1, position: 'relative' }}>
        <Fade in={isSimulating}>
          <Chip
            icon={<SensorsRoundedIcon />}
            label="Simulation running"
            color="success"
            sx={{
              position: 'absolute',
              top: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 6,
              fontWeight: 700,
              boxShadow: 3,
              '& .MuiChip-icon': {
                animation: 'lgs-pop-in 1s ease-in-out infinite alternate',
              },
            }}
          />
        </Fade>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          snapToGrid
          snapGrid={[15, 15]}
          proOptions={{ hideAttribution: false }}
          defaultEdgeOptions={{
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed, color: isDark ? '#94a3b8' : '#64748b' },
            style: { strokeWidth: 2, stroke: isDark ? '#64748b' : '#94a3b8' },
          }}
        >
          <Background
            gap={16}
            size={isDark ? 1.4 : 1}
            color={isDark ? '#1e293b' : '#e2e8f0'}
          />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              const type = node.data?.type;
              if (type === 'INPUT') return '#16a34a';
              if (type === 'OUTPUT') return '#ef4444';
            if (['AND', 'NAND', 'AND3', 'NAND3', 'AND4', 'NAND4'].includes(type)) return '#2563eb';
            if (['OR', 'NOR', 'XOR', 'XNOR', 'OR3', 'NOR3', 'XOR3', 'XNOR3', 'OR4', 'NOR4', 'XOR4', 'XNOR4', 'OR5', 'NOR5', 'XOR5', 'XNOR5'].includes(type)) return '#9333ea';
            if (['MUX2', 'MUX4', 'MUX8'].includes(type)) return '#0ea5e9';
            if (['AOI21', 'OAI21', 'AOI22', 'OAI22', 'AOI31', 'OAI31', 'AOI33', 'OAI33', 'AOI32', 'OAI32'].includes(type)) return '#d946ef';
            if (['MAJ3', 'MAJ4', 'MAJ5', 'EQ2', 'EQ3'].includes(type)) return '#14b8a6';
              return '#64748b';
            }}
            maskColor={isDark ? 'rgba(2, 6, 23, 0.6)' : 'rgba(15, 23, 42, 0.08)'}
            style={{ backgroundColor: isDark ? '#111827' : '#f8fafc' }}
          />
        </ReactFlow>
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
          label={
            isSimulating ? 'Simulation running' : 'Idle'
          }
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
          label="Unsaved changes auto-tracked"
          variant="outlined"
          sx={{ fontWeight: 600, height: 24, display: { xs: 'none', md: 'inline-flex' } }}
        />
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar({ ...snackbar, open: false })}>
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
