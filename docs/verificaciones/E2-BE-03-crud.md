# E2 — evidencia del corte CRUD de Meta

Fecha: 11 de noviembre de 2026, America/Guayaquil.

Estado: implementado y verificado dentro del plan aprobado mediante «Aprobado»;
pendiente de revisión del usuario. No se cierran tickets ni se realiza commit.

## Alcance y trazabilidad

El backlog reparte el CRUD entre **E2-BE-03** (creación/consulta), **E2-BE-05**
(edición) y **E2-BE-06** (desactivación). El plan aprobado incluye soporte
estructural e identidad de hitos de **E2-BE-07**, sin evaluación de cumplimiento
ni hitos alcanzados. No existe un único ticket llamado «CRUD de Meta».

Referencias: [spec backend, §§4–5 y 9](../specs/E2-backend.md),
[backlog](../backlog/E2-metas-y-rachas.md#7-tickets-funcionales-backend),
[diagnóstico](../diagnostico.md) y [modelo previamente verificado](E2-BE-03-modelo.md).
La spec aplicable ya estaba en Git antes de este código; HEAD al iniciar era
`03f8564`, que incorporó el modelo y la regularización documental.

Se mantuvo la arquitectura routes → controllers → services → modelos. El error
de duplicado del índice se convierte en ApiError 409 dentro del servicio y llega
al middleware centralizado existente. No se modificó ese middleware ni el parser.

## Operaciones implementadas

| HTTP                            | Servicio / controlador                | Comportamiento verificado                                                                                                   |
| ------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| POST `/api/metas`               | `crearMeta` / `crear`                 | 201; exige videojuego existente y objetivos válidos. Segunda activa, incluso concurrente, devuelve 409.                     |
| GET `/api/metas/:id`            | `obtenerMeta` / `obtener`             | 200; permite consultar una meta activa o desactivada por ID. No es un listado histórico.                                    |
| GET `/api/videojuegos/:id/meta` | `obtenerMetaActiva` / `obtenerActiva` | 200 con `{ meta }` o `{ meta: null }` para juego existente sin activa; juego inexistente devuelve 404.                      |
| PUT `/api/metas/:id`            | `actualizarMeta` / `actualizar`       | 200 únicamente para activa; validación completa antes de una escritura condicional a `activa: true`. Inactiva devuelve 409. |
| DELETE `/api/metas/:id`         | `desactivarMeta` / `desactivar`       | 204 sin cuerpo; desactivación lógica. Repetir no altera timestamps ni elimina el documento.                                 |

Las operaciones validan IDs y existencia del videojuego. Se permiten todos los
estados E1, incluidos Completado y Abandonado. Los DTO rechazan campos desconocidos
y modificaciones de dueño, identidad, timestamps o `activa`. Los objetivos son
enteros: minutos 1–6000 y días 1–7. IDs se serializan como strings y timestamps
como ISO UTC; no se exponen propiedades internas de Mongoose.

Hitos: máximo cinco, descripción trim de 1–120 caracteres y porcentaje entero
1–100; duplicados de descripción/porcentaje permitidos. Crear no admite IDs del
cliente. Editar conserva IDs conocidos, rechaza IDs ajenos/repetidos/mal formados,
genera IDs para nuevos hitos y reemplaza la lista si se proporciona. Omitirla la
conserva; `[]` la vacía. Un fallo no modifica objetivos ni hitos persistidos.

No se permite reactivar: enviar `activa` devuelve 400; editar una inactiva con
DTO válido devuelve 409; la ruta inexistente de reactivación devuelve 404. Tras
desactivar se puede crear otra meta con nuevo ID conservando las anteriores.

## Índice y concurrencia

- `inicializarMetas()` crea la colección/índices y verifica el índice único
  parcial `{ videojuego: 1 }`, filtro `{ activa: true }`. `index.ts` lo espera
  después de conectar y antes de `listen`.
- Antes de cada escritura CRUD se comprueba que ese índice sigue presente.
  No se usa `syncIndexes`, no se borran índices ni se normalizan duplicados.
- Dos POST HTTP concurrentes produjeron 201/409 y dejaron una activa.
- La carrera PUT/DELETE se controló retrasando únicamente la ejecución de la
  consulta PUT real, después de su lectura/validación. DELETE llegó a MongoDB y
  ganó; al liberar PUT, su filtro condicional devolvió 409 sin editar ni reactivar.
  No se simularon respuestas HTTP ni la persistencia de MongoDB.
- También se verificó la secuencia inversa: PUT confirmado primero y DELETE
  después conserva los objetivos editados y termina con la meta inactiva.
- En fixtures temporales se retiró el índice: POST devolvió 500 con requestId y
  no escribió. Con duplicados sintéticos presentes, el inicializador falló y
  conservó ambos documentos. Solo el test reparó sus propios fixtures al finalizar.

## Tests y comandos ejecutados

Las pruebas unitarias y de integración se escribieron antes del servicio. Sus
primeras ejecuciones fallaron por `MODULE_NOT_FOUND` de `metas.service.ts`.
Tras implementar, pasaron. El primer typecheck detectó un parámetro rest sin tipo
en la instrumentación de la carrera; se tipó y las comprobaciones finales pasaron.

| Comando                                                     | Resultado final                                                                            |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Backend: `npm test`                                         | **82/82**, 0 fallos/omitidos/cancelados: 56 existentes y 26 nuevos de validación DTO.      |
| Backend: `npm run test:integration`                         | **107/107**, 0 fallos/omitidos/cancelados: 53 E1/T3, 6 del modelo y 48 nuevos del CRUD/T3. |
| Backend: `npm run typecheck`                                | Exit 0; aplicación y tests sin errores.                                                    |
| Frontend: `npm run typecheck`                               | Exit 0; aplicación y tests sin errores. Frontend sin modificaciones.                       |
| Raíz: Prettier `--check` sobre los nueve archivos del corte | Todos cumplen formato.                                                                     |
| Raíz: `git diff --check`                                    | Exit 0.                                                                                    |

Los contadores corresponden a `node:test`, incluidos sus subtests; no son el
número de solicitudes HTTP. Los 48 nuevos comprenden 47 verificaciones del CRUD
y una caracterización de T3. La integración total contiene dos caracterizaciones
de T3 que pasan observando defectos, no certificando su corrección.

Comando dirigido reproducible desde backend:

```sh
node --require ./tests/integration/preload.cjs --import tsx --test tests/integration/metas.crud.test.ts
```

Log completo de la ejecución final disponible localmente en
`/tmp/savepoint-meta-crud-integration.log`; es un artefacto temporal, no un archivo
versionado. No se ejecutó `index.ts`, servidor productivo ni build. Se revisó la
secuencia de arranque y se probó su inicializador con conexión sintética explícita.

## Aislamiento y limpieza

Se reutilizó el runner aprobado `temporary-mongo.ts`, con
`mongodb-memory-server-core` 10.2.3 y MongoDB **7.0.24**. Antes de cualquier
escritura se confirmó proceso hijo vivo, host 127.0.0.1, puerto, base exclusiva,
PID del servidor y bind/dbPath reales. Cada petición revalidó la propiedad de
la conexión; la suite escalar T3 la verificó antes del bloque sin escrituras.

Identidades reales de la ejecución final:

| Suite       | Puerto | PID   | Base exclusiva                                       | Temporal dentro del directorio del sistema |
| ----------- | ------ | ----- | ---------------------------------------------------- | ------------------------------------------ |
| E1 HTTP     | 59080  | 73864 | `savepoint_e1_test_6b2842db6a7b4ffb8d3751d8e1be8888` | `savepoint-e1-erUQOm/data`                 |
| Modelo Meta | 59096  | 73869 | `savepoint_e1_test_9a0db3d3147e475194d1b1c3b4e2bb8d` | `savepoint-e1-LWNYox/data`                 |
| CRUD Meta   | 59103  | 73873 | `savepoint_e1_test_9aea540b8159430daa481d2d1c70195f` | `savepoint-e1-6CV7Lk/data`                 |

En las tres instancias `autoCreate`/`autoIndex` estuvieron desactivados; la
inicialización explícita solo ocurrió después del preflight. Los tres cierres
comprobaron que el PID desapareció y que el directorio temporal fue eliminado.
No se usaron Atlas, credenciales, URI externa ni `dropDatabase`. Los preloads
bloquearon dotenv y acceso a `.env`; no se leyeron ni modificaron esos archivos.

## Matriz de aceptación y pendientes

| Criterio / DoD                                            | Evidencia                                                                          | Estado                                                                                       |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| BE-AC05: 201/409 concurrentes e índice real               | Integración HTTP y conteo persistido                                               | Cubierto en este corte.                                                                      |
| BE-AC06: límites/tipos y estados de juego                 | 26 unitarias DTO, tabla negativa HTTP, límites válidos y cuatro estados E1         | Cubierta validación de objetivos. El contrato general de errores del parser sigue pendiente. |
| BE-AC07: edición/desactivación sin pérdida y nueva activa | Históricas múltiples, DELETE repetido, conservación de partidas/resumen/otro juego | Parcial: falta actividad semanal previa y recálculo.                                         |
| BE-AC10: 400/404/409 y error inesperado                   | IDs/DTO, referencias inexistentes, duplicados y ausencia de índice con requestId   | Parcial: T3 y contrato de parser 400/413 pendientes.                                         |
| BE-AC11: DELETE ganador impide PUT                        | HTTP real con barrera antes de ejecutar consulta MongoDB                           | Cubierto; no se introdujo versionado general.                                                |
| E2-BE-03                                                  | Modelo previo + creación/lectura e índice                                          | Parcial: E2-BE-01, progreso y cumplimiento no implementados.                                 |
| E2-BE-05                                                  | Edición validada/condicional                                                       | Parcial: falta integración de recálculo del progreso.                                        |
| E2-BE-06                                                  | Desactivación lógica, idempotencia e historial                                     | Corte de persistencia cubierto; queda integración de indicadores sin meta.                   |
| E2-BE-07                                                  | Estructura, validación e identidad de hitos                                        | Parcial: no evalúa hitos ni máximo avance.                                                   |
| AC13: regresión E1                                        | Suite HTTP existente completa y preservación de partidas/resumen en CRUD Meta      | Backend verificado; no certifica UI E2 ni adopción visual.                                   |

**T3 se conserva pendiente por el plan aprobado.** JSON malformado y cuerpos
escalares válidos (`null`, `true`, string) son rechazados por el parser antes de
requestId y actualmente terminan en **500 sin requestId**. Se verificó el caso
escalar en POST Meta sin creación de documentos. El validador de servicio sí
rechaza cuerpos no objeto con 400, pero el parser impide que esos escalares
lleguen a él por HTTP. No se declara cumplido ese contrato negativo de la spec.

Otras limitaciones conservadas: no se extiende todavía la cascada de Videojuego
a Meta (E2-INT-01); la comprobación de existencia del juego y la creación no son
una transacción contra un borrado concurrente. No se promete resolver D3 ni
concurrencia general entre dos ediciones de hitos. No se implementaron progreso,
rachas, interfaces frontend ni otros tickets. No hay migración ni acceso a datos
reales. No se cierran tickets completos por este corte.

## Archivos del corte

Nuevos:

- `backend/src/services/metas.service.ts`.
- `backend/src/controllers/metas.controller.ts`.
- `backend/src/routes/metas.routes.ts`.
- `backend/tests/metas.test.ts`.
- `backend/tests/integration/metas.crud.test.ts`.
- `docs/verificaciones/E2-BE-03-crud.md`.

Modificados:

- `backend/src/app.ts`: montaje del router.
- `backend/src/index.ts`: espera del inicializador antes de escuchar.
- `backend/src/routes/videojuegos.routes.ts`: consulta de meta activa y formato.

Se conservaron Meta.model.ts, Videojuego.model.ts, Partida.model.ts, servicios E1,
middleware de errores, specs, backlog, dependencias y frontend. No se realizó
staging, commit ni push. Se espera revisión del usuario antes de cualquier commit.
