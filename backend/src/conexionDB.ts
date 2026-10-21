/**
 * conexionDB.ts
 * ---------------
 * Solo conecta, usando lo que config/env.ts ya validó. Si la conexión
 * falla, terminamos el proceso con un mensaje claro.
 */

import mongoose from "mongoose";
import { env } from "./config/env";

export async function conectarDB(): Promise<void> {
  try {
    await mongoose.connect(env.mongodbUri, { dbName: env.mongodbDb });
    console.log(`Conectado a MongoDB Atlas (base: ${env.mongodbDb})`);
  } catch (error) {
    console.error("No se pudo conectar a MongoDB:", (error as Error).message);
    process.exit(1);
  }
}

export async function cerrarConexionDB(): Promise<void> {
  await mongoose.connection.close();
  console.log("Conexión a MongoDB cerrada");
}
