
import mongoose from "mongoose";
import dotenv from 'dotenv';
dotenv.config({ path: './env' })

const mongoConnection = async () => {
    await mongoose.connect(process.env.MONGODB_URL)
}

export default mongoConnection;