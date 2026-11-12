# E2-BE-01 — evidencia de consulta de progreso

Fecha: 11 de noviembre de 2026, America/Guayaquil.

Estado: corte de consulta implementado y verificado bajo el plan aprobado mediante
«Aprobado». Pendiente de revisión; no se cierra E2-BE-01 ni sus tickets relacionados.

## Alcance y decisiones aprobadas

Ticket principal: **E2-BE-01 — Consultar horas y días semanales sin meta**.
El plan aprobado incluye cumplimiento de E2-BE-03 y evaluación de hitos de
E2-BE-07 para entregar el DTO completo de la
[spec backend, §§5–6 y 9](../specs/E2-backend.md). La consulta también permite
verificar recálculo tras edición/desactivación de E2-BE-05/06. No implica cierre
de estos tickets ni implementación de rachas o interfaz.

Se conservó la ruta canónica **GET `/api/videojuegos/:id/progreso`**, aprobada en
el plan. No se creó alias `progreso-semanal`. El endpoint E1
**GET `/api/videojuegos/:id/resumen` mantiene su contrato y su implementación**.

Las funciones puras solo estaban descritas antes de este corte: no se afirmó
reutilizar código inexistente. Se escribieron sus pruebas, se implementaron y
verificaron, y el servicio HTTP reutiliza esas funciones sin repetir sus cálculos.
Los contratos aplicables de la spec ya estaban versionados antes de este código;
HEAD al comenzar era `03f8564`. El CRUD anterior permanece preparado en staging,
sin un commit adicional realizado por este trabajo.

## Flujo del endpoint

1. Capturar un único instante por petición mediante el reloj opcional de
   `crearApp`. En producción usa `new Date()`; en tests se inyecta. No se añadió
   parámetro HTTP para elegir fechas ni semanas históricas.
2. Validar ID (400) y reutilizar `obtenerVideojuego` para existencia (404).
3. Obtener hoy en America/Guayaquil y semana lunes–domingo con funciones puras.
4. Consultar en paralelo Meta activa y todas las Partidas del juego. La proyección
   de partidas solo requiere fecha, duración y avance; no carga notas.
5. Transformar las fechas Date guardadas a día UTC civil según P07, sin convertir
   medianoche a Guayaquil ni modificar documentos.
6. Delegar actividad semanal, máximo acumulado, cumplimiento e hitos a funciones
   puras. Reutilizar el serializador `metaDTO` del CRUD para evitar otra versión
   de su contrato.
7. Devolver ProgresoJuegoDTO. Los errores se propagan al middleware centralizado.

La actividad suma minutos de la semana vigente hasta hoy y cuenta fechas únicas
por juego. El máximo avance conserva todas las partidas, incluso fuera de semana
y futuras antiguas, conforme al máximo acumulado de E1; la exclusión de futuros
P02 se aplica a actividad semanal, sin alterar el resumen E1.

Sin meta se conservan actividad y avance, `meta`, `porcentajeHoras` y
`metaCumplida` son null e `hitos` es []. Sin partidas los observados son cero;
con meta el porcentaje es cero, cumplimiento false e hitos pendientes.
El porcentaje de horas no se redondea ni se limita a 100. Se exigen minutos
**y** días para cumplir. Los hitos usan el máximo acumulado y no guardan estado
`alcanzado`; borrar la sesión máxima puede devolverlos a pendiente.

## Pruebas y resultados reales

Se escribieron las tres suites nuevas antes de la implementación. Las primeras
unitarias fallaron por módulos inexistentes. La primera ejecución HTTP dentro
del sandbox falló por permiso de puertos (EPERM); el runner limpió el temporal.
Al repetir con permiso de escucha, las 12 HTTP fallaron por la ruta todavía
inexistente (404), confirmando el estado previo. Después de implementar pasaron.

