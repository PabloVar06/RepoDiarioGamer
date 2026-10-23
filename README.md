# Diario de Progreso Gamer

Aplicación full-stack para organizar videojuegos, registrar sesiones de juego, marcar logros y consultar un resumen calculado del progreso: **¿qué estoy jugando, cuánto tiempo le he dedicado y qué tan avanzado voy?**

## Tecnologías y estructura

- **Backend:** Node.js, Express, TypeScript, Mongoose y MongoDB Atlas. Arquitectura por capas: `routes → controllers → services → modelos`.
- **Frontend:** React, TypeScript, Vite, React Router, Tailwind CSS y GSAP.
- **Despliegue previsto:** backend como *Web Service* y frontend como *Static Site* en Render.
- **Comunicación:** servicios `frontend/src/api/videojuegosApi.ts` y `partidasApi.ts`, configurados mediante `VITE_API_URL`.

```text
.
├── backend/
│   ├── src/
│   │   ├── config/env.ts
│   │   ├── modelos/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middlewares/
│   │   ├── conexionDB.ts
│   │   ├── apiError.ts
│   │   ├── app.ts
│   │   └── index.ts
│   └── package.json
├── frontend/
│   ├── public/_redirects
│   ├── src/
│   │   ├── api/
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── main.tsx
│   │   └── tipos.ts
│   └── package.json
└── README.md
```

## Modelo de datos

### Videojuego

| Campo | Tipo / validación |
|---|---|
| `nombre` | String obligatorio, máximo 120 caracteres |
| `plataforma` | Enum: `PC`, `PlayStation`, `Xbox`, `Switch`, `Movil` |
| `genero` | Enum: `Accion`, `Rol`, `Estrategia`, `Puzzle`, `Deportes`, `Terror`, `Otro` |
| `estado` | Enum: `Jugando`, `Pausado`, `Completado`, `Abandonado`; predeterminado `Jugando` |
| `logros` | Arreglo de subdocumentos `{ _id, nombre, obtenido }`; `nombre` obligatorio y `obtenido` booleano predeterminado `false` |
| `createdAt`, `updatedAt` | Timestamps automáticos |

**Los enums distinguen mayúsculas de minúsculas.** Usar, por ejemplo, `"Accion"` y `"Completado"`, no `"accion"` ni `"completado"`. Si existen registros antiguos con minúsculas en MongoDB Atlas, deben normalizarse; cambiar el código no modifica los documentos existentes.

### Partida

| Campo | Tipo / validación |
|---|---|
| `videojuego` | ObjectId obligatorio, `ref: "Videojuego"` |
| `fecha` | Date obligatorio; el modelo normaliza el día a medianoche UTC |
| `duracionMinutos` | Number obligatorio, entre 1 y 1440 |
| `porcentajeAvance` | Number obligatorio, entre 0 y 100 |
| `notas` | String opcional, máximo 1000 caracteres |
| `createdAt`, `updatedAt` | Timestamps automáticos |

Los **logros están embebidos** porque pertenecen al juego y se consultan junto a su ficha. Las **partidas están referenciadas** porque su historial puede crecer indefinidamente y consultarse por separado.

## Resumen calculado

`GET /api/videojuegos/:id/resumen` se implementa en `backend/src/services/videojuegos.service.ts`:

| Campo | Regla |
|---|---|
| `totalPartidas` | Cantidad de sesiones del videojuego |
| `horasTotales` | Suma de `duracionMinutos` / 60, redondeada a dos decimales |
| `ultimaPartida` | Fecha de la sesión más reciente o `null` si no hay partidas |
| `porcentajeAvanceActual` | **Mayor `porcentajeAvance` de todas las sesiones**, o `0` si no hay partidas |

El porcentaje mostrado **no disminuye** si una sesión posterior registra menos avance. Cada partida conserva su porcentaje original. Al eliminar una sesión, el resumen se recalcula con las sesiones restantes.

Ejemplo: tres sesiones de 60, 90 y 30 minutos con avances 80%, 30% y 70% producen `totalPartidas: 3`, `horasTotales: 3` y `porcentajeAvanceActual: 80`.

