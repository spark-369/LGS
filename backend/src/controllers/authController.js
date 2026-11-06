import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ApiError } from '../middleware/errorHandler.js';

/** Sign a short-lived access token for a user id. */
const generateToken = (id) =>
  jwt.sign({ id: String(id) }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });

/** Public projection of a user — identical everywhere so clients can rely on it. */
const publicUser = (user) => ({
  id: String(user._id),
  _id: String(user._id),
  email: user.email,
  name: user.name,
  createdAt: user.createdAt,
});

export const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    const existing = await User.findOne({ email });
    if (existing) throw new ApiError(409, 'Email already registered');

    const user = await User.create({ email, password, name });
    const token = generateToken(user._id);

    res.status(201).json({ token, user: publicUser(user) });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    // Same message for "no such user" and "wrong password" so the endpoint
    // cannot be used to enumerate registered emails.
    if (!user || !(await user.comparePassword(password))) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const token = generateToken(user._id);
    res.json({ token, user: publicUser(user) });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res) => {
  res.json({ user: publicUser(req.user) });
};

export const refreshToken = async (req, res) => {
  res.json({ token: generateToken(req.user._id), user: publicUser(req.user) });
};
