import mongoose from 'mongoose';

/**
 * Establish the single Mongoose connection used by the process.
 * Resolves once connected; rejects on failure so the caller can decide
 * whether to abort startup.
 */
const connectDB = async (uri = process.env.MONGODB_URI) => {
  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  mongoose.set('strictQuery', true);

  const conn = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10_000,
    maxPoolSize: 10,
  });

  console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
  });
  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err.message);
  });

  return conn;
};

export default connectDB;
