# E2-FE-01 — completar consultas y verificar cierre

12 de noviembre de 2026, America/Guayaquil. Plan conjunto aprobado mediante
«aprobado», después de la auditoría final. Spec frontend §4 ya versionada en
ca734b6 y sus actualizaciones anteriores a 0018a1b. Sin cambio de contrato.

Se añadió consultarMetasApi.test.ts antes del código: **21/21 fallaron** por
ausencia de obtener/activa. Implementación mínima en metasApi.ts reutilizando
solicitar/validadores/baseUrl: GET por ID admite históricas; activa devuelve
meta válida del juego o null explícito. Ambos aceptan señal y codifican segmentos.
No se añade otra consulta a Detalle, que ya recibe progreso.meta.

Verificación del corte: **300/300 frontend**, cero fallos u omitidos, y
`npm run typecheck` aplicación/tests correcto. Las 21 nuevas cubren GET sin
cuerpo, prefijo, IDs, null/históricas, 400/404/500/requestId, red/formato/204,
aborto previo/durante lectura y ausencia de reintentos automáticos.
Logs: /tmp/savepoint-cierre-fe01-red.log, -green.log y -types.log.

La evidencia del panel/carga/vacío/errores/obsolescencia y resumen E1 permanece
en E2-FE-01-panel.md. El cierre y la verificación conjunta del DoD quedan
registrados en E2-cierre-tickets.md, con la regresión final F311/N49 y las
dependencias comprobadas; no se cierra solo por añadir dos métodos.
