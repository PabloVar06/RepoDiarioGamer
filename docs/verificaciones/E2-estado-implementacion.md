# E2 — estado de implementación y plan incremental

Fecha: 12 de noviembre de 2026, America/Guayaquil.

Estado: revisión documental del plan aprobado mediante «Plan aprobado», después
del diagnóstico de la interfaz todavía E1. Este primer corte actualiza estados
y trazabilidad. No implementa funcionalidades, no cierra tickets y no autoriza
staging, commit ni push. Los siguientes cortes requieren su plan concreto.

Fuentes: [PRD](../prd/savepoint.md), [épicas](../backlog/epicas.md),
[backlog](../backlog/E2-metas-y-rachas.md), [diagnóstico](../diagnostico.md),
[spec backend](../specs/E2-backend.md), [spec frontend](../specs/E2-frontend.md)
y [DESIGN.md](../../DESIGN.md). Corte Git: **0fedabd**.

## Resultado comprobado

La interfaz aún renderiza E1: [App.tsx](../../frontend/src/App.tsx) no importa ni
usa metasApi; Detalle solo consulta videojuego, partidas y resumen acumulado.
No existen todavía los directorios de componentes/hooks/pages previstos para E2.
Crear tipos, servicios o tokens no satisface la aceptación de esas pantallas.

| Área / tickets  | Código real y evidencia                                                                                                     | Falta para completar el flujo                                                                                    |
| --------------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| HAB-01 / HAB-05 | Runners aislados y base API común. HAB-01 cerrado explícitamente; HAB-05 verificado, cierre pendiente.                      | No sustituyen las pruebas de aceptación de cada funcionalidad E2.                                                |
| HAB-03/04/06    | Helpers de lectura/calendario en fechas.ts; registro y formulario Partida todavía E1.                                       | Escritura civil estricta, selector solo fecha/presentación sin desfase y recuperación del formulario tras error. |
| BE-01           | progreso.service.ts, progreso.calculos.ts, fechas.ts y controlador/ruta de progreso; unitarias y HTTP temporal registrados. | Dependencia HAB-03 y revisión del DoD; no contiene rachas.                                                       |
| BE-03/05/06/07  | Meta.model.ts y capas metas; índice único parcial, CRUD lógico, hitos y cálculo de cumplimiento/avance.                     | Contrato negativo T3, dependencias y revisión de cierre; integración/cascada a Meta pendiente en INT-01.         |
| BE-02           | Spec y planificación; sin implementación.                                                                                   | Funciones puras, servicio, controlador y GET /api/rachas; rachaActual/mejorRacha globales y sus pruebas.         |
| FE-01           | metasApi.ts, tipos.ts y 42 tests de servicio; solo metasApi.progreso.                                                       | Hook, carga parcial, progreso visible, estados e integración con Detalle; HAB-04 sigue pendiente.                |
| FE-02–06        | Spec aprobada; sin componentes renderizados ni métodos de cliente correspondientes.                                         | Rachas, crear/editar metas, confirmación de desactivación, editor/lista de hitos y tests UI.                     |
| VIS-01          | index.css, tailwind.config.cjs y cinco tests de tokens; revisión de navegador limitada registrada.                          | Revisión de cierre y recursos tipográficos; no acredita actualización de pantallas.                              |
| VIS-02/03       | Spec visual aprobada; vistas todavía con clases E1.                                                                         | Adaptar cada vista/componente, conservando sus funciones, y verificar accesibilidad/estados.                     |
| INT-01/03/04    | Regresión E1 y cálculos backend ya aportan evidencia parcial.                                                               | Reconsulta React tras mutaciones, cascada a Meta, cambio de periodo y aceptación completa AC01–AC13.             |

