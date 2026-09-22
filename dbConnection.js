import mongoose from "mongoose";

let isConnecting = false;

const mongoConnection = async () => {
  if (mongoose.connection.readyState === 1 || isConnecting) {
    return;
  }
  if (!process.env.MONGODB_URL) {
    return;
  }
  isConnecting = true;
  try {
    await mongoose.connect(process.env.MONGODB_URL, {
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 2000,
      bufferCommands: false,
    });
  } catch (err) {
    console.warn('MongoDB connection unavailable:', err.message);
  } finally {
    isConnecting = false;
  }
};

export default mongoConnection;