import { Router } from "express";
import * as c from "../controllers/metas.controller";

export const metasRouter = Router();
metasRouter.post("/", c.crear);
metasRouter.get("/:id", c.obtener);
metasRouter.put("/:id", c.actualizar);
metasRouter.delete("/:id", c.desactivar);
