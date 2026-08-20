import mongoose from 'mongoose';
import dotenv from 'dotenv';


dotenv.config({
  path: './.env'
});

const connectDB = async () => {
  try {
    console.log(process.env.MONGO_URI);
    const ConnectionInstance = await mongoose.connect(`${process.env.MONGO_URI}`);
    console.log(`mongoDB connected: ${ConnectionInstance.connection.host}`);
  } catch (error){
    console.log("Error while connecting to MongoDB: ", error);
    process.exit(1);
  }
}

export default connectDB;