# E2-INT-01 — reconsulta tras mutaciones

Fecha: 12 de noviembre de 2026, America/Guayaquil.

Estado: flujos funcionales del bloque verificados, revisión conjunta pendiente.
Autorizado en pasos 7/8; spec frontend §7/FE-AC08 y backend P03/BE-AC09 vigentes.
Sin staging/commit/push. No se introducen store, bus de eventos ni cálculos React.

| Mutación                      | Evidencia                                                                                                                                                                                                                          |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Crear/editar meta e hitos     | Suites FE-03/04/06: GET progreso después de escritura, IDs y resultado derivados del backend; lectura fallida no repite escritura.                                                                                                 |
| Desactivar meta               | Suite FE-05: DELETE 204 → GET; conservación de actividad/rachas, sin repetir baja al reintentar lectura.                                                                                                                           |
| Registrar partida             | `reconsulta.test.tsx`: navegación E1 al detalle consulta historial/resumen/progreso/rachas y muestra hito alcanzado.                                                                                                               |
| Eliminar partida en detalle   | FE-01/02/06: confirmación y reconsulta de todos los bloques; hito puede volver a pendiente.                                                                                                                                        |
| Eliminar en historial general | `reconsulta.test.tsx`: lista se actualiza y regresar al detalle realiza todas las consultas vigentes.                                                                                                                              |
| Eliminar juego                | `reconsulta.test.tsx`: conserva otro juego y al abrirlo consulta sus indicadores/rachas; no consulta progreso del ID borrado. Cascada backend ya implementada en dab0637.                                                          |
| Recorrido HTTP real           | `integration/recalculo.flujo.test.ts`: crear meta/hitos, editar objetivos omitiendo hitos, borrar sesión máxima, desactivar, crear otra meta, borrar juego y ambas metas; otro juego/logro/resumen intactos y rachas recalculadas. |

Las reconsultas necesarias de producción ya se integraron en los tickets
funcionales anteriores. Este corte añade tres recorridos React y uno HTTP real,
que pasaron sobre esa implementación; no se fabrica un cambio de código adicional.

Frontend `npm test`: **265/265**, TypeScript aplicación/tests correcto. Backend
`npm test`: **165/165**; `npm run test:integration`: **162/162**, TypeScript
aplicación/tests correcto. Prettier aplicado. Base UUID y proceso MongoDB 7.0.24
propios en 127.0.0.1, identidad comprobada antes de operaciones y limpieza
confirmada. Sin Atlas ni `.env`.

Logs `/tmp/savepoint-int01-directed.log`, `/tmp/savepoint-int01-full.log`,
`/tmp/savepoint-int01-types.log`, `/tmp/savepoint-int01-http.log`,
`/tmp/savepoint-int01-backend.log`, `/tmp/savepoint-int01-integration.log`,
`/tmp/savepoint-int01-backend-types.log`.
D3 (atomicidad general) permanece diferido; no se garantiza sincronización entre
pestañas. Cambios de período/foco corresponden al siguiente corte INT-03.
