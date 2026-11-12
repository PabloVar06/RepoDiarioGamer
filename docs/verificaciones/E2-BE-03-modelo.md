# E2-BE-03 — evidencia del modelo Meta

Fecha: 11 de noviembre de 2026, America/Guayaquil.

Estado: corte del modelo implementado y verificado; pendiente de revisión del
usuario. **E2-BE-03 permanece abierto**: este corte no implementa su CRUD,
consulta ni cálculo del cumplimiento.

## Alcance autorizado y trazabilidad

El usuario aprobó el plan del modelo mediante «Plan aprobado». Se aplica
[E2-backend, sección 4](../specs/E2-backend.md#4-modelo-meta-y-persistencia-propuesta)
y el corte de persistencia de
[E2-BE-03](../backlog/E2-metas-y-rachas.md#7-tickets-funcionales-backend).
No existe un ticket independiente llamado «modelo Meta» en el backlog.

Se conserva el contrato aprobado: `minutosObjetivo` entero de 1 a 6000 representa
horas mayores que cero y hasta 100, con granularidad de un minuto; no se añade
otro campo de horas. La referencia a Videojuego es obligatoria e inmutable,
los días son enteros 1–7, `activa` es true por defecto y se admiten 0–5 hitos
embebidos con ID propio, descripción recortada obligatoria de 1–120 caracteres
y porcentaje entero 1–100. Se añaden timestamps y se omite `__v`, como en E1.

El índice único parcial es `{ videojuego: 1 }`, con `unique: true` y
`partialFilterExpression: { activa: true }`. La garantía concurrente se probó
en MongoDB real temporal; no se sustituye por una consulta previa ni por mocks.

## Archivos de este corte

- Nuevo: `backend/src/modelos/Meta.model.ts`.
- Nuevo: `backend/tests/meta.model.test.ts`.
- Nuevo: `backend/tests/integration/meta.model.test.ts`.
- Nuevo: este documento de evidencia.

Los siete documentos con modificaciones previas se conservaron byte por byte,
comparando SHA-256 antes/después. También se comprobó la conservación de
`Videojuego.model.ts` y `Partida.model.ts`. No se modificaron frontend,
servicios, controladores, rutas, arranque, dependencias ni scripts.

## Ejecuciones y resultados reales

Los comandos de npm siguientes se ejecutaron desde la carpeta indicada.

| Verificación                            | Comando                                                                                                                                                                                             | Resultado final                                                                                                        |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Tests escritos antes del modelo         | Backend: `node --require ./tests/setup.cjs --import tsx --test tests/meta.model.test.ts`                                                                                                            | Primera ejecución: fallo esperado `MODULE_NOT_FOUND` porque el modelo aún no existía. Tras implementarlo: 35/35 pasan. |
| Suite backend completa                  | Backend: `npm test`                                                                                                                                                                                 | 56 pasan: 35 nuevas y 21 existentes. 0 fallos, omitidas o canceladas.                                                  |
| Integración completa                    | Backend: `npm run test:integration`                                                                                                                                                                 | 59 pasan: 6 nuevas del modelo y 53 existentes de E1/T3. 0 fallos, omitidas o canceladas.                               |
| TypeScript backend, aplicación y tests  | Backend: `npm run typecheck`                                                                                                                                                                        | Exit 0, sin errores.                                                                                                   |
| TypeScript frontend, aplicación         | Frontend: `./node_modules/.bin/tsc --noEmit`                                                                                                                                                        | Exit 0, sin errores.                                                                                                   |
| TypeScript frontend, aplicación y tests | Frontend: `npm run typecheck`                                                                                                                                                                       | Exit 0, sin errores.                                                                                                   |
| Formato de los cuatro archivos nuevos   | Raíz: `./node_modules/.bin/prettier --check backend/src/modelos/Meta.model.ts backend/tests/meta.model.test.ts backend/tests/integration/meta.model.test.ts docs/verificaciones/E2-BE-03-modelo.md` | Todos cumplen Prettier.                                                                                                |
| Espacios y diff                         | Raíz: `git diff --check`                                                                                                                                                                            | Exit 0.                                                                                                                |

La primera ejecución de la suite backend dentro del sandbox tuvo 53 pruebas
correctas y 3 fallos por `listen EPERM` en las pruebas HTTP existentes. Se repitió
sin cambiar código, con permiso de escucha local: las 56 pasaron. La integración
también se ejecutó con permiso de escucha local. Esto distingue la restricción
del entorno de un fallo del producto.

Los contadores son los reportados por `node:test`, incluidos sus subtests;
no equivalen al número de peticiones HTTP. La suite de integración de E1 conserva
su prueba de caracterización de T3, cuyo resultado correcto confirma el defecto
existente, sin corregirlo.

## Criterio → prueba → resultado

| Criterio / parte de la spec                                   | Método y archivo                                                                                 | Evidencia obtenida                                                                                                                                                                                     |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| §4: campos obligatorios, defaults y límites; parte de BE-AC06 | `tests/meta.model.test.ts`: 35 unitarias con `validateSync()`                                    | Campos requeridos; 1/6000 minutos y 1/7 días admitidos; fuera de rango, fracciones, null, NaN e Infinity rechazados donde corresponde. Referencia mal formada rechazada.                               |
| §4: hitos embebidos e identidad                               | Unitarias y última integración del modelo                                                        | Cinco hitos válidos con IDs distintos; seis o lista null inválidos; descripción vacía/larga y porcentaje inválido rechazados; trim e ID conservados al guardar. No se evalúa si un hito se alcanzó.    |
| §4: índice único parcial; parte de BE-AC05                    | `tests/integration/meta.model.test.ts`: inspección del índice real y dos creaciones concurrentes | Una creación aceptada y otra con código MongoDB 11000; una sola activa persistida. No se acredita todavía HTTP 201/409.                                                                                |
| §4: historial y unicidad por juego                            | Integración: juegos distintos, varias inactivas y sustitución tras desactivación                 | Dos inactivas y una activa del mismo juego conviven; desactivar permite otra activa, conserva la anterior y no cambia la de otro juego. No se implementan endpoints de desactivación.                  |
| §4: referencia inmutable y timestamps                         | Integración: guardar y recargar Meta                                                             | Cambiar la referencia mediante documento no altera el juego original; fechas Date persistidas, creación conservada y ausencia de `__v`.                                                                |
| AC13: regresión E1 del backend                                | 53 verificaciones HTTP existentes y 21 pruebas base                                              | CRUD Videojuego, creación/consulta/eliminación Partida, relaciones, logros, resumen, cascada, conservación de otro juego y errores 400/404 pasan. No existe ni se añade actualización HTTP de Partida. |

## Evidencia de aislamiento y limpieza

Se reutilizó `tests/integration/temporary-mongo.ts` con
`mongodb-memory-server-core` 10.2.3 y MongoDB **7.0.24**, exclusivamente en
**127.0.0.1**. Cada archivo de integración usó su propio proceso hijo, puerto,
directorio temporal y nombre de base generado. El runner confirmó host, puerto,
base, PID vivo, PID de `serverStatus`, bind y dbPath de `getCmdLineOpts`.

Identidades reales registradas durante esta ejecución:

| Suite       | Puerto | PID   | Base exclusiva                                       | Directorio temporal (dbPath)                                                |
| ----------- | ------ | ----- | ---------------------------------------------------- | --------------------------------------------------------------------------- |
| E1 HTTP     | 57664  | 73219 | `savepoint_e1_test_366e9dd77daa414c844376a60e2fc682` | `/var/folders/_s/hkjd8pc97kgdkyk06y6t1t7c0000gn/T/savepoint-e1-nINpiD/data` |
| Modelo Meta | 57681  | 73230 | `savepoint_e1_test_003be7e920704cf9be4b518f656e91f9` | `/var/folders/_s/hkjd8pc97kgdkyk06y6t1t7c0000gn/T/savepoint-e1-RtaYIM/data` |

El prefijo `savepoint_e1_test_` procede del runner compartido; no reutiliza una
base E1 persistente. `autoCreate` y `autoIndex` estuvieron desactivados. En la
suite Meta solo tras confirmar la propiedad de la conexión se creó explícitamente
la colección y el índice, y se inspeccionó este antes de escribir metas.
Cada escenario revalidó el aislamiento antes de sus escrituras.

Ambos cierres registraron «MongoDB detenido; directorio temporal y datos
eliminados». El runner comprobó la desaparición del PID y del directorio; no
utilizó `dropDatabase`, Atlas, URI externa ni credenciales. Los preloads existentes
bloquearon dotenv y lecturas de archivos `.env`; no se leyeron ni modificaron.

## Límites y requisitos pendientes

- La ref de Mongoose no comprueba por sí sola la existencia de Videojuego.
  Los fixtures sí crearon juegos reales; la validación de existencia corresponde
  al servicio del futuro CRUD, siguiendo E1.
- El modelo mantiene el casting habitual de Mongoose. El rechazo estricto de
  DTO coercibles, campos desconocidos e IDs de hitos ajenos corresponde al
  servicio/API; no se afirma que estos contratos HTTP estén verificados aquí.
- Se declaró el índice y se verificó su creación en la base temporal. La espera
  y comprobación del índice en el arranque productivo antes de aceptar escrituras,
  y el mapeo de 11000 a HTTP 409, quedan pendientes del CRUD. No se conectó el
  modelo al arranque ni se inspeccionaron datos o índices de producción.
- No se implementaron progreso semanal, rachas, evaluación de hitos, cascada a
  metas ni concurrencia de edición/desactivación HTTP. E2-BE-01 y el resto de las
  dependencias del ticket completo no se consideran resueltos por este corte.
- T3 sigue pendiente: JSON malformado devuelve actualmente 500 sin requestId.
- No se ejecutaron pruebas de interfaz ni build de producción; el frontend no
  cambió y sus comprobaciones TypeScript pasaron.

No se hizo staging, commit ni push. El cumplimiento es parcial respecto al
DoD de E2-BE-03; esta evidencia permite revisar el modelo, no cerrar el ticket.
