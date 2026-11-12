# Backlog de épicas — SAVEPOINT

Fecha: 11 de noviembre de 2026.

Estado: planificación para revisión. H1–H9 aprobados en conversación; ningún
ticket de implementación se considera aprobado, iniciado ni terminado por crear
este backlog. No se ha realizado commit de estos documentos.

Fuentes: [PRD](../prd/savepoint.md), [diagnóstico](../diagnostico.md) y
[DESIGN.md](../../DESIGN.md). Los identificadores H, AC y PA corresponden al PRD.

## E1 — Diario de progreso gamer existente

**Resultado a preservar:** biblioteca y CRUD de videojuegos, logros manuales,
registro e historiales de partidas, eliminación con confirmación/cascada y
resumen acumulado. Este resumen conserva cantidad, horas a dos decimales,
última fecha, máximo avance y valores vacíos; no se sustituye por E2.

**Estado:** funcionalidad existente inspeccionada, con defectos documentados;
no se certifica como libre de errores ni cubierta por tests del producto.

Los siguientes trabajos son habilitantes para E2 y no nuevas funcionalidades de E1:

| ID    | Trabajo previsto                                                                               | Aceptación prevista                                                                                                              | Dependencias                                                                                   |
| ----- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| E1-01 | Infraestructura mínima de pruebas del producto, con base/datos aislados y sin carga de `.env`. | Poder ejecutar regresiones y pruebas de contratos/cálculos; los tests del harness se mantienen separados.                        | B5; adelantar solo lo indispensable de T5 si impide el aislamiento.                            |
| E1-02 | Contrato y visualización de fechas civiles.                                                    | Seleccionar día local de inicio; guardarlo/mostrarlo sin desfase; conservar toda la duración en ese día aunque cruce medianoche. | B1, B2; H1/H3; PA02/PA07 en la parte afectada; E1-01.                                          |
| E1-03 | Coherencia de URL base y prefijo API.                                                          | Peticiones de clientes al `/api` correcto en el entorno validado; documentación coherente.                                       | B3; E1-01.                                                                                     |
| E1-04 | Recuperación del formulario de partidas tras errores.                                          | Error visible con datos y formulario disponibles para corregir/reintentar.                                                       | B4; E1-01.                                                                                     |
| E1-05 | Evidencia de regresión de E1.                                                                  | Escenarios AC13 y reglas existentes ejecutados; máximo avance, resumen vacío, logros y cascada conservados.                      | Se actualiza durante E1-02/03/04 y E2; no es una excusa para postergar pruebas hasta el final. |

**Cierre de E1 en esta entrega:** los habilitantes necesarios al flujo están
resueltos y probados y no se detectan regresiones en la suite acordada. No exige
resolver toda la deuda del diagnóstico ni declara cerrada la evolución de E1.

## E2 — Metas semanales, hitos y rachas globales

**Problema:** el resumen acumulado de E1 no expresa un objetivo de horas/días
por semana ni la continuidad entre juegos.

**Resultado:** una meta activa por videojuego, progreso semanal por juego,
hitos basados en su avance acumulado y rachas globales del historial completo,
incluso sin meta. Juegos completados o abandonados siguen admitiendo metas.

**No-alcance:** tienda, descargas, rankings, notificaciones, gráficos históricos,
cuentas, edición de partidas y rediseño completo de E1 sin spec separada.

| ID    | Trabajo previsto                                                            | Reglas y aceptación                                                                                                                            | Dependencias / puntos por resolver                                                                                                        |
| ----- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| E2-01 | Modelo y contratos de creación, edición y desactivación de metas por juego. | H5/H6/H9; AC07–AC09 y AC12; una meta activa, objetivos válidos, confirmación de desactivación y estados de juego permitidos.                   | E1-01; PA03/PA04/PA05; diseñar el contrato sin fijar rutas/persistencia en esta fase.                                                     |
| E2-02 | Cálculo de horas, días y cumplimiento de la semana actual por juego.        | H1/H2/H3/H6/H8; AC01–AC04, AC08 y AC11; comparar sin redondear y separar horas, días y avance.                                                 | E1-01/02; contrato de E2-01 para metas; PA02/PA05. Los valores observados deben funcionar también sin meta.                               |
| E2-03 | Racha actual y mejor racha globales.                                        | H4/H8/H9; AC04–AC06 y AC12; fechas únicas de cualquier juego, cierre del día sin actividad y recálculo retroactivo/por eliminación.            | E1-01/02; PA02/PA07; independiente de que exista una meta.                                                                                |
| E2-04 | Estado automático de hitos según máximo avance E1.                          | H5/H7; AC07/AC10; alcanzar y volver a pendiente si el máximo se reduce; no alterar logros manuales.                                            | E1-01; E2-01; PA04 y regresión del resumen E1.                                                                                            |
| E2-05 | Spec e integración del frontend conforme a Nebula Arcade.                   | H1–H9; AC03/AC09/AC11–AC13; conservar resumen E1, etiquetar rachas globales, mostrar indicadores sin meta y evitar envíos duplicados de metas. | Aprobar primero la spec del frontend; E1-03/04; contratos E2-01/02/03/04; PA05/PA06.                                                      |
| E2-06 | Validación integrada y evidencia de aceptación.                             | Ejecutar AC01–AC13 y casos negativos de las specs; registrar resultados, condiciones, limitaciones y regresiones E1.                           | Los tickets previos aportan sus tests desde el inicio; completar integración al disponer de todos los flujos y resolver los PA afectados. |