| Verificación / comando                                                                                                | Resultado final                                                           |
| --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Backend: `node --require ./tests/setup.cjs --import tsx --test tests/fechas.test.ts tests/progreso.test.ts`           | 33/33 nuevas: 18 de calendario y 15 de cálculos.                          |
| Backend: `node --require ./tests/integration/preload.cjs --import tsx --test tests/integration/progreso.http.test.ts` | 12/12 nuevas de HTTP con MongoDB real temporal.                           |
| Backend: `npm test`                                                                                                   | **115/115**: 82 anteriores + 33 nuevas; 0 fallos, omitidas o canceladas.  |
| Backend: `npm run test:integration`                                                                                   | **119/119**: 107 anteriores + 12 nuevas; 0 fallos, omitidas o canceladas. |
| Backend: `npm run typecheck`                                                                                          | Exit 0; aplicación y tests sin errores.                                   |
| Frontend: `npm run typecheck`                                                                                         | Exit 0; aplicación y tests sin errores.                                   |
| Raíz: Prettier `--check` sobre los once archivos del corte                                                            | Formato correcto.                                                         |
| Raíz: `git diff --check`                                                                                              | Exit 0.                                                                   |

Los contadores son los de `node:test`, incluidos subtests, no el número de
peticiones HTTP. Las 119 integraciones incluyen dos caracterizaciones previas
de T3: que pasen confirma sus defectos actuales, no su corrección.

Logs temporales de esta ejecución, fuera del repositorio:

- `/tmp/savepoint-progreso-http-red.log`: estado HTTP antes de implementar.
- `/tmp/savepoint-progreso-http.log`: suite dirigida después de implementar.
- `/tmp/savepoint-progreso-unit.log`: suite backend completa final.
- `/tmp/savepoint-progreso-integration.log`: integración completa final.

## Criterio → método → evidencia

| Criterio                                 | Pruebas                                                                          | Resultado / límite                                                                                                                                                                                                   |
| ---------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC01/AC02, BE-AC01: semana y día local   | `fechas.test.ts`, `progreso.test.ts` y HTTP de límites/cambio domingo-lunes      | Lunes/domingo incluidos, 08/16 excluidos, UTC guardado no retrocede un día. Se prueba el corte a las 05:00 UTC, cuatro TZ de proceso, bisiestos y cambio de año. La escritura civil estricta HAB-03 sigue pendiente. |
| AC04: deduplicación por juego            | Unitarias y fixture HTTP de 30+60 minutos del juego A y 15 del B el 09/11        | A=90 minutos/1 día, B=15 minutos. No acredita la racha global de ese criterio.                                                                                                                                       |
| AC03, BE-AC02: porcentaje y cumplimiento | Unitarias y HTTP con 420 minutos/2 días y meta 300/3                             | 7 horas, 140 %, false; requiere ambas condiciones. Valores justo inferiores al objetivo no se redondean para cumplir.                                                                                                |
| AC08/AC09, parte de BE-AC07              | HTTP: registrar actividad, crear meta, editar objetivos, desactivar y crear otra | Incluye actividad previa, recalcula sin totales guardados, ignora históricas y conserva actividad y resumen.                                                                                                         |
| AC10, BE-AC08: hitos derivados           | Unitarias y HTTP: avances 80/30/70, hito 75, borrado del 80                      | Usa máximo acumulado aun fuera de semana; pasa de alcanzado a pendiente con máximo 70; ID de hito y logros manuales conservados.                                                                                     |
| AC11, BE-AC04: ausencia de meta/partidas | HTTP de DTO vacío y meta sin partidas                                            | Ceros frente a null correctos; con meta vacía, 0 % e hitos pendientes. No incluye rachas.                                                                                                                            |
| AC12: estados del juego                  | HTTP con juego Completado y Abandonado                                           | La consulta, meta y actividad siguen disponibles.                                                                                                                                                                    |
| Errores 400/404/500                      | HTTP: ID inválido/inexistente, fecha corrupta almacenada y fallo de consulta     | Error y requestId correctos, sin stack en respuesta ni éxito vacío. El documento corrupto permanece intacto.                                                                                                         |
| Referencia temporal única                | Reloj inyectado y contador HTTP                                                  | Una lectura por consulta; el lunes devuelve la nueva semana sin cachear actividad anterior.                                                                                                                          |
| AC13: resumen E1                         | HTTP específico nuevo y toda `e1-crud.test.ts`                                   | Contrato vacío, horas a dos decimales, máximo acumulado, última fecha y recálculo al borrar se conservan. Progreso ofrece horas sin ese redondeo.                                                                    |

## Aislamiento MongoDB

