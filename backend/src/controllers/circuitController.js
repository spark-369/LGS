import { Circuit } from '../models/Circuit.js';

export const createCircuit = async (req, res, next) => {
  try {
    const circuit = await Circuit.create({
      ...req.body,
      owner: req.user._id,
      nodes: req.body.nodes || [],
      edges: req.body.edges || [],
    });

    res.status(201).json({ circuit });
  } catch (error) {
    next(error);
  }
};

export const getCircuits = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { search, isPublic } = req.query;

    const filter = { owner: req.user._id };
    if (isPublic !== undefined) {
      filter.isPublic = isPublic === 'true';
    }
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const circuits = await Circuit.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Circuit.countDocuments(filter);

    res.json({
      circuits,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPublicCircuits = async (req, res, next) => {
  try {
    const circuits = await Circuit.find({ isPublic: true })
      .populate('owner', 'name')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ circuits });
  } catch (error) {
    next(error);
  }
};

export const getCircuit = async (req, res, next) => {
  try {
    const circuit = await Circuit.findOne({
      _id: req.params.id,
      $or: [{ owner: req.user._id }, { isPublic: true }],
    });

    if (!circuit) {
      return res.status(404).json({ message: 'Circuit not found' });
    }

    res.json({ circuit });
  } catch (error) {
    next(error);
  }
};

export const updateCircuit = async (req, res, next) => {
  try {
    const circuit = await Circuit.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!circuit) {
      return res.status(404).json({ message: 'Circuit not found' });
    }

    res.json({ circuit });
  } catch (error) {
    next(error);
  }
};

export const deleteCircuit = async (req, res, next) => {
  try {
    const circuit = await Circuit.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!circuit) {
      return res.status(404).json({ message: 'Circuit not found' });
    }

    res.json({ message: 'Circuit deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const duplicateCircuit = async (req, res, next) => {
  try {
    const original = await Circuit.findOne({
      _id: req.params.id,
      $or: [{ owner: req.user._id }, { isPublic: true }],
    });

    if (!original) {
      return res.status(404).json({ message: 'Circuit not found' });
    }

    const duplicated = await Circuit.create({
      name: `${original.name} (Copy)`,
      description: original.description,
      owner: req.user._id,
      nodes: original.nodes,
      edges: original.edges,
      isPublic: false,
    });

    res.status(201).json({ circuit: duplicated });
  } catch (error) {
    next(error);
  }
};

export const togglePublic = async (req, res, next) => {
  try {
    const circuit = await Circuit.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!circuit) {
      return res.status(404).json({ message: 'Circuit not found' });
    }

    circuit.isPublic = !circuit.isPublic;
    await circuit.save();

    res.json({ circuit });
  } catch (error) {
    next(error);
  }
};