### Secuencia propuesta

1. Revisar PRD/backlog y cerrar puntos abiertos de los tickets próximos.
2. Preparar y aprobar specs de habilitantes E1; incorporar pruebas antes de
   implementar los flujos afectados.
3. Aprobar specs de contratos y cálculos E2. Las rachas globales pueden avanzar
   sin depender de metas una vez resuelto el contrato de fechas.
4. Aprobar la spec del frontend antes de aplicar cualquier cambio visual.
5. Completar integración, ejecutar aceptación y presentar evidencia para revisión.

No se asignan responsables, fechas de entrega ni estimaciones inventadas.

## Registro de decisiones y trazabilidad

| Decisión                                                                        | Trabajo que debe conservarla  |
| ------------------------------------------------------------------------------- | ----------------------------- |
| H1: lunes–domingo, Ecuador continental y fecha civil.                           | E1-02, E2-02/03/05.           |
| H2: suma precisa y porcentaje real mayor de 100 %.                              | E2-02/05.                     |
| H3: días distintos, horas y días, y atribución al día local de inicio.          | E1-02, E2-02/05.              |
| H4: rachas globales, cierre diario y recálculo del historial existente.         | E2-03/05/06.                  |
| H5: una meta activa y límites, con incrementos de un minuto.                    | E2-01/02/04/05.               |
| H6: actividad previa de la semana, edición y desactivación sin borrar partidas. | E2-01/02/05.                  |
| H7: hitos automáticos sobre máximo avance E1.                                   | E2-04/05 y regresiones E1-05. |
| H8: horas/días del juego, avance E1 y rachas globales sin meta.                 | E2-02/03/05.                  |
| H9: metas permitidas en juegos completados/abandonados.                         | E2-01/05.                     |

## Deuda y diferidos que siguen visibles

La fuente detallada sigue siendo [docs/diagnostico.md](../diagnostico.md).
Crear este backlog no borra ni reclasifica automáticamente sus hallazgos.

| ID  | Tema                                            | Decisión de planificación                                                                                     |
| --- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| T1  | Organización de App.tsx.                        | Posterior; extraer solo lo indispensable dentro de una spec aprobada, sin refactorización general incidental. |
| T2  | Cliente HTTP duplicado y contexto de errores.   | Posterior; no confundir con la corrección puntual B3.                                                         |
| T3  | Parser JSON y orden de observabilidad.          | Posterior; adelantar únicamente si los criterios negativos del contrato lo requieren, dejando constancia.     |
| T4  | Duplicados por envíos de formularios E1.        | Posterior en E1; los nuevos formularios de metas sí deben prevenirlos según DESIGN.md.                        |
| T5  | Acoplamiento de configuración.                  | Posterior salvo la porción necesaria para probar sin `.env`.                                                  |
| D1  | Descripciones/identidad de logros E1.           | Diferido; los hitos E2 son otra funcionalidad y no autorizan corregirlo incidentalmente.                      |
| D2  | Respuestas de búsqueda fuera de orden.          | Diferido; no es parte de metas/rachas.                                                                        |
| D3  | Atomicidad de cascada y rendimiento/paginación. | Diferido; preservar comportamiento y evaluar solo si un requisito nuevo exige reclasificar.                   |

## Condiciones para empezar y cerrar tickets

Antes de implementar debe existir una spec aprobada en `docs/specs/` con alcance,
contratos, decisiones PA relevantes y criterios comprobables. La aprobación
de H1–H9 y de este PRD no sustituye esa spec.

Antes de cerrar: ejecutar tests del producto correspondientes, verificar cada
criterio, revisar regresiones E1 y, cuando aplique, verificar DESIGN.md en móvil,
escritorio, teclado y estados de carga/error/vacío/éxito. Registrar comandos,
resultados y limitaciones. Ningún ticket se cierra solo con tests del harness.

Esta fase entrega únicamente documentos para revisión. No implementa tickets,
no cambia frontend/backend ni permite commit o push automático.
