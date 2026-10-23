import { Router } from "express"; 
import * as c from "../controllers/videojuegos.controller";

export const videojuegosRouter = Router();

videojuegosRouter.get("/", c.listar); 
videojuegosRouter.post("/", c.crear); 
videojuegosRouter.get("/:id/partidas", c.partidas); 
videojuegosRouter.get("/:id/resumen", c.resumen); 
videojuegosRouter.patch("/:id/logros/:logroId", c.logro); 
videojuegosRouter.get("/:id", c.obtener); 
videojuegosRouter.put("/:id", c.actualizar); 
videojuegosRouter.delete("/:id", c.eliminar);
