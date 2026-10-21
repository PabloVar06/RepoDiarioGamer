# Diario de Progreso Gamer

Aplicación full-stack para registrar videojuegos, sesiones de juego, logros embebidos y un resumen calculado de progreso.

## Modelo y decisiones

- **Videojuego**: `nombre` obligatorio; `plataforma` y `genero` con `enum`; `estado` con `enum`; `logros` como subdocumentos `{ nombre, descripcion, obtenido }`; timestamps automáticos.
- **Partida**: `videojuego` es `ObjectId` con `ref: "Videojuego"`; `fecha`, `duracionMinutos` (1–1440) y `porcentajeAvance` (0–100) validados; `notas` opcional.
- **Embebido**: los logros son una lista pequeña y propia del juego, y se muestran junto con su ficha. No necesitan consultarse como entidad independiente.
- **Referenciado**: las partidas pueden crecer indefinidamente y deben consultarse también como historial independiente; por eso viven en otra colección.

### Fórmula del resumen

`GET /api/videojuegos/:id/resumen` consulta las partidas del videojuego ordenadas por `fecha` descendente. `totalPartidas = cantidad de partidas`; `horasTotales = suma(duracionMinutos) / 60` (redondeado a dos decimales); `ultimaPartida = fecha de la primera partida ordenada` o `null`; `porcentajeAvanceActual = porcentajeAvance de esa partida` o `0` si no existen partidas. El resumen se calcula en el servicio, no en el controlador ni en el cliente.

## Ejecutar localmente

Requisitos: Node.js 20+, MongoDB Atlas.

1. En `backend`, copia `.env.example` a `.env` y completa `MONGODB_URI` con tu propia cadena de Atlas. No subas `.env` al repositorio.
2. `cd backend && npm install && npm run dev` (API en puerto 3000).
3. En otra terminal: `cd frontend`, copia `.env.example` a `.env`, ejecuta `npm install && npm run dev` (Vite en puerto 5173).
4. Comprueba `http://localhost:3000/api/salud`.

## API REST

- `GET /api/videojuegos?filtro=zelda`, `GET /api/videojuegos/:id`, `POST /api/videojuegos`, `PUT /api/videojuegos/:id`, `DELETE /api/videojuegos/:id`
- `PATCH /api/videojuegos/:id/logros/:logroId` con `{ "obtenido": true }`
- `GET /api/videojuegos/:id/partidas`, `GET /api/videojuegos/:id/resumen`
- `GET /api/partidas` (incluye `populate("videojuego")`), `POST /api/partidas`, `DELETE /api/partidas/:id`

Errores: validación de esquema 400; ObjectId mal formado 400; recurso o referencia inexistente 404; error inesperado 500. Todos incluyen `requestId`. Se registran requests con los middlewares `requestId` y `logger`.

### Ejemplos de payload

Crear videojuego:
```json
{"nombre":"Hades","plataforma":"PC","genero":"acción","estado":"jugando","logros":[{"nombre":"Primera victoria","descripcion":"Vence al jefe final","obtenido":false}]}
```
Crear partida (usa un `_id` real de videojuego):
```json
{"videojuego":"ID_DEL_VIDEOJUEGO","fecha":"2026-10-02T18:00:00.000Z","duracionMinutos":90,"porcentajeAvance":35,"notas":"Primera sesión"}
```

## Despliegue en Render

### Backend — Web Service
- Root Directory: `backend`
- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- Variables: `MONGODB_URI` (Atlas), `MONGODB_DB=diario_gamer`, `FRONTEND_URL=https://TU-FRONTEND.onrender.com`. `PORT` lo proporciona Render.

### Frontend — Static Site
- Root Directory: `frontend`
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`
- Variable de build: `VITE_API_URL=https://TU-BACKEND.onrender.com/api`
- El archivo `public/_redirects` permite el fallback SPA para React Router.

Tras publicar, reemplaza las URLs de ejemplo por las URLs públicas reales. No hay URLs de producción inventadas ni secretos incluidos en este repositorio.
