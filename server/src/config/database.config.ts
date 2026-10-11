import mongoose from 'mongoose';
import { ENV } from './env.config';

export const connectDatabase = async (): Promise<typeof mongoose> => {
  try {
    const conn = await mongoose.connect(ENV.MONGO_URI, {
      autoIndex: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });


    mongoose.connection.on('error', (err) => {
      console.error('[Database] Connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[Database] Disconnected from MongoDB');
    });

    return conn;
  } catch (error) {
    console.error('[Database] Initial connection failed:', error);
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
  } catch (error) {
    console.error('[Database] Error while disconnecting:', error);
  }
};
