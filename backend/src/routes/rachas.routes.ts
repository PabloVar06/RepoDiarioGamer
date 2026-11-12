import { Router } from "express";
import { obtener } from "../controllers/rachas.controller";

export const rachasRouter = Router();
rachasRouter.get("/", obtener);