## API REST

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/videojuegos?filtro=texto` | Listar y filtrar por nombre |
| GET | `/api/videojuegos/:id` | Obtener detalle |
| POST | `/api/videojuegos` | Crear videojuego |
| PUT | `/api/videojuegos/:id` | Actualizar videojuego |
| DELETE | `/api/videojuegos/:id` | Eliminar videojuego y sus partidas |
| PATCH | `/api/videojuegos/:id/logros/:logroId` | Marcar o desmarcar un logro |
| GET | `/api/videojuegos/:id/partidas` | Historial de un videojuego |
| GET | `/api/videojuegos/:id/resumen` | Resumen calculado |
| GET | `/api/partidas` | Listar partidas con `populate("videojuego")` |
| POST | `/api/partidas` | Crear sesión validando la referencia |
| DELETE | `/api/partidas/:id` | Eliminar una sesión |
| GET | `/api/salud` | Verificar disponibilidad |

### Ejemplos

Crear videojuego (`POST /api/videojuegos`):

```json
{
  "nombre": "Resident Evil 4",
  "plataforma": "PlayStation",
  "genero": "Terror",
  "estado": "Jugando",
  "logros": [{ "nombre": "Primera victoria", "obtenido": false }]
}
```

Crear partida (`POST /api/partidas`; reemplazar el ID):

```json
{
  "videojuego": "ID_REAL_DEL_VIDEOJUEGO",
  "fecha": "2026-10-20",
  "duracionMinutos": 90,
  "porcentajeAvance": 80,
  "notas": "Sesión de prueba"
}
```

Actualizar logro (`PATCH /api/videojuegos/:id/logros/:logroId`):

```json
{ "obtenido": false }
```

## Errores y observabilidad

El backend utiliza los middlewares `requestId`, `logger` y `errorHandler` para registrar solicitudes y responder de forma centralizada. Los errores incluyen `requestId`.

| HTTP | Caso |
|---|---|
| `400` | Validación de esquema o ID mal formado |
| `404` | Recurso, logro o referencia inexistente |
| `500` | Error inesperado |

## Ejecutar localmente

Requisitos: Node.js 20+ y acceso a MongoDB Atlas.

1. En `backend/`, crear `.env` (a partir de `.env.example` si existe):

   ```env
   MONGODB_URI=TU_CADENA_PRIVADA_DE_ATLAS
   MONGODB_DB=diario_gamer
   PORT=3000
   FRONTEND_URL=http://localhost:5173
   ```

2. Iniciar backend:

   ```bash
   cd backend
   npm install
   npm run dev
   ```

3. En `frontend/`, crear `.env`:

   ```env
   VITE_API_URL=http://localhost:3000/api
   ```

4. Iniciar frontend en otra terminal:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. Abrir `http://localhost:5173` y comprobar `http://localhost:3000/api/salud`.

Para compilar: `npm run build` en cada carpeta. Para iniciar el backend compilado: `npm start` en `backend/`.

**Seguridad:** no subir `.env`, contraseñas, cadenas de conexión ni `node_modules` a GitHub. `VITE_` expone valores al navegador: no colocar secretos en variables del frontend.

## Funcionalidades del frontend

- Biblioteca de videojuegos y filtro por nombre.
- Creación y edición de videojuegos.
- Detalle del juego con estado, logros embebidos, historial y resumen calculado.
- Registro de partidas y consulta del historial general.
- Eliminación de partidas desde la interfaz, con confirmación previa.
- Diseño oscuro tipo *gaming launcher* con Tailwind CSS y animaciones GSAP.

### Nota sobre fechas (pendiente de verificar en la versión actual)

El **modelo del backend** almacena el día de la sesión normalizado a medianoche UTC. Sin embargo, el `App.tsx` inspeccionado todavía contiene un campo `datetime-local` (fecha **y hora**) y muestra fechas mediante `toLocaleDateString()` sin fijar la zona horaria. En zonas como Ecuador esto puede visualizar el **día anterior**. Para cumplir el requisito de elegir solo día, mes y año, queda pendiente sincronizar el formulario a `type="date"`, enviar `YYYY-MM-DD` y mostrar las fechas usando `timeZone: "UTC"`. No se declara este ajuste como implementado hasta comprobarlo en el frontend.

## Pruebas manuales sugeridas

1. Crear un juego con `genero: "Terror"`, `estado: "Jugando"` y varios logros.
2. Registrar partidas con avances 80%, 30% y 70%; verificar que el resumen mantenga 80%.
3. Eliminar una partida duplicada; verificar que se actualicen el historial, la cantidad de sesiones, las horas y el máximo si corresponde.
4. Marcar y desmarcar un logro (`true` ↔ `false`).
5. Verificar validaciones: nombre vacío (400), ID mal formado (400), videojuego inexistente al crear partida (404).
6. Verificar que sin partidas el resumen sea `{ "totalPartidas": 0, "horasTotales": 0, "ultimaPartida": null, "porcentajeAvanceActual": 0 }`.
7. Verificar fechas seleccionadas y visualizadas sin desfase de día tras corregir el formulario.

Estas son pruebas recomendadas, **no una certificación de que se ejecutaron**.

## Despliegue en Render

**Backend — Web Service**

- Root Directory: `backend`
- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- Variables: `MONGODB_URI`, `MONGODB_DB`, `FRONTEND_URL`. Configurar CORS para el dominio público del frontend.

**Frontend — Static Site**

- Root Directory: `frontend`
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`
- Variable de build: `VITE_API_URL=https://savepoint-diariogamer.onrender.com`
- Para React Router, `public/_redirects` debe contener `/* /index.html 200`.

**Estado:** configuración de despliegue documentada; no se han verificado URLs públicas de producción. Agregarlas cuando estén disponibles.

## 

**Repositorio de Git Hub**
https://github.com/PabloVar06/RepoDiarioGamer

**Enlaces de Render**
- Backend: https://savepoint-diariogamer.onrender.com
- Frontend: https://savepoint-diariogamer-vargas.onrender.com

**Demostración**
https://youtu.be/SGqsmWl59XU
