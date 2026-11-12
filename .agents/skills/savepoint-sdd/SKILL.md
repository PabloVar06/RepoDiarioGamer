---
name: savepoint-sdd
description: Preparar, revisar e implementar specs y tickets de SAVEPOINT mediante desarrollo guiado por especificaciones. Usar para cambios funcionales de E1/E2 o del frontend; configurar el harness no aprueba funcionalidades.
---

# SDD de SAVEPOINT

## Contexto y límites

Leer `AGENTS.md`, `docs/diagnostico.md` y, para cambios visuales, `DESIGN.md`
desde la raíz. Nunca leer ni modificar `.env` ni variantes ni ejecutar herramientas
que los carguen indirectamente. E2 es Metas y rachas según DESIGN.md, que no
acredita una spec funcional aprobada ni define por sí solo todo el PRD.

## Especificar y aprobar

1. Identificar ticket, comportamiento y hallazgos relacionados. Conservar los
   bloqueantes, deuda y diferidos; no corregir estos últimos incidentalmente.
2. Crear o actualizar `docs/specs/<id>.md` usando [spec-template.md](spec-template.md).
   Incluir alcance, exclusiones, contratos, criterios verificables y regresiones E1.
   Para E2 precisar semana y zona horaria, fechas civiles/instantes, metas, hitos,
   rachas y actualización tras cambios de partidas según corresponda al ticket.
   Para frontend vincular criterios a DESIGN.md, accesibilidad y estados de UI.
3. Presentar la spec y solicitar aprobación explícita antes de implementar.
   Un ticket, diseño o autorización para configurar herramientas no bastan.
   Registrar fecha, alcance y referencia al mensaje de aprobación; nunca inventarla.
   Cambios materiales de alcance o criterios requieren nueva aprobación.

## Implementar y verificar

4. Comprobar aprobación y resolver primero bloqueantes del flujo dentro de una
   spec que los incluya. Mantener las capas existentes y el prefijo `/api`.
5. Implementar solo el ticket aprobado y sus pruebas de aceptación/regresión.
   Si falta información crítica, avanzar en documentación independiente y aclararla.
6. Ejecutar tests antes de cerrar tickets, con datos sintéticos y configuración
   aislada que no cargue `.env`. Si falta suite del área, añadirla en el alcance
   aprobado. Tests del harness y typecheck no sustituyen tests del producto.
7. Registrar criterio → prueba → resultado, comandos, limitaciones y diff.
   Sin evidencia suficiente mantener pendiente el ticket. En frontend verificar
   móvil/escritorio, teclado, contraste y estados de carga/error/vacío/éxito.
8. Presentar el resultado; no hacer commit ni desplegar sin instrucción explícita.

Consultar `docs/harness.md` en la raíz para hooks y compatibilidad.
