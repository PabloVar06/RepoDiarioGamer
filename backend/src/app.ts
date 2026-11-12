import express, { Express, Request, Response } from "express";
import cors from "cors";
import { requestId } from "./middlewares/requestId";
import { logger } from "./middlewares/logger";
import { errorHandler } from "./middlewares/errorHandler";
import { videojuegosRouter } from "./routes/videojuegos.routes";
import { partidasRouter } from "./routes/partidas.routes";
import { metasRouter } from "./routes/metas.routes";
import { ApiError } from "./apiError";
export interface AppConfig {
  frontendUrl: string;
  reloj?: () => Date;
}

export function crearApp(config: AppConfig): Express {
  const app = express();
  app.locals.reloj = config.reloj ?? (() => new Date());

  app.use(
    cors({
      origin: [config.frontendUrl, "http://localhost:5173"],
      credentials: false,
    }),
  );
  app.use(express.json());
  app.use(requestId);
  app.use(logger);
  app.get("/api/salud", (req: Request, res: Response) =>
    res.json({ estado: "ok", requestId: req.id }),
  );
  app.use("/api/videojuegos", videojuegosRouter);
  app.use("/api/partidas", partidasRouter);
  app.use("/api/metas", metasRouter);
  app.use((req, res, next) =>
    next(
      new ApiError(404, `Ruta no encontrada: ${req.method} ${req.originalUrl}`),
    ),
  );
  app.use(errorHandler);
  return app;
}
