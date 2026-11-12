# PRD — SAVEPOINT: E1 y E2

Fecha: 11 de noviembre de 2026.

Estado: **PRD y decisiones H1–H9 aprobados en conversación**. Las specs
[backend](../specs/E2-backend.md) y [frontend](../specs/E2-frontend.md) también
están aprobadas y versionadas. Cada ticket requiere además su plan aprobado;
la aprobación documental no acredita implementación ni cierre.

## Fuentes y aprobación

- [README](../../README.md): comportamiento existente de E1.
- [Diagnóstico](../diagnostico.md): bloqueantes, deuda y problemas diferidos.
- [DESIGN.md](../../DESIGN.md): fuente de verdad visual Nebula Arcade.
- Conversación de Fase 3: el usuario aprobó H1, H2, H5, H6 y H7; corrigió H3,
  H4 y H8 y añadió H9. Después aprobó la redacción consolidada con «Aprobado».
  Esta aprobación incluye rachas globales, día local de inicio, indicadores sin
  meta, metas en juegos completados/abandonados e incrementos de un minuto.
- Aprobación posterior de ambas specs: «Si esta bien los specs estan aprobados».
  Las resoluciones PA02–PA07 quedan recogidas en los contratos aprobados; PA01
  conserva únicamente el cotejo académico externo pendiente.
