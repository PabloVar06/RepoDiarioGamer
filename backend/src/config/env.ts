import "dotenv/config";
interface Env { mongodbUri: string; mongodbDb: string; puerto: number; frontendUrl: string; }
function leerEnv(): Env {
  const mongodbUri = process.env.MONGODB_URI;
  if (!mongodbUri) throw new Error("Falta MONGODB_URI en las variables de entorno");
  const puerto = Number(process.env.PORT ?? 3000);
  if (!Number.isInteger(puerto) || puerto < 1 || puerto > 65535) throw new Error("PORT inválido");
  return { mongodbUri, mongodbDb: process.env.MONGODB_DB ?? "diario_gamer", puerto, frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173" };
}
export const env = leerEnv();
