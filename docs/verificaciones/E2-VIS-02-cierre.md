# E2-VIS-02 — formularios e historial E1

12 de noviembre de 2026, America/Guayaquil. Ejecución del plan conjunto aprobado
mediante «aprobado» para completar los tickets abiertos. Spec frontend P-VIS,
§8 y FE-AC11; DESIGN.md vigente. No se cambia contrato, arquitectura o negocio.

## Tests primero y cambio mínimo

Se añadieron once casos en formularios-historial-visual.test.tsx: cuatro vistas
sin clases legacy, etiquetas, crear/editar con contratos/enums/logros existentes,
error de guardado y borrador, carga/historial/fecha, vacío con acción, reintento
de lectura y catálogo vacío. **Nueve fallaron y dos pasaron** antes del cambio.

Solo App.tsx cambia en producción: tokens/jerarquía/controles/superficies en
FormJuego, FormPartida y ListaPartidas; Estados usa la presentación Nebula
existente para todas las vistas. El historial añade reintento explícito de GET
y acción de registro en vacío. Se conserva confirmación de eliminación y payloads.
La página de ruta inexistente también deja de usar el enlace gamer del marco.
Sin nuevas librerías, fuentes, estilos globales ni cambios de backend.

La primera regresión detectó una aserción heredada que exigía ausencia de alert
en error de carga. Se actualizó para exigir su anuncio accesible, el mensaje de
carga y ausencia de mensaje de guardado/POST. Un primer parche alcanzó por error
el caso de catálogo vacío y produjo dos fallos; se corrigió únicamente esa
aserción, manteniendo los dos escenarios. Otra prueba nueva necesitó consultar
el status vigente después de resolver la carga, no conservar el nodo desmontado.

Resultado: **311/311 frontend**, cero fallos/omisiones; TypeScript aplicación y
tests correcto. Las 32 pruebas nuevas del bloque son 21 de FE-01 y 11 de VIS-02.
No se suman de nuevo las suites dirigidas. Logs /tmp/savepoint-cierre-vis02-red.log,
-directed.log, -green.log, -green2.log y -types.log.

## Verificación real contra DESIGN.md

Chrome 157.0.8103.51, Express real y MongoDB 7.0.24 temporal propio, con
preloads que bloquean .env, Vite configFile/envFile false y base sintética.
Se verificaron biblioteca, nuevo/editar juego, registro de partida, detalle e
historial a **320/375/768/1440 px**. Los 49 escenarios aprobados incluyen 24
comprobaciones de estas vistas y los recorridos funcionales E1/E2 existentes.

| Requisito        | Resultado medido / evidencia                                                                                                                   |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Paleta/contraste | Texto visible mínimo 4,829:1; diez tokens canónicos existentes.                                                                                |
| Tipografía       | Título 32 px, cuerpo/campos 16, ayudas mínimo 14; fallbacks aprobados sin nuevas fuentes.                                                      |
| Componentes      | Controles y enlaces de acción mínimo 44 px; paneles sin sombra, secundarias delineadas y como máximo una primaria por contexto.                |
| Adaptabilidad    | Sin scroll horizontal en las 24 muestras; campos y acciones se adaptan.                                                                        |
| Teclado          | Tab real: foco violeta 3 px y offset 3 px. Diálogo E2 conserva Cancelar/Tab/Escape/retorno.                                                    |
| Estados          | Once tests nuevos y regresiones de carga/error/vacío/recuperación pasan; no se confunde error con ausencia.                                    |
| Movimiento       | Emulación reduce y test de reglas CSS; animaciones GSAP existentes no se cambian.                                                              |
| Regresión E1     | N crea/edita videojuego, género Terror, marca logro, registra/baja partida; comprueba resumen y conservación de meta en Completado/Abandonado. |

Evidencia: /tmp/savepoint-cierre-browser.log y
/tmp/savepoint-cierre-browser/reporte.json, capturas auditoria-*.png.
Se conservan las mediciones iniciales fallidas de la auditoría anterior como
antecedente; no se atribuyen estos resultados a los commits viejos.

Límites aprobados: T4 de duplicados E1 y D1/D2/D3 siguen diferidos. El corte
visual no los corrige ni permite declarar toda regla de interacción de DESIGN
implementada fuera de P-VIS. La prevención de duplicados E2 sigue probada.
Estado definitivo: cerrado bajo el plan conjunto aprobado. El DoD individual
y sus dependencias verificadas están registrados en E2-cierre-tickets.md.
