# E2 — dependencias autorizadas para FE-03

Fecha: 12 de noviembre de 2026, America/Guayaquil.

Estado: implementadas y verificadas; pendientes de revisión del usuario. Sin
staging, commit ni push. Autorización: «Autorizado», en respuesta a la ampliación
limitada C05/T3 e INT-01 previa al bloque FE-01 → BE-02/FE-02 → FE-03.

Fuentes: [backend, C05, P03 y §8](../specs/E2-backend.md),
[plan incremental, pasos 6/8](E2-estado-implementacion.md),
[diagnóstico T3/D3](../diagnostico.md). No se cambia ningún contrato aprobado.

| Corte / criterio                                                     | Prueba → resultado real                                                                                                                                                             |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C05/T3: JSON malformado y escalar → 400 con requestId, sin escritura | `e1-crud.test.ts` y `metas.crud.test.ts`: respuesta y cabecera coinciden; biblioteca y conteo Meta conservados.                                                                     |
| C05/T3: cuerpo superior al límite existente → 413 con requestId      | `metas.crud.test.ts`: 110.000 caracteres; sin stack/cuerpo recibido en respuesta ni creación de metas.                                                                              |
| P03 / INT-01: cascada hacia metas activas e inactivas                | `metas.crud.test.ts`: borrar juego elimina ambas metas; consultas posteriores 404; otro juego conserva meta, resumen y partida. Regresión E1 comprueba eliminación de sus partidas. |

Tests escritos primero: cuatro casos dirigidos fallaron con comportamiento
anterior (500 en vez de 400/413 y dos metas huérfanas). Log:
`/tmp/savepoint-deps-red.log`. El primer intento estuvo limitado por EPERM del
sandbox; se repitió con permisos para puertos locales, conservando el aislamiento.

Implementación mínima: requestId/logger preceden al parser; el manejador
central reconoce `entity.parse.failed`/`entity.too.large` sin exponer el cuerpo.
La cascada existente elimina también las metas del juego.

Verificaciones ejecutadas en backend:

- `npm test`: **146/146**, cero fallos u omitidos.
- `npm run test:integration`: **153/153**, cero fallos u omitidos; incluye CRUD
  y resumen E1, objetivos, concurrencia y progreso existentes.
- `npm run typecheck`: aplicación y tests correctos.
- Prettier aplicado a los cinco archivos afectados.

Logs: `/tmp/savepoint-deps-unit.log`, `/tmp/savepoint-deps-integration.log`,
`/tmp/savepoint-deps-types.log`. MongoDB 7.0.24 creado por el runner en
127.0.0.1, base UUID exclusiva por suite; verificación previa de host, puerto,
PID y dbPath mediante comandos de solo lectura. Cada suite confirmó parada del
proceso y eliminación del directorio. Sin Atlas, dotenv, credenciales ni `.env`.

Limitaciones: este corte cubre el contrato del parser, no toda mejora de errores
posible de T3. No introduce transacciones ni resuelve D3: la cascada sigue siendo
secuencial y no garantiza atomicidad frente a fallo o creación concurrente.
INT-01 completo necesita reconsulta frontend/rachas; no se declara cerrado.
Los documentos anteriores conservan sus resultados como evidencia histórica.
