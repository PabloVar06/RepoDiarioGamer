# E2-FE-03 — creación funcional de metas

Fecha: 12 de noviembre de 2026, America/Guayaquil.

Estado: implementado y verificado, pendiente de revisión del usuario. No se
cierra el ticket ni se hace staging/commit/push. Autorización: bloque pasos 4–6
y «Autorizado» para C05/T3 y cascada INT-01, comprobadas previamente.

Fuentes: [frontend P05, §§4–7 y FE-AC02/04/07/12](../specs/E2-frontend.md),
[backend CrearMeta/MetaDTO, §8](../specs/E2-backend.md),
[backlog FE-03](../backlog/E2-metas-y-rachas.md). FE-01 y BE-03 disponían de
implementación y evidencia antes de este corte; el parser y la cascada se
verificaron en [su corte autorizado](E2-dependencias-FE-03.md).

## Implementación y criterios

MetaForm vive dentro del detalle, con controles Horas/Minutos/Días, foco inicial
en Horas y cancelar sin escritura. Convierte a minutos una sola vez, conserva
el borrador ante error y bloquea POST mientras está pendiente. Se ofrece crear
solo después de conocer que no existe meta activa, en todos los estados del juego.
El cliente `metasApi.crear` exige 201, valida MetaDTO/dueño/activa y conserva
status/requestId/detalles permitidos. No se reenvía un MetaDTO completo.

| Criterio                            | Prueba → resultado                                                                                                                                                                                         |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC07 / P05: límites y tipos         | `tests/meta-crear.test.tsx`: 1/6000 minutos y 1/7 días válidos; 12 combinaciones inválidas, decimales, vacíos, negativos y 100 h + 1 min no envían; errores asociados a campos.                            |
| FE-AC04: un envío y recuperación    | Doble submit pendiente produce un POST; 400 conserva nodos/valores y muestra detalles/requestId; reintento manual funciona.                                                                                |
| AC08: conflicto y ausencia conocida | Meta activa no ofrece crear; 409 informa/reconsulta y conserva borrador, sin repetir POST ni sustituirlo por los objetivos ajenos.                                                                         |
| FE-AC12: escritura confirmada       | GET posterior fallido conserva constancia de creación; reintento consulta únicamente, sin POST adicional.                                                                                                  |
| FE-AC12: resultado incierto         | Red, 500 no JSON y respuesta 201 ilegible obligan a reconsultar antes de otro POST. Si existe meta, bloquea creación; si se confirma ausencia, permite envío manual. Consulta fallida mantiene el bloqueo. |
| AC03 / FE-AC02                      | Tras creación se consulta progreso y presenta 140 % / barra 100, manteniendo pendiente por falta de días; conserva resumen y rachas.                                                                       |
| AC12 / H9                           | Creación probada en Completado y Abandonado.                                                                                                                                                               |
| Servicio y contrato                 | `src/api/crearMetaApi.test.ts`: POST canónico/201, campos protegidos ausentes en payload de prueba; 200/204 o DTO de otro juego/inactivo/inválido no se aceptan; errores sin reintento automático.         |
| DESIGN / AC13                       | [Revisión conjunta](E2-bloque-progreso-rachas-creacion.md): navegador real con Express/MongoDB temporal, cuatro anchos, teclado, contraste y estados; funciones E1 conservadas.                            |

## Verificaciones reales

- Pruebas escritas primero: **32 fallos** antes de implementar el formulario y
  POST. Después se ampliaron con cuatro casos de recuperación/ausencia de meta.
- Suite específica: **28 React + 8 servicio**, incluidos en la regresión final.
- Primer cierre de suite frontend del corte: **217/217**; la comprobación final
  añade StrictMode y el fixture dirigido AC04 a FE-02 y queda en **219/219**. TypeScript aplicación/tests
  correcto. Resultados finales en el informe conjunto.
- Navegador: creación real con un único POST, persistencia de 300 minutos/3 días,
  GET de progreso y conflicto 409 contra índice MongoDB real; borrador intacto.
- Sin Atlas, `.env`, nuevas bibliotecas ni cambios de contratos E1.

Logs: `/tmp/savepoint-fe03-red.log`, `/tmp/savepoint-fe03-directed.log`,
`/tmp/savepoint-fe03-full.log`, `/tmp/savepoint-fe03-types.log` y logs finales
referenciados en el informe conjunto. Cargas/fallos de transporte se simulan en
Vitest; persistencia/HTTP reales se verifican en suites backend y navegador.

No se implementan FE-04/05/06: edición, confirmación de desactivación y editor de
hitos siguen pendientes. Crear sin hitos usa el valor predeterminado [] del
backend. INT-03 y consolidación completa VIS-03/INT-04 siguen pendientes.
