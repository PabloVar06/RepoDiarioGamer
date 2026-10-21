import express, { Express, Request, Response } from "express"; 
import cors from "cors"; 
import { requestId } from "./middlewares/requestId"; 
import { logger } from "./middlewares/logger"; 
import { errorHandler } from "./middlewares/errorHandler"; 
import { videojuegosRouter } from "./routes/videojuegos.routes"; 
import { partidasRouter } from "./routes/partidas.routes"; 
import { ApiError } from "./apiError"; 
import { env } from "./config/env";

export function crearApp(): Express { const app = express(); 
    
app.use(cors({ origin: [env.frontendUrl, "http://localhost:5173"], credentials: false })); 
app.use(express.json()); app.use(requestId); 
app.use(logger); 
app.get("/api/salud", (req: Request,res: Response) => res.json({ estado: "ok", requestId: req.id })); 
app.use("/api/videojuegos", videojuegosRouter); 
app.use("/api/partidas", partidasRouter); 
app.use((req,res,next) => next(new ApiError(404, `Ruta no encontrada: ${req.method} ${req.originalUrl}`))); 
app.use(errorHandler); return app; }