- Estado de tickets, matriz criterio → verificación y precedencia en Git:
  [backlog, secciones 13–15](../backlog/E2-metas-y-rachas.md#13-estado-actual-y-siguiente-paso).

No se encontró una ficha de hechos independiente ni la lista académica original
de ocho huecos. H1–H8 son los identificadores de trabajo discutidos y aprobados
en la conversación; H9 es la regla adicional del usuario. No se afirma que esta
numeración haya sido contrastada con un enunciado externo.

## Problema

E1 permite conocer qué juegos tiene la persona, qué partidas registró y cuánto
ha avanzado. Su resumen acumulado no expresa un objetivo semanal ni permite
ver la continuidad de juego entre distintos videojuegos. E2 añade una referencia
de horas y días por semana, hitos de avance y rachas globales sin sustituir E1.

## Usuario

Persona que mantiene su diario de videojuegos y registra manualmente las
partidas. Necesita comparar su actividad semanal con una meta y reconocer
continuidad aunque cambie de videojuego. No se introducen cuentas, roles,
autenticación ni separación de historiales por usuario en esta entrega.

## Objetivo y métrica de éxito

Permitir configurar una meta por videojuego, consultar su progreso semanal y
ver rachas globales calculadas de forma consistente con las fechas locales.

La métrica de aceptación propuesta para la entrega es **100 % de los escenarios
de aceptación acordados ejecutados y aprobados, y ninguna regresión detectada
en E1 dentro de la suite definida**. Se registrarán casos aprobados/ejecutados,
fallos y limitaciones. Este objetivo todavía no está verificado: los tests del
harness no son pruebas del producto. No se introduce telemetría ni se promete
una mejora cuantificada de hábitos sin datos de uso.

## Alcance: distinguir E1 de E2

| Área       | E1 — existente, debe conservarse                                                                              | E2 — nueva funcionalidad                                                                    |
| ---------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Biblioteca | Buscar por nombre y crear, editar, consultar o eliminar videojuegos; conservar enums.                         | Permitir metas independientemente del estado del videojuego.                                |
| Partidas   | Registrar y consultar sesiones; eliminarlas con confirmación; eliminar partidas asociadas al borrar un juego. | Usarlas como fuente de horas/días semanales y rachas globales.                              |
| Progreso   | Resumen acumulado: cantidad, horas totales, última partida y máximo avance de las partidas existentes.        | Añadir progreso semanal y cumplimiento de horas y días sin reemplazar ese resumen.          |
| Objetivos  | Logros embebidos que se marcan/desmarcan manualmente.                                                         | Meta semanal con hasta cinco hitos de avance calculados. Los hitos no son logros manuales.  |
| Constancia | Sin rachas implementadas.                                                                                     | Racha actual y mejor racha global sobre todos los juegos y fechas de partidas existentes.   |
| Interfaz   | Conservar navegación y comportamientos funcionales existentes.                                                | Formularios e indicadores según DESIGN.md, bajo una spec de frontend aprobada por separado. |

Antes de ampliar cada flujo se resolverán sus bloqueantes B1–B5. No se declaran
resueltos por aprobar este PRD ni por haber configurado el harness.

## No-alcance

- Tienda, descargas, rankings, notificaciones y gráficos históricos.
- Lista de deseos, reseñas, funciones sociales y seguimiento automático de sesiones.
- Autenticación, roles, cuentas y selección de zona horaria por usuario.
- Captura de horas de inicio/fin o división automática de partidas entre fechas.
- Edición de partidas, aún no disponible en E1.
- Reportes de cumplimiento de semanas anteriores, versiones históricas de metas
  o recompensas por rachas. Calcular la mejor racha sí utiliza el historial existente.
- Migraciones silenciosas de fechas antiguas, sustitución de arquitectura,
  incorporación de librerías de UI o correcciones incidentales de deuda/diferidos.
- Implementar el rediseño completo de E1 sin una spec de frontend que lo incluya.

## Reglas aprobadas H1–H9

| ID  | Regla y alcance aprobado                                                                                                                                                                                                                                                                                 |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H1  | Semana de lunes a domingo según `America/Guayaquil`. La fecha de partida es un día civil; almacenarla a medianoche UTC no debe cambiar el día visible.                                                                                                                                                   |
| H2  | Por videojuego, sumar todos los minutos de partidas de la semana. Calcular con valores sin redondear y redondear únicamente al presentar. El porcentaje de horas puede superar 100 %; la barra se limita visualmente a 100 %.                                                                            |
| H3  | Una fecha distinta con una o más partidas del juego cuenta como un día jugado. Cumplir la meta exige horas y días. Una partida que cruza medianoche pertenece íntegramente al día local en que comenzó.                                                                                                  |
| H4  | La racha es global, con fechas únicas de partidas de cualquier videojuego, tenga o no meta y sea cual sea su estado. La racha actual se mantiene durante el día si la última actividad fue ayer; se rompe al terminar un día sin actividad. Mejor racha: mayor secuencia de todo el historial existente. |
| H5  | Máximo una meta activa por videojuego. Horas semanales mayores que 0 y hasta 100, en incrementos equivalentes a un minuto; días objetivo enteros de 1 a 7; entre cero y cinco hitos.                                                                                                                     |
| H6  | La meta vigente se aplica a todas las partidas de la semana actual, incluso anteriores a su creación. Editar recalcula. Desactivar exige confirmación y conserva partidas; crear otra no puede acumular metas activas.                                                                                   |
| H7  | Cada hito tiene descripción y porcentaje objetivo de 1 a 100. Está alcanzado cuando el máximo avance acumulado de E1 es mayor o igual a su objetivo. Es automático y distinto de un logro manual.                                                                                                        |
| H8  | Sin meta activa se muestran horas/días semanales del juego, avance acumulado de E1 y rachas globales. Se invita a crear meta. El porcentaje de cumplimiento de horas de una meta es no aplicable, no 0 %.                                                                                                |
| H9  | Un juego Completado o Abandonado puede conservar, crear y editar una meta activa. Cambiar el estado del juego no la desactiva automáticamente.                                                                                                                                                           |

### Fechas y semana

El usuario selecciona solo la fecha local de inicio, con contrato `YYYY-MM-DD`.
No se añaden campos de hora. Si la sesión cruza de domingo a lunes, toda su
duración se atribuye al domingo y a la semana que termina ese día.

Para saber qué día es hoy y qué semana corresponde se usa `America/Guayaquil`,
independientemente de la zona del servidor o navegador. Las fechas civiles
ya guardadas como medianoche UTC se muestran conservando su día UTC; convertir
esa medianoche a hora ecuatoriana provocaría el desfase que B2 debe corregir.

### Progreso semanal y avance acumulado

- `minutosSemana`: suma de duración de las partidas del juego en la semana.
- `horasSemana`: `minutosSemana / 60`.
- `diasJugados`: cantidad de fechas distintas del juego dentro de la semana.
- `minutosObjetivo`: objetivo semanal expresado en minutos enteros, de 1 a 6000.
  La representación de entrada/salida en horas se precisará en la spec del contrato.
- `porcentajeHoras`: `minutosSemana / minutosObjetivo × 100`, solo con meta activa.
- `metaCumplida`: hay meta activa y se alcanzan tanto minutos como días objetivo.
- `porcentajeAvanceActual`: máximo porcentaje de las partidas existentes del juego,
  o 0 si no hay partidas, conservando la regla de E1.

No confundir porcentaje de horas semanales con porcentaje de avance del juego.
Tampoco confundir días jugados del juego con días de la racha global. Los
indicadores se calculan con los registros existentes, no con valores congelados
cuando se alcanzaron por primera vez.

### Rachas globales y recálculo

Se unifican las fechas de todas las partidas de todos los juegos. La racha
actual es la secuencia consecutiva que termina hoy o ayer; si la última actividad
es anterior a ayer, es 0. Sin partidas, ambas rachas son 0. La mejor racha es la
mayor secuencia existente y no depende de tener metas activas.

Al añadir partidas retroactivas o eliminar partidas se recalculan las rachas.
Eliminar un juego y sus partidas también puede reducir la mejor racha. En caso
de eliminar una partida cuando hay otra del mismo día, ese día sigue contando.
No es necesario persistir una operación programada a medianoche: la spec deberá
garantizar que el valor consultado corresponde al día local vigente.

La pantalla debe presentar los indicadores actualizados tras registrar/eliminar
partidas. La actualización con pantalla abierta se rige por P06 de la spec
frontend aprobada, sin añadir notificaciones; su ejecución corresponde a INT-03.

### Metas, hitos y estados de interfaz

Crear una meta a mitad de semana cuenta toda la actividad de esa semana. Los
hitos consultan todo el avance acumulado del juego, no solo esa semana. Una
edición de objetivo cambia inmediatamente el cálculo de cumplimiento actual.
Desactivar no borra las partidas ni las rachas; no se exige una vista histórica
de metas inactivas en esta entrega.

En el detalle se conserva el resumen E1 y se añade progreso semanal. Las rachas
se identifican como globales. Los estados sin datos deben distinguir ausencia
de partidas de ausencia de meta. Formularios con validación comprensible,
prevención de envíos duplicados y estados de carga/error/éxito según DESIGN.md.
La resolución aprobada PA03 conserva metas inactivas sin reactivación ni una
vista histórica; el contrato canónico se mantiene en la spec backend.

## Escenarios de aceptación para convertir en pruebas

| ID   | Escenario y resultado esperado                                                                                                                                                                                 | Reglas    |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| AC01 | Una fecha `2026-11-15` se guarda y muestra como 15/11. Una sesión que comienza ese domingo a las 23:30 y termina el lunes aporta toda su duración al domingo.                                                  | H1, H3    |
| AC02 | Semana del 09/11/2026 al 15/11/2026: excluir 08/11 y 16/11; incluir ambos extremos de la semana. El resultado no depende de la zona del servidor.                                                              | H1        |
| AC03 | Objetivo de 5 horas/3 días; 420 minutos en 2 fechas producen 7 horas, 140 % y meta aún no cumplida. La barra llega a 100 % y el texto muestra 140 %.                                                           | H2, H3    |
| AC04 | Dos partidas de un juego el mismo día suman ambas duraciones, pero aportan un único día semanal y un único día global.                                                                                         | H3, H4    |
| AC05 | Partidas en juegos diferentes los días 09/11 y 10/11 mantienen racha 2 durante el 11/11. Si no se juega el 11/11, a las 00:00 locales del 12/11 la racha es 0; mejor racha sigue siendo 2 si no hay una mayor. | H4        |
| AC06 | Añadir/eliminar registros recalcula ambas rachas y los indicadores afectados. Otra partida del mismo día conserva ese día global; borrar un juego puede reducir una secuencia.                                 | H4        |
| AC07 | Rechazar objetivo de 0 o más de 100 horas, días fuera de 1–7/no enteros y más de 5 hitos. Aceptar objetivo equivalente a 1 minuto y máximo 100 horas.                                                          | H5        |
| AC08 | No pueden coexistir dos metas activas para el mismo juego. Crear una el jueves utiliza las partidas de lunes a jueves; editar sus objetivos recalcula el cumplimiento.                                         | H5, H6    |
| AC09 | Cancelar la confirmación de desactivación mantiene la meta activa. Confirmarla conserva partidas, avance y rachas, y permite volver a crear una meta sin dos activas.                                          | H6, H8    |
| AC10 | Avances 80 %, 30 % y 70 % mantienen avance E1 de 80 % y alcanzan un hito de 75 %. Eliminar la única partida de 80 % deja máximo 70 % y ese hito pendiente.                                                     | H7        |
| AC11 | Sin meta activa siguen visibles horas/días semanales, avance E1 y rachas globales; no aparece un falso 0 % de cumplimiento. Se ofrece crear meta. Sin partidas, valores observados y rachas son 0.             | H8        |
| AC12 | Pasar un juego a Completado o Abandonado conserva su meta. En esos estados es posible crear/editar meta; sus partidas cuentan para la racha global.                                                            | H9, H4    |
| AC13 | Los flujos de E1, su resumen vacío y su máximo avance siguen funcionando. La interfaz respeta DESIGN.md, teclado, móvil/escritorio y estados de datos.                                                         | E1, H1–H9 |

Estos escenarios son especificación, no evidencia de ejecución. Las specs
aprobadas añaden casos negativos de contrato y detalles de interacción; su
verificación prevista y evidencia actual se distinguen en la matriz del backlog.

## Dependencias y tratamiento del diagnóstico

| Diagnóstico | Tratamiento para esta entrega                                                                                                                                                                        |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B1–B2       | Resolver el contrato de fecha civil y su presentación antes de cálculos semanales/rachas y su interfaz.                                                                                              |
| B3          | Alinear `VITE_API_URL` y `/api` antes de integrar y validar en el entorno objetivo.                                                                                                                  |
| B4          | Mantener formulario de partida recuperable tras error antes de ampliar ese flujo.                                                                                                                    |
| B5          | Añadir pruebas del producto con datos/configuración aislados, antes de implementar los flujos afectados.                                                                                             |
| T1–T5       | Mantener como deuda; adelantar solo cambios indispensables para un ticket aprobado, con justificación. La prevención de duplicados se exige a nuevos formularios E2, sin dar por corregido T4 de E1. |
| D1–D3       | Conservar diferidos: contrato/identidad de logros, búsqueda fuera de orden y atomicidad/rendimiento. Hitos E2 no implican corregir el modelo de logros E1.                                           |

La arquitectura existente, Tailwind, `/api` y errores centralizados se conservan.
No se leerán/modificarán `.env` ni se ejecutarán pruebas que los carguen.

## Supuestos explícitos

- El ámbito del producto es Ecuador continental; no se configura otra zona.
- La fecha local de inicio es declarada por el usuario, no inferida de una hora
  de inicio que el sistema no captura.
- La actividad se calcula sobre el conjunto actual de datos de la aplicación.
  No se atribuye a cuentas individuales inexistentes.
- Los registros antiguos se interpretan según P07 de la spec backend aprobada,
  sin inventar el inicio original ni autorizar una migración automática.
- Las decisiones H1–H9 no garantizan conformidad con una ficha académica ausente.

## Estado consolidado de decisiones PA

| ID   | Estado                      | Resolución y fuente canónica                                                                                                                                        |
| ---- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PA01 | Pendiente de cotejo externo | Falta la ficha original para contrastar H1–H8 con los ocho huecos académicos. No se inventa equivalencia; H9 sigue siendo una decisión adicional aprobada.          |
| PA02 | Aprobado en las specs       | P02 backend: rechazo de fechas nuevas futuras respecto a Guayaquil, límites de retroactividad y exclusión temporal de registros futuros antiguos según el contrato. |
| PA03 | Aprobado en las specs       | P03 backend: conservar inactivas, crear otra con nuevo ID, sin reactivación ni vista histórica; cascada del juego a sus metas sin prometer atomicidad general.      |
| PA04 | Aprobado en las specs       | P04 backend: descripción recortada de 1–120 caracteres, porcentaje entero 1–100, duplicados permitidos e identidad por ID.                                          |
| PA05 | Aprobado en las specs       | P05 backend/frontend: minutos enteros canónicos; entrada, límites y presentación precisados sin redondear decisiones de cumplimiento.                               |
| PA06 | Aprobado en las specs       | P06 frontend: reconsulta al cambio de día de Guayaquil y retorno de foco/visibilidad, sin polling periódico ni notificaciones.                                      |
| PA07 | Aprobado en las specs       | P07 backend: interpretar el día UTC ya guardado, sin reconstruir el inicio local original ni migrar datos; tratamiento controlado de datos no interpretables.       |

Las resoluciones completas permanecen en la sección 2 de las specs
[backend](../specs/E2-backend.md) y [frontend](../specs/E2-frontend.md); esta tabla
actualiza su estado sin sustituir contratos ni solicitar de nuevo su aprobación.
PA01 limita la certificación académica, no bloquea automáticamente todos los
tickets técnicos. Las dependencias y la preparación de cada ticket siguen siendo exigibles.