Los 23 IDs y sus estados individuales o agrupados figuran en el
[backlog §13](../backlog/E2-metas-y-rachas.md#13-estado-actual-y-siguiente-paso).
Solo HAB-01 tiene cierre explícito acreditado; los otros 22 siguen abiertos.

Archivos de pruebas reales para contrastar los resultados: backend
[fechas](../../backend/tests/fechas.test.ts),
[progreso puro](../../backend/tests/progreso.test.ts),
[validadores de metas](../../backend/tests/metas.test.ts),
[CRUD HTTP](../../backend/tests/integration/metas.crud.test.ts) y
[progreso HTTP](../../backend/tests/integration/progreso.http.test.ts);
frontend [cliente](../../frontend/src/api/metasApi.test.ts),
[estados E1](../../frontend/tests/base.test.tsx) y
[tokens](../../frontend/tests/tokens.test.ts). No existen todavía los tests de
interacción E2 que figuran como archivos previstos en la spec frontend.

## Diseño y contratos preservados

- Los diez colores, espaciado, radios y reglas globales están declarados como
  tokens. Las variables `--legacy-gamer-*` y sombras antiguas siguen activas
  para las vistas E1. Layout usa `bg-gamer-surface text-white`, un panel
  `bg-[#262425]`, acentos gamer y gradientes; cubre el fondo Nebula del body.
  Tamaños y pesos antiguos también requieren adaptación por vista.
- Orbitron/Poppins están en las pilas CSS, pero no se acredita que estén
  cargadas. La evidencia de navegador registró Helvetica/Arial; no certifica
  tipografía final. Nebula requiere licencia y recurso verificados. No se
  autoriza incorporar librerías UI o fuentes sin revisar sus condiciones.
- Contrato aprobado y existente: `minutosObjetivo` entero de 1–6000 y
  GET `/api/videojuegos/:id/progreso`. Horas son entrada/presentación conforme
  a P05. GET `/api/videojuegos/:id/resumen` conserva su contrato E1.
- PA01 permanece abierto: falta la ficha original para cotejar los ocho huecos
  y los nombres `horasSemanales` y `/progreso-semanal` citados. DESIGN.md usa
  horasSemanales como etiqueta visual; no sustituye el contrato técnico ni
  demuestra qué exige el enunciado ausente. No se crean alias ni migraciones.
- H1–H9 y PA02–PA07 conservan sus decisiones aprobadas. En particular, rachas
  globales sobre todo el historial, metas en juegos Completado/Abandonado y
  actividad/avance/rachas visibles sin meta siguen siendo requisitos.

## Evidencia y límites de la verificación

Los siguientes son **resultados históricos registrados**, cotejados con sus
documentos y archivos. No se han vuelto a ejecutar suites del producto ni una
revisión de navegador en este corte documental. No se suman suites sucesivas
como si fueran pruebas diferentes.

| Corte / fuente                           | Resultado registrado                                                                                        | Límite                                                                                                    |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| [Backend progreso](E2-BE-01-progreso.md) | 115/115 unitarias/base y 119/119 integraciones; sin fallos/omisiones; TypeScript aplicación/tests correcto. | Rachas, escritura civil y UI no cubiertas. Las 119 incluyen dos caracterizaciones de T3.                  |
| [CRUD previo](E2-BE-03-crud.md)          | 82/82 y 107/107 antes del corte de progreso.                                                                | Sus pendientes de cálculo se contrastan con la evidencia posterior, sin reescribir el registro histórico. |
| [Cliente FE-01](E2-FE-01-servicio.md)    | 92/92: 50 previas + 42 del servicio; TypeScript correcto.                                                   | Sin componentes ni pruebas UI E2.                                                                         |
| [Base VIS-01](E2-VIS-01.md)              | 97/97: las 92 anteriores + 5 de tokens; TypeScript correcto; nueve casos de navegador registrados.          | Evidencia de tokens y vistas existentes, no aceptación de VIS-02/03. Fuentes reales de respaldo.          |

La integración backend registrada usó exclusivamente mongodb-memory-server-core
10.2.3 con MongoDB 7.0.24 temporal. La evidencia de progreso conserva IP
127.0.0.1, puerto, base exclusiva, PID hijo y dbPath comprobados antes de
escrituras, y cierre/limpieza verificados. No se usa Atlas como alternativa.
Este corte documental no inicia ni conecta ninguna base y no accede a `.env`.

T3 sigue pendiente: JSON malformado/escalares rechazados por el parser producen
500 sin requestId. Que las pruebas de caracterización pasen no satisface el
contrato futuro 400/413. T1/T2/T4/T5 y D1–D3 siguen visibles en diagnóstico y
backlog; el aislamiento de tests o el cliente nuevo no cierran la deuda general.
La cascada E1 elimina Partida, pero todavía no elimina Meta al borrar Videojuego.

## Trazabilidad Git

| Commit            | Hecho y alcance                                                                                                                  |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 873d26f           | PRD, épicas y backlog antes de la implementación auditada.                                                                       |
| ca734b6           | Primeras specs BE/FE y base HAB-01 en el mismo commit: excepción histórica, sin precedencia documental separada para ese código. |
| b67caa4 / 25d1daf | Ampliación y cierre aprobado de HAB-01, con specs ya versionadas.                                                                |
| 1e528cb           | HAB-05 y evidencia; cierre pendiente.                                                                                            |
| 03f8564           | Modelo Meta y actualización documental en el mismo commit; contrato de modelo/índice ya presente en ca734b6.                     |
| a6663ff           | CRUD y progreso backend, después de las specs y su actualización.                                                                |
| db3efbe           | Servicio/tipos FE-01, sin integración React.                                                                                     |
| 0fedabd           | Base VIS-01, sin adaptación de componentes.                                                                                      |

La existencia de un commit no equivale a cierre. No se reescribe historial ni se
inventa un commit de spec anterior a HAB-01. Cambios nuevos de reglas/contratos
exigen aprobación y versionado de la spec antes del código que los implemente.

## Plan incremental aprobado

El orden conserva las dependencias del backlog. No se autoriza ejecutar todos
los tickets juntos; cada corte presenta su plan concreto antes de modificar
código y registra tests → implementación mínima → verificaciones → revisión.

1. **Regularización documental (este corte):** estados, evidencia, matriz y
   trazabilidad; PA01 sigue pendiente sin cambiar contratos. Presentar revisión.
2. **HAB-03 → HAB-04 → HAB-06:** escritura civil backend, selector/presentación
   frontend y recuperación del formulario, por separado y con regresiones E1.
   Revisar también el cierre pendiente de HAB-05 antes de integrar sus flujos.
3. **VIS-02 por vistas**, tras sus dependencias: layout/navegación/biblioteca,
   después formularios e historial; sin nuevas funciones ni refactor general.
4. **Completar FE-01:** extracción mínima de Detalle, hook y panel de actividad,
   horas/días/avance, carga/error/vacío y ausencia de meta, conservando resumen
   E1. No presentar botones de acciones todavía no implementadas.
5. **BE-02 → FE-02:** pruebas puras/HTTP de rachas globales con reloj controlado;
   después consumo/presentación React de racha actual y mejor racha.
6. **FE-03:** cliente POST y formulario de creación, validación, errores
   recuperables y prevención de envíos duplicados. Revisar antes de aceptar
   el flujo los negativos de T3 y la cascada a Meta de INT-01. T3 requiere su
   criterio, plan acotado y aprobación antes de corregirse; no se arregla aquí.
7. **FE-04 → FE-05 → FE-06**, cada uno por separado: edición; confirmación de
   desactivación; editor/lista de hasta cinco hitos con estado derivado.
8. **INT-01 incremental** con cada flujo: reconsulta tras mutaciones y cascada
   a Meta con MongoDB temporal. **INT-03** después de FE-01/02/03: cambio de
   día de Guayaquil, foco/visibilidad y limpieza de efectos, sin polling.
9. **VIS-03 por componente** desde cada corte React, consolidando solo al cumplir
   todas sus dependencias. **INT-04** reúne AC01–AC13 y revisión de navegador
   móvil/escritorio, teclado, contraste y estados; no posterga tests al final.

No hay autorización adicional para una refactorización completa T1/T2 ni para
corregir T4 en formularios E1. El objetivo de corregir al menos dos deudas sigue
pendiente de seleccionar/aprobar sus cortes; los candidatos T3/T4 no se declaran
resueltos. No se incluyen tienda, descargas, reseñas, rankings, notificaciones
ni gráficos históricos.

## Verificaciones de este corte documental

| Comprobación ejecutada                                                   | Resultado                                                                                                                                         |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Comparación semántica con la copia previa a los cambios, mediante Python | Tablas aprobadas de PRD/épicas/specs intactas; historias, dependencias y DoD del backlog intactos; criterios AC01–AC13 y métodos preservados.     |
| Cobertura de estados contra los IDs del backlog                          | 23 IDs, cada uno representado una vez en la primera columna de la tabla de estados; un cerrado y 22 abiertos.                                     |
| Validación de enlaces y anclas locales en los siete documentos           | 92 enlaces comprobados; sin destinos ni anclas faltantes. Se actualizó el enlace histórico de FE-01 al encabezado corregido de contratos backend. |
| Prettier `--check` sobre los siete documentos del corte                  | Correcto tras aplicar formato; sin cambios de aplicación.                                                                                         |
| `git diff --check` y revisión de rutas modificadas                       | Correcto; únicamente Markdown bajo docs/.                                                                                                         |
| `git diff --cached --quiet`                                              | Correcto: staging vacío. Sin commit ni push.                                                                                                      |

Estas verificaciones no cierran tickets funcionales ni sustituyen tests,
TypeScript o revisión de navegador al implementar el próximo corte.
