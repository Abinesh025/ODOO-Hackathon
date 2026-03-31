import mongoose from 'mongoose';

/**
 * Atlas / Windows: `family: 4` avoids some IPv6 SRV resolution failures.
 * `serverSelectionTimeoutMS` gives enough time on slow networks.
 */
export async function connectDb(uri) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 30_000,
    socketTimeoutMS: 45_000,
    family: 4,
  });
  if (process.env.NODE_ENV === 'production') {
    console.log('MongoDB connected');
  }
}
