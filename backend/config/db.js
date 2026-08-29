const mongoose = require('mongoose');

/**
 * Cache the connection *promise*, not just a boolean — several requests can
 * arrive before the first connect resolves, and each would otherwise open its
 * own connection. On failure the cache is cleared so the next request retries.
 */
let connectPromise = null;

const connectDB = async () => {
  // 1 = connected, 2 = connecting
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (connectPromise) return connectPromise;

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not set — check backend/.env');
  }

  connectPromise = mongoose
    .connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
    })
    .then((conn) => {
      console.log('MongoDB connected');
      return conn;
    })
    .catch((error) => {
      console.error('MongoDB connection failed:', error.message);
      connectPromise = null; // allow a retry on the next request
      throw error;
    });

  return connectPromise;
};

module.exports = connectDB;
