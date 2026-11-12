# E2-FE-04 — edición de metas activas

Fecha: 12 de noviembre de 2026, America/Guayaquil.

Estado: implementado/verificado; revisión del bloque pendiente. Autorizado por
la solicitud de ejecutar conjuntamente pasos 7/8, secuencialmente, sin staging,
commit ni push. HEAD inicial dab0637. Spec frontend aprobada antes del código.

Dependencias: FE-03 aprobado por el usuario; BE-05 implementado y cubierto por
CRUD HTTP temporal. No se cambian backend, reglas ni endpoints de E1.
Fuentes: [frontend FE-AC04/07/12 y §§4–6](../specs/E2-frontend.md),
[backlog FE-04](../backlog/E2-metas-y-rachas.md).

| Criterio                           | Prueba y resultado                                                                                                                                    |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC07/08: edición válida e inválida | `meta-editar.test.tsx`: precarga 5h30, PUT con minutos/días, límites inválidos sin envío; omitir hitos conserva lista; resultado recalculado por GET. |
| FE-AC04                            | Cancelar no escribe, doble submit produce un PUT; 400 conserva nodos/borrador y muestra detalles/requestId, reintento manual.                         |
| 409                                | Desactivación concurrente provoca reconsulta; borrador anterior conservado y bloqueado para no editar una inactiva.                                   |
| FE-AC12                            | PUT confirmado + GET fallido conserva constancia de escritura y reintenta únicamente consulta.                                                        |
| AC12                               | Edición en Completado/Abandonado permitida.                                                                                                           |
| Servicio                           | `editarMetaApi.test.ts`: PUT canónico y 400/404/409/500, sin reintento automático.                                                                    |

Se reutiliza MetaForm con snapshot inicial, sin reiniciar borrador durante GET.
La acción Editar meta se renderiza con callback real; no hay desactivación ni
editor de hitos hasta sus tickets. Payload sin dueño/activa/timestamps.

Pruebas primero: **18 fallos** (13 React + 5 servicio) antes de implementar.
Frontend `npm test`: **237/237**, TypeScript aplicación/tests correcto; Prettier
aplicado a archivos del corte. Regresión backend del bloque: **165/165** base y
**161/161** integración con MongoDB 7.0.24 temporal y limpieza confirmada;
TypeScript correcto. Sin Atlas ni `.env`.

Logs `/tmp/savepoint-fe04-red.log`, `/tmp/savepoint-fe04-full.log`,
`/tmp/savepoint-fe04-types.log`, `/tmp/savepoint-bloque78-backend.log`,
`/tmp/savepoint-bloque78-integration.log`, `/tmp/savepoint-bloque78-backend-types.log`.
Verificación visual conjunta al finalizar el bloque; no se presume cerrado el ticket.
