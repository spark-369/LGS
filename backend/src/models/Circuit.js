import mongoose from 'mongoose';
import {
  GATE_TYPES,
  MAX_NODES_PER_CIRCUIT,
  MAX_EDGES_PER_CIRCUIT,
} from '../constants/gates.js';

const nodeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: { type: String, required: true, enum: GATE_TYPES },
    position: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
    },
    data: {
      label: { type: String, default: '', maxlength: 60 },
      value: { type: Boolean, default: false },
      inputCount: { type: Number, default: 2, min: 0, max: 16 },
    },
  },
  { _id: false }
);

const edgeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    source: { type: String, required: true },
    sourceHandle: { type: String, required: true, default: 'output-0' },
    target: { type: String, required: true },
    targetHandle: { type: String, required: true, default: 'input-0' },
  },
  { _id: false }
);

const circuitSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Circuit name is required'],
      trim: true,
      maxlength: [100, 'Circuit name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    nodes: {
      type: [nodeSchema],
      default: [],
      validate: {
        validator: (v) => v.length <= MAX_NODES_PER_CIRCUIT,
        message: `A circuit cannot exceed ${MAX_NODES_PER_CIRCUIT} gates`,
      },
    },
    edges: {
      type: [edgeSchema],
      default: [],
      validate: {
        validator: (v) => v.length <= MAX_EDGES_PER_CIRCUIT,
        message: `A circuit cannot exceed ${MAX_EDGES_PER_CIRCUIT} wires`,
      },
    },
    isPublic: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

circuitSchema.index({ owner: 1, createdAt: -1 });
circuitSchema.index({ isPublic: 1, createdAt: -1 });
circuitSchema.index({ name: 'text', description: 'text' });

circuitSchema.virtual('gateCount').get(function gateCount() {
  return this.nodes?.length || 0;
});

circuitSchema.virtual('wireCount').get(function wireCount() {
  return this.edges?.length || 0;
});

export const Circuit = mongoose.model('Circuit', circuitSchema);