Se reutilizó `mongodb-memory-server-core` 10.2.3 con binario **MongoDB 7.0.24**.
El runner confirmó IP 127.0.0.1, puerto, base exclusiva, PID vivo del hijo y del
servidor, bind y dbPath reales antes de escribir. Cada petición HTTP del test
revalida la propiedad de la conexión. Los fixtures corruptos solo se insertaron
después de ese control y exclusivamente en la base temporal.

Identidades registradas en la integración completa final:

| Suite       | Puerto | PID   | Base exclusiva                                       | Temporal dentro del directorio del sistema |
| ----------- | ------ | ----- | ---------------------------------------------------- | ------------------------------------------ |
| E1 HTTP     | 60462  | 74641 | `savepoint_e1_test_f678f7e87aff4fb4a73093938166683f` | `savepoint-e1-bMxvX3/data`                 |
| Modelo Meta | 60479  | 74644 | `savepoint_e1_test_38dd9322099d4a8a80372feae2f8fcb7` | `savepoint-e1-ODYbS2/data`                 |
| CRUD Meta   | 60486  | 74647 | `savepoint_e1_test_cc72ae3b4e104a27a728d107161f0bca` | `savepoint-e1-eKXNk4/data`                 |
| Progreso    | 60499  | 74650 | `savepoint_e1_test_ccaeeaeb30554dac9e8d7d633144e532` | `savepoint-e1-cvW6wR/data`                 |

En las cuatro instancias autoCreate/autoIndex estaban desactivados; los índices
se inicializaron explícitamente después de comprobar el aislamiento. Cada cierre
confirmó que el PID desapareció y eliminó el directorio y sus datos. No se usó
Atlas, URI externa, credenciales, `.env` ni dotenv. No se ejecutó el arranque de
producción ni un build que pudiera cargar configuración privada.

## Archivos y conservación del trabajo anterior

Nuevos:

- `backend/src/services/fechas.ts`: calendario puro.
- `backend/src/services/progreso.calculos.ts`: actividad, cumplimiento, máximo e hitos.
- `backend/src/services/progreso.service.ts`: consultas y composición del DTO.
- `backend/src/controllers/progreso.controller.ts`: traducción HTTP y reloj.
- `backend/tests/fechas.test.ts`.
- `backend/tests/progreso.test.ts`.
- `backend/tests/integration/progreso.http.test.ts`.
- `docs/verificaciones/E2-BE-01-progreso.md`.

Modificados respecto al trabajo anterior:

- `backend/src/app.ts`: reloj opcional inyectable, sin cambiar parser ni rutas E1.
- `backend/src/routes/videojuegos.routes.ts`: registro de `/:id/progreso`.
- `backend/src/services/metas.service.ts`: únicamente exportar el serializador
  existente `metaDTO`; el comportamiento del CRUD no cambió.

Se compararon hashes antes/después para conservar los modelos, servicio de
Videojuego/resumen y demás archivos del CRUD previo. Se verificó mediante hash
del diff preparado que **el staging anterior permanece idéntico**. Los cambios
de este corte no se prepararon. No se modificaron frontend, dependencias, specs,
backlog, parser ni escritura de Partida.

## Pendientes y límites del DoD

- HAB-03 sigue pendiente: estos helpers de lectura no corrigen el contrato de
  escritura de fechas ni los formularios. B1/B2 no se declaran resueltos y la
  dependencia de cierre de E2-BE-01 permanece.
- Rachas globales (E2-BE-02), integración frontend y actualización de vistas
  siguen fuera de este corte. No se añade racha por juego al DTO.
- T3 permanece: JSON malformado y escalares pueden devolver 500 sin requestId.
  No se da por cumplido el contrato completo BE-AC10.
- La consulta lee todo el historial del juego para preservar el máximo E1 y
  detectar datos no interpretables. No introduce paginación ni resuelve D3.
- Meta y Partidas se consultan en paralelo sin snapshot transaccional. No se
  promete atomicidad con mutaciones concurrentes ni se extiende la cascada a
  Meta del ticket INT-01.
- El corte de consulta está verificado; esto no cierra automáticamente E2-BE-01,
  BE-03/05/06/07 ni acredita interfaz visual o conformidad académica PA01.

Sin staging nuevo, commit ni push. Se presenta para revisión antes de un commit.
