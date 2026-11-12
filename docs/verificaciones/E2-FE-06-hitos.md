# E2-FE-06 — gestión y presentación de hitos

Fecha: 12 de noviembre de 2026, America/Guayaquil.

Estado: implementado/verificado, revisión conjunta pendiente. Autorizado en pasos
7/8; dependencias FE-03/04 y BE-07 disponibles y verificadas. Fuentes: frontend
FE-AC06, P04/P05, backend H7 y contrato EditarMeta. Sin staging/commit/push.

| Criterio              | Prueba / resultado                                                                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AC07: de cero a cinco | `hitos.test.tsx`: quinto permitido/sexto bloqueado, repetidos admitidos; descripción trim de 1–120 y porcentaje entero 1–100, siete negativos sin escritura. |
| AC10: identidad       | Renombrar conserva _id, entrada nueva no envía ID; lista modificada completa y quitar todos envía []; editar solo objetivos sigue omitiendo hitos.           |
| H7                    | Lista usa alcanzado del DTO, sin cálculo React ni checkboxes; borrar sesión de máximo 80 deja máximo 30 e hito 75 pendiente tras GET.                        |
| Recuperación          | Error mantiene filas, IDs y valores; detalles de campo asociados a controles.                                                                                |
| E1                    | Logros manuales conservados, sin confundirlos con hitos.                                                                                                     |

Pruebas primero: **14 fallos** antes de componentes/validación; después **14/14**
dirigidas, frontend completo **262/262** y TypeScript aplicación/tests correcto.
Prettier aplicado. Backend permanece sin cambios; regresión de referencia del
bloque **165/165 + 161/161** HTTP con MongoDB temporal; TypeScript correcto.

Nuevos HitosEditor/HitosLista reutilizan tokens, campos/controles accesibles y
estados textuales con SVG. No se introducen librerías, IDs de cliente en POST,
marcado manual ni nuevos endpoints. Revisión de navegador al final del bloque.

Logs `/tmp/savepoint-fe06-red.log`, `/tmp/savepoint-fe06-directed.log`,
`/tmp/savepoint-fe06-full.log`, `/tmp/savepoint-fe06-types.log`.
Los tests React simulan transporte; MongoDB/HTTP reales se verifican en INT-01
y navegador conjunto. No se usa Atlas ni `.env`.
