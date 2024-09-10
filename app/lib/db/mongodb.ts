// app/lib/db/mongodb.ts

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Por favor, define la variable de entorno MONGODB_URI");
}

export const connectDB = async () => {
  try {
    const { connection } = await mongoose.connect(MONGODB_URI as string);
    if (connection.readyState === 1) {
      return Promise.resolve(true);
    }
    return Promise.reject("Fallo al conectar a MongoDB");
  } catch (error) {
    console.error("Error al conectar a MongoDB:", error);
    return Promise.reject(error);
  }
};