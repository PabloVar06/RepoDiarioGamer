import { Request, Response, NextFunction } from "express";
import * as s from "../services/partidas.service";
export const listar = async (_: Request,res: Response,next: NextFunction) => { try { res.json(await s.listarPartidas()); } catch(e) { next(e); } };
export const crear = async (req: Request,res: Response,next: NextFunction) => { try { res.status(201).json(await s.crearPartida(req.body)); } catch(e) { next(e); } };
export const eliminar = async (req: Request,res: Response,next: NextFunction) => { try { await s.eliminarPartida(req.params.id); res.status(204).end(); } catch(e) { next(e); } };
