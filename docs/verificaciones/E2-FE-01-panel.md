# E2-FE-01 — panel semanal en el detalle

Fecha: 12 de noviembre de 2026, America/Guayaquil.

Estado: implementado y verificado automáticamente; revisión visual conjunta y
revisión del usuario pendientes. Autorizado en el bloque de pasos 4–6 y ampliación
«Autorizado» para sus dependencias. Sin staging, commit ni push.

Fuentes: [frontend §§3–6, FE-AC02/03/08/09/12](../specs/E2-frontend.md),
[backlog FE-01](../backlog/E2-metas-y-rachas.md), [DESIGN](../../DESIGN.md).
Las dependencias HAB-01/04/05 y BE-01 tienen implementación y evidencia previa;
no se inventa su cierre administrativo. [Dependencias FE-03](E2-dependencias-FE-03.md)
verificadas antes de este corte. Especificaciones versionadas antes del código.

Se extrajo únicamente Detalle de App.tsx a `pages/DetalleVideojuego.tsx`.
Se conserva biblioteca, rutas, resumen acumulado E1, logros manuales, registro,
historial, confirmación y eliminación de partidas. La página extraída y los
nuevos componentes usan los tokens existentes; no cambian estilos globales.

| Criterio                               | Prueba / resultado                                                                                                                                                       |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AC01/02/04/11: actividad sin meta      | `tests/progreso.test.tsx`: 90 minutos, 1,5 h, un día, avance acumulado, semana y ausencia de meta; ceros reales y vacío sin error.                                       |
| AC03 / FE-AC02: horas y días distintos | 140 % con barra accesible 100 y meta pendiente si faltan días; valores próximos a 100 muestran `<100 %`/`>100 %`, sin cambiar decisión backend.                          |
| FE-AC12: carga/error independientes    | Consulta pendiente o fallida no oculta resumen E1; reintento solo GET de progreso.                                                                                       |
| FE-AC09: obsolescencia                 | Cambio de juego, recarga fuera de orden y desmontaje cancelan/descartan respuestas anteriores.                                                                           |
| AC13 / INT-01 incremental              | Borrar una partida conserva confirmación y reconsulta historial/resumen/progreso; logros siguen funcionando; juego inexistente no ofrece crear meta.                     |
| DESIGN                                 | Superficies/tipografía/tokens, barra limitada y texto numérico, avisos accesibles, controles 44 px. Comprobación real de navegador se consolidará al terminar el bloque. |

Pruebas primero: los diez casos iniciales fallaron antes del panel; luego se
añadieron tres verificaciones de obsolescencia/logros. La regresión HAB-06
necesitó simular la nueva consulta GET, manteniendo sus aserciones de recuperación.

Comandos frontend: `npm test` **163/163**, cero fallos; `npm run typecheck`
correcto para aplicación/tests. Logs `/tmp/savepoint-fe01-red.log`,
`/tmp/savepoint-fe01-full.log`, `/tmp/savepoint-fe01-types.log`.
Regresión backend disponible en este bloque: **146/146** base y **153/153**
integración local de sus dependencias; backend no cambió durante FE-01.

Límites: no hay botones de edición/desactivación ni hitos nuevos. La invitación
a crear es textual hasta FE-03. Rachas corresponden al siguiente corte;
la actualización por día/foco/visibilidad sigue en INT-03. No se declara cerrado
FE-01 ni VIS-03 por esta evidencia automatizada parcial del bloque.

## Verificación conjunta posterior

La [evidencia del bloque](E2-bloque-progreso-rachas-creacion.md) añade revisión
real de navegador con Express y MongoDB temporal, contraste, teclado y cuatro
anchos, además de la regresión final. Los resultados anteriores corresponden
al corte individual; el ticket sigue pendiente de revisión del usuario.
