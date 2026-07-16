import mongoose from 'mongoose';

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
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    nodes: [
      {
        id: { type: String, required: true },
        type: {
          type: String,
          required: true,
          enum: [
            'INPUT',
            'OUTPUT',
            'AND',
            'OR',
            'NOT',
            'NAND',
            'NOR',
            'XOR',
            'XNOR',
            'BUFFER',
            'TRISTATE',
            'AND3',
            'OR3',
            'NOR3',
            'NAND3',
            'XOR3',
            'XNOR3',
            'AND4',
            'OR4',
            'NAND4',
            'NOR4',
            'XOR4',
            'XNOR4',
            'MUX2',
            'MUX4',
            'AOI21',
            'OAI21',
            'MAJ3',
            'MUX8',
            'AOI22',
            'OAI22',
            'AOI31',
            'OAI31',
            'AOI33',
            'OAI33',
            'AOI32',
            'OAI32',
            'AND5',
            'OR5',
            'NAND5',
            'NOR5',
            'XOR5',
            'XNOR5',
            'EQ2',
            'EQ3',
            'MAJ4',
            'MAJ5',
          ],
        },
        position: {
          x: { type: Number, required: true },
          y: { type: Number, required: true },
        },
        data: {
          label: { type: String, default: '' },
          value: { type: Boolean, default: false },
          inputCount: { type: Number, default: 2 },
        },
      },
    ],
    edges: [
      {
        id: { type: String, required: true },
        source: { type: String, required: true },
        sourceHandle: { type: String, required: true },
        target: { type: String, required: true },
        targetHandle: { type: String, required: true },
      },
    ],
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

circuitSchema.index({ owner: 1, createdAt: -1 });
circuitSchema.index({ name: 'text', description: 'text' });

export const Circuit = mongoose.model('Circuit', circuitSchema);
