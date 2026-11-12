import { Request, Response, NextFunction } from "express";
import { obtenerProgreso } from "../services/progreso.service";

export const obtener = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const instante: Date = req.app.locals.reloj();
    res.json(await obtenerProgreso(req.params.id, instante));
  } catch (error) {
    next(error);
  }
};
