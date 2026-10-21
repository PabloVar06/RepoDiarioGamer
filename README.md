Diario de Progreso Gamer
Aplicación web full-stack para registrar videojuegos, sesiones de juego, logros y un resumen calculado del progreso. Permite responder: ¿qué estoy jugando, cuánto tiempo le he dedicado y qué tan avanzado voy?
Tecnologías y arquitectura
- Backend: Node.js, Express, TypeScript, Mongoose y MongoDB Atlas.
- Frontend: React, TypeScript, Vite y React Router.
- Despliegue previsto: backend como Web Service y frontend como Static Site en Render.
- Capas del backend: rutas → controladores → servicios → modelos.
- Servicios del frontend: videojuegosApi.ts y partidasApi.ts, sin llamadas fetch directas desde las páginas.
proyecto/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── modelos/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── routes/
│   │   ├── middlewares/
│   │   ├── conexionDB.ts
│   │   ├── apiError.ts
│   │   ├── app.ts
│   │   └── index.ts
│   └── .env.example
├── frontend/
└── README.md
Modelo de datos
Videojuego
Campo	Descripción
nombre	Texto obligatorio.
plataforma	PC, PlayStation, Xbox, Switch o Movil.
genero	accion, rol, estrategia, puzzle, deportes u otro.
estado	jugando, pausado, completado o abandonado.
logros	Subdocumentos embebidos con nombre, obtenido y, si el esquema lo admite, descripcion.
createdAt, updatedAt	Marcas de tiempo automáticas (timestamps).


Partida
Campo	Descripción
videojuego	ObjectId con ref: "Videojuego".
fecha	Fecha de la sesión.
duracionMinutos	Número de minutos, entre 1 y 1440.
porcentajeAvance	Número entre 0 y 100.
notas	Texto opcional.
createdAt, updatedAt	Marcas de tiempo automáticas (timestamps).


Justificación: los logros se embeben porque son una lista corta propia de cada juego, consultada junto con su ficha. Las partidas se referencian porque su número puede crecer indefinidamente y también deben consultarse de forma independiente.
Resumen de progreso
GET /api/videojuegos/:id/resumen obtiene las partidas del juego y calcula el resumen en la capa de servicio (videojuegos.service.ts), no en el controlador ni en el frontend.
Campo	Cálculo
totalPartidas	Cantidad de partidas registradas.
horasTotales	Suma de duracionMinutos dividida entre 60, redondeada a dos decimales.
ultimaPartida	fecha de la sesión más reciente; null si no hay partidas.
porcentajeAvanceActual	porcentajeAvance de la sesión más reciente; 0 si no hay partidas.


La sesión más reciente se determina ordenando por fecha descendente.
API REST
Método	Ruta	Descripción
GET	/api/videojuegos?filtro=texto	Listar videojuegos; filtro opcional por nombre.
GET	/api/videojuegos/:id	Obtener detalle de un videojuego.
POST	/api/videojuegos	Crear videojuego.
PUT	/api/videojuegos/:id	Actualizar videojuego.
DELETE	/api/videojuegos/:id	Eliminar videojuego y sus partidas.
PATCH	/api/videojuegos/:id/logros/:logroId	Cambiar el valor booleano de obtenido.
GET	/api/videojuegos/:id/partidas	Consultar partidas de un videojuego.
GET	/api/videojuegos/:id/resumen	Obtener resumen calculado.
GET	/api/partidas	Listar partidas con populate("videojuego").
POST	/api/partidas	Crear partida; validar existencia del videojuego.
DELETE	/api/partidas/:id	Eliminar partida.
GET	/api/salud	Comprobar disponibilidad de la API.


Ejemplos de solicitudes
Crear videojuego (POST /api/videojuegos):
{
  "nombre": "Hades",
  "plataforma": "PC",
  "genero": "accion",
  "estado": "jugando",
  "logros": [
    { "nombre": "Primera victoria", "obtenido": false }
  ]
}
Crear partida (POST /api/partidas), reemplazando el ID por el _id real de un videojuego:
{
  "videojuego": "ID_DEL_VIDEOJUEGO",
  "fecha": "2026-10-02T18:00:00.000Z",
  "duracionMinutos": 90,
  "porcentajeAvance": 35,
  "notas": "Primera sesión"
}
Actualizar logro (PATCH /api/videojuegos/:id/logros/:logroId):
{ "obtenido": true }
Manejo de errores
Los middlewares requestId, logger y errorHandler permiten registrar solicitudes y centralizar las respuestas de error, incluyendo requestId.
HTTP	Situación
400	Validación de esquema o identificador mal formado.
404	Recurso o videojuego referenciado inexistente.
500	Error inesperado del servidor.


Ejecutar localmente
Requisitos: Node.js 20+ y una base de datos MongoDB Atlas accesible.
1. En backend/, copia .env.example a .env y configura la cadena de conexión. No publiques .env.
2. Inicia el backend:
   cd backend
   npm install
   npm run dev
3. En otra terminal, configura el frontend (si ya está implementado): copia frontend/.env.example a frontend/.env y establece VITE_API_URL=http://localhost:3000/api. Después ejecuta:
   cd frontend
   npm install
   npm run dev
4. Comprueba la API en http://localhost:3000/api/salud y abre el frontend en http://localhost:5173.
Para compilar y ejecutar el backend en modo producción:
cd backend
npm run build
npm start
Las variables del backend incluyen MONGODB_URI, MONGODB_DB, FRONTEND_URL y el puerto (PORT si así lo define config/env.ts). Revisa .env.example para usar los nombres exactos de tu implementación.

Pruebas manuales recomendadas
1. Crear un videojuego con al menos un logro.
2. Registrar tres partidas de 60, 90 y 30 minutos, con fechas crecientes y avances de 10, 35 y 67.
3. Consultar /api/videojuegos/:id/resumen: debe devolver totalPartidas: 3, horasTotales: 3 y porcentajeAvanceActual: 67; ultimaPartida debe coincidir con la tercera fecha.
4. Marcar un logro mediante PATCH y comprobar el cambio en el detalle.
5. Provocar y verificar los errores: nombre vacío (400), ID mal formado (400), referencia inexistente (404) y error inesperado (500).
6. Verificar el comportamiento sin partidas: totalPartidas: 0, horasTotales: 0, ultimaPartida: null y porcentajeAvanceActual: 0.
Estas son pruebas sugeridas, no resultados certificados de ejecución.
Despliegue en Render
Backend — Web Service
- Root Directory: backend
- Build Command: npm ci && npm run build
- Start Command: npm start
- Variables de entorno: MONGODB_URI, MONGODB_DB=diario_gamer, FRONTEND_URL=https://TU-FRONTEND.onrender.com y, si corresponde, PORT.
- Configurar CORS para permitir el origen público del frontend.
Frontend — Static Site
- Root Directory: frontend
- Build Command: npm ci && npm run build
- Publish Directory: dist
- Variable de entorno de build: VITE_API_URL=https://TU-BACKEND.onrender.com/api
- Configurar un fallback de rutas para React Router, por ejemplo mediante public/_redirects con /* /index.html 200.
Sustituye las URLs de ejemplo por las direcciones reales después del despliegue. Las credenciales deben configurarse en el panel de Render, nunca dentro del repositorio.
Entrega y demostración
La demostración debe cubrir el flujo: crear videojuego → registrar partidas → ver el resumen actualizado → marcar un logro como obtenido. Antes de entregar, comprobar la integración frontend/backend y actualizar este README con las URLs públicas reales.