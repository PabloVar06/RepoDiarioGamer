import { Request, Response, NextFunction } from "express";
import { obtenerRachas } from "../services/rachas.service";

export async function obtener(req: Request, res: Response, next: NextFunction) {
  try {
    const instante: Date = req.app.locals.reloj();
    res.json(await obtenerRachas(instante));
  } catch (error) {
    next(error);
  }
}
