
import { conectarDB } from "./conexionDB";
import { crearApp } from "./app";
import { env } from "./config/env";

async function main(): Promise<void> {
  await conectarDB();

  const app = crearApp();

  app.listen(env.puerto, () => {
    console.log(`API del Diario de Progreso Gamer escuchando en http://localhost:${env.puerto}`);
    console.log(`Videojuegos: http://localhost:${env.puerto}/api/videojuegos`);
    console.log(`Partidas: http://localhost:${env.puerto}/api/partidas`);
    console.log(`Prueba: curl http://localhost:${env.puerto}/api/videojuegos`);
  });
}

main().catch((error) => {
  console.error("No se pudo iniciar la API:", error);
  process.exit(1);
});
