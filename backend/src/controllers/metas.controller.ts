import { Request, Response, NextFunction } from "express";
import * as s from "../services/metas.service";

export const crear = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.status(201).json(await s.crearMeta(req.body));
  } catch (error) {
    next(error);
  }
};
export const obtener = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.json(await s.obtenerMeta(req.params.id));
  } catch (error) {
    next(error);
  }
};
export const obtenerActiva = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.json(await s.obtenerMetaActiva(req.params.id));
  } catch (error) {
    next(error);
  }
};
export const actualizar = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.json(await s.actualizarMeta(req.params.id, req.body));
  } catch (error) {
    next(error);
  }
};
export const desactivar = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await s.desactivarMeta(req.params.id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};
