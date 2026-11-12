# E2-FE-05 — confirmación de desactivación

Fecha: 12 de noviembre de 2026, America/Guayaquil.

Estado: implementado/verificado; pendiente de revisión conjunta. Autorización:
bloque secuencial pasos 7/8. Dependencias FE-03 y BE-06 verificadas; spec frontend
FE-AC05/12 y backend DELETE lógico 204 aprobados/versionados antes del código.
Sin staging, commit ni push.

| Criterio                     | Prueba / resultado                                                                                                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AC09: confirmación explícita | `meta-desactivar.test.tsx`: abrir/cancelar/Escape no envían DELETE; foco inicial Cancelar y retorno al disparador.                                                 |
| AC09/11: 204 / conservación  | Confirmación única, sin parsear JSON; GET posterior muestra sin meta, horas/avance/rachas conservados; cierre usa foco alternativo si el disparador desapareció.   |
| Unicidad del envío           | Doble confirmación pendiente no duplica DELETE; Escape bloqueado mientras se procesa.                                                                              |
| FE-AC12                      | DELETE confirmado + GET fallido reintenta únicamente consulta, sin duplicar escritura.                                                                             |
| Error/resultado incierto     | Red o 500 mantienen diálogo e identificador; comprobar estado antes de reintentar; si la meta anterior no está activa no se repite la baja ni se afecta otra meta. |
| Cliente                      | `desactivarMetaApi.test.ts`: DELETE sin cuerpo, 204 sin json(), 400/404/500 con status/requestId.                                                                  |

Se usa dialog nativo con top layer, descripción asociada, Escape/cancel y foco
contenido; sin biblioteca UI. Pruebas jsdom sustituyen únicamente showModal/close;
el comportamiento nativo de navegador se comprobará en la revisión conjunta.

Pruebas primero: **11 fallos** antes de implementar (7 React + 4 servicio),
tras suplir los métodos nativos ausentes en jsdom. Suite frontend completa:
**248/248**, TypeScript aplicación/tests correcto. Prettier aplicado.
Regresión backend disponible sin cambios backend: **165/165 + 161/161** HTTP
temporal y TypeScript correcto, ejecutada en FE-04. No se usa Atlas ni `.env`.

Logs `/tmp/savepoint-fe05-red.log`, `/tmp/savepoint-fe05-directed.log`,
`/tmp/savepoint-fe05-full.log`, `/tmp/savepoint-fe05-types.log`.
El primer intento de regresión tuvo un timeout de beforeEach/RPC del runner
en una prueba previa de rachas (247 pasadas, una fallida); se conserva en
`/tmp/savepoint-fe05-primer-intento.log`. La repetición completa, sin cambiar
tests ni timeouts, terminó con 248/248 y cero errores no controlados.
La meta se conserva históricamente; no hay reactivación ni borrado físico por UI.

Revisión posterior en navegador: se detectó que una apertura programática sin
foco previo podía devolver el foco al body. Se añadió una regresión (falló
primero y pasó tras corregirla) y se captura explícitamente el botón disparador.
La suite específica queda en **8 React + 4 servicio**; bloque final **279/279**.
Escape nativo/retorno de foco comprobados en Chrome real. Logs
`/tmp/savepoint-fe05-foco-red.log` y `/tmp/savepoint-fe05-foco.log`.
