# Backlog E2 — Metas y rachas de SAVEPOINT

Fecha: 11 de noviembre de 2026.

Estado: planificación y simplificación aprobadas en conversación el 11 de
noviembre de 2026, mediante «Si esta bien, aprobado», después de revisar las
conclusiones del borrador. Se pasa de 34 a 23 tickets con trazabilidad de los
agrupados. El [PRD](../prd/savepoint.md) y las [épicas](epicas.md) están aprobados.
Los puntos abiertos no quedan resueltos por esta aprobación; tampoco se autoriza
implementar sin futuras specs aprobadas. Este documento no define rutas,
esquemas ni implementaciones; no se crean especificaciones ni código en esta fase.

Referencias: [diagnóstico](../diagnostico.md), [DESIGN.md](../../DESIGN.md).
H1–H9, AC01–AC13 y PA01–PA07 remiten al PRD. E1-01–E1-05 y E2-01–E2-06
son los trabajos generales de las épicas; los IDs de este archivo los desglosan
sin sustituirlos ni reutilizarlos con otro significado.

## 1. Alcance y prioridades

| Grupo                                          | Obligación y límites                                                                                                                                                                                                       |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **E2 funcional obligatoria**                   | Una meta activa por juego, creación/edición/desactivación, horas y días semanales, hitos automáticos y rachas globales; comportamiento sin meta y compatibilidad con todos los estados del juego. Corresponde a HU01–HU07. |
| **Habilitantes de E1**                         | B1–B5 del diagnóstico deben resolverse antes del flujo afectado. Son correcciones de la base y pruebas, no funcionalidades nuevas de E2.                                                                                   |
| **Actualización visual aprobada de SAVEPOINT** | Adopción de Nebula Arcade mediante DESIGN.md, separada de los cálculos y contratos funcionales. Corresponde a HV01–HV03 y tickets VIS. La dirección visual está aprobada; su ejecución requiere spec de frontend aprobada. |
| **Regresiones de E1**                          | Conservar biblioteca, CRUD, enums, logros manuales, sesiones/historiales y resumen acumulado con máximo avance. E2 complementa el resumen y no convierte logros en hitos.                                                  |

La separación visual permite revisar e integrar cambios pequeños sin ocultar
modificaciones de negocio en cambios de estilo. No convierte en opcionales la
accesibilidad, los estados comprensibles ni las reglas de presentación funcional
de E2: por ejemplo, porcentaje real 140 %, barra limitada e identificación de
rachas globales siguen siendo criterios obligatorios.

No se incluyen tienda, descargas, rankings, notificaciones, gráficos históricos,
cuentas, edición de partidas ni correcciones incidentales de deuda diferida.

## 2. Historias de usuario funcionales

### HU01 — Consultar mi actividad semanal sin necesitar una meta

**Como** persona que registra partidas, **quiero** ver horas y días de juego de
la semana actual y el avance acumulado del videojuego, **para** conocer mi
actividad aunque todavía no haya fijado un objetivo.

Reglas: H1/H2/H3/H8. PRD: AC01/AC02/AC04/AC11. Épica: E2-02.

- **DADO** un juego con partidas dentro y fuera de la semana local de lunes a
  domingo, **CUANDO** consulto su actividad semanal, **ENTONCES** solo se suman
  los minutos y fechas distintas de esa semana en `America/Guayaquil`.
- **DADO** que una sesión comenzó el domingo y terminó el lunes, **CUANDO** se
  registra el día local de inicio, **ENTONCES** toda su duración pertenece al domingo.
- **DADO** un juego sin meta activa, **CUANDO** consulto el detalle, **ENTONCES**
  veo horas/días semanales, avance acumulado E1 y una invitación a crear meta;
  el cumplimiento de horas de una meta es no aplicable, no un falso 0 %.
- **DADO** un juego sin partidas, **CUANDO** consulto esos valores, **ENTONCES**
  son 0 y se conserva el resumen vacío de E1.

### HU02 — Reconocer mi constancia entre todos los videojuegos

**Como** persona que alterna juegos, **quiero** consultar mi racha actual y mi
mejor racha global, **para** reconocer continuidad sin tener que jugar siempre
al mismo videojuego o mantener una meta activa.

Reglas: H4/H8/H9. PRD: AC04/AC05/AC06/AC12. Épica: E2-03.

- **DADO** que registré una partida en un juego el 09/11 y en otro el 10/11,
  **CUANDO** consulto durante el 11/11/2026 sin haber jugado aún ese día,
  **ENTONCES** la racha actual es 2 y está identificada como global.
- **DADO** ese historial y ninguna partida el 11/11, **CUANDO** comienza el
  12/11 en Ecuador continental, **ENTONCES** una nueva consulta devuelve racha
  actual 0 y mejor racha 2 si no existe otra secuencia mayor.
- **DADO** varias partidas en una fecha, incluso en juegos completados o
  abandonados y sin meta, **CUANDO** se calcula la racha, **ENTONCES** esa fecha
  cuenta una sola vez y el estado del juego no la excluye.
- **DADO** que no existe ninguna partida, **CUANDO** consulto las rachas,
  **ENTONCES** ambas son 0, visibles sin ambigüedad.

### HU03 — Crear una meta semanal y conocer su cumplimiento

**Como** persona que organiza su tiempo de juego, **quiero** fijar horas y días
objetivo para un videojuego, **para** comparar mi actividad semanal con un
objetivo concreto.

Reglas: H2/H3/H5/H6/H9. PRD: AC03/AC07/AC08/AC12. Épicas: E2-01/E2-02.

- **DADO** un juego sin meta activa, **CUANDO** creo una con horas mayores que 0
  y hasta 100, en incrementos equivalentes a un minuto, y días enteros de 1 a 7,
  **ENTONCES** existe una única meta activa y se cuenta toda la actividad de
  la semana, incluso la anterior a crearla. Se puede crear sin hitos.
- **DADO** un juego con meta activa, **CUANDO** se intenta crear otra,
  **ENTONCES** no coexisten dos metas activas y el fallo se informa claramente.
- **DADO** objetivos de 5 horas y 3 días y actividad de 420 minutos en 2 fechas,
  **CUANDO** consulto, **ENTONCES** veo 7 horas y 140 %, la barra no desborda
  100 % y la meta sigue sin cumplirse porque falta un día.
- **DADO** objetivos inválidos, **CUANDO** intento guardarlos, **ENTONCES** no
  se crea la meta y puedo corregir los valores sin perder el formulario.
- **DADO** un juego Completado o Abandonado, **CUANDO** creo una meta válida,
  **ENTONCES** el estado no impide la operación ni deja de aportar a las rachas.

### HU04 — Ajustar los objetivos de una meta vigente

**Como** persona con una meta activa, **quiero** editar sus horas y días
objetivo, **para** adaptarla a mi disponibilidad sin perder las partidas.

Reglas: H5/H6/H9. PRD: AC07/AC08/AC12. Épicas: E2-01/E2-02.

- **DADO** una meta activa con partidas de la semana, **CUANDO** cambio sus
  objetivos válidamente, **ENTONCES** el cumplimiento se recalcula con esas
  partidas y ninguna se borra.
- **DADO** una edición inválida, **CUANDO** intento guardar, **ENTONCES** la
  meta previa se conserva y el formulario permite corregir/reintentar.
- **DADO** una meta de un juego que cambia a Completado o Abandonado,
  **CUANDO** consulto y edito, **ENTONCES** sigue activa y editable.

### HU05 — Desactivar una meta conservando mi actividad

**Como** persona que ya no desea seguir un objetivo, **quiero** desactivar la
meta con confirmación, **para** dejar de compararme con ella sin borrar mi diario.

Reglas: H6/H8. PRD: AC09/AC11. Épica: E2-01.

- **DADO** una meta activa, **CUANDO** cancelo su confirmación de desactivación,
  **ENTONCES** la meta sigue activa sin cambios.
- **DADO** una meta activa, **CUANDO** confirmo desactivarla y la operación
  tiene éxito, **ENTONCES** se informa el resultado, desaparece la comparación
  con ese objetivo y siguen visibles horas/días, avance y rachas.
- **DADO** una desactivación exitosa, **CUANDO** creo otra meta válida,
  **ENTONCES** vuelve a existir una sola activa sin borrar partidas.
- **DADO** un fallo al desactivar, **CUANDO** veo el error, **ENTONCES** no se
  presenta como exitosa la operación y puedo reintentar.

No incorpora reactivación ni una pantalla de metas históricas; PA03 sigue abierto.

### HU06 — Consultar hitos alcanzados por mi avance

**Como** persona que sigue el progreso de un juego, **quiero** definir hasta
cinco hitos y ver cuáles alcancé, **para** reconocer objetivos de avance sin
tener que marcarlos manualmente.

Reglas: H5/H7. PRD: AC07/AC10. Épica: E2-04.

- **DADO** una meta con entre cero y cinco hitos válidos, **CUANDO** se guarda
  y consulta, **ENTONCES** cada hito muestra descripción, porcentaje objetivo
  de 1 a 100 y estado textual Alcanzado/Pendiente según el máximo avance E1.
- **DADO** avances de 80 %, 30 % y 70 % y un hito de 75 %, **CUANDO** consulto,
  **ENTONCES** está alcanzado aunque la última sesión tenga menos avance.
- **DADO** ese historial, **CUANDO** elimino la única sesión de 80 %,
  **ENTONCES** el máximo es 70 % y el hito vuelve a pendiente.
- **DADO** un sexto hito o un porcentaje fuera de rango, **CUANDO** intento
  guardar, **ENTONCES** se rechaza sin alterar los logros manuales de E1.

La validación de enteros, duplicados y longitud de descripción requiere PA04.

### HU07 — Ver indicadores consistentes después de cambiar mis partidas

Historia conservada como referencia de criterios transversales de HU01–HU06,
no como requisito para postergar su actualización hasta el último corte.

**Como** persona que corrige su diario, **quiero** que los indicadores se
actualicen al registrar o eliminar partidas, **para** decidir usando datos actuales.

Reglas: H1–H4/H6–H8. PRD: AC06/AC10/AC13. Épicas: E2-02/03/04/06.

- **DADO** indicadores visibles, **CUANDO** registro o elimino una partida
  correctamente, **ENTONCES** la siguiente vista muestra el historial, resumen
  E1, actividad semanal, cumplimiento, hitos y rachas afectados actualizados.
- **DADO** varias partidas el mismo día, **CUANDO** elimino solo una,
  **ENTONCES** ese día permanece en el cómputo mientras exista otra partida;
  para la racha global puede pertenecer a cualquier juego.
- **DADO** un historial con secuencias consecutivas, **CUANDO** añado una
  partida retroactiva o elimino un juego con sus partidas, **ENTONCES** las
  rachas se recalculan sobre los registros restantes y la mejor puede cambiar.
- **DADO** una pantalla abierta al cambiar de día o semana, **CUANDO** se
  aplica el comportamiento de actualización que se acuerde en PA06,
  **ENTONCES** presenta valores del periodo vigente sin añadir notificaciones.

El último criterio queda condicionado a resolver PA06, no da por aprobada una
frecuencia de actualización ni un mecanismo técnico.

## 3. Historias de actualización visual

HV01–HV03 expresan objetivos de presentación y calidad. No se consideran tres
entregas independientes completamente estimables mientras no se delimiten sus
vistas. La accesibilidad y la correcta interpretación de indicadores se exigen
ya en las historias funcionales; renovar todas las vistas de E1 es otro alcance.

### HV01 — Leer la información con una identidad visual consistente

**Como** persona que consulta SAVEPOINT, **quiero** una jerarquía legible y
consistente de textos, superficies y acciones, **para** reconocer rápidamente
la información y la acción principal.

- **DADO** una vista incluida en el ticket visual, **CUANDO** la consulto,
  **ENTONCES** sus colores, tipografía, espaciado y superficies cumplen DESIGN.md,
  sin sombras decorativas ni una segunda acción primaria destacada en el contexto.
- **DADO** texto funcional, **CUANDO** se presenta sobre su fondo,
  **ENTONCES** cumple el contraste mínimo de 4,5:1 y no usa fuente display en párrafos.

### HV02 — Entender mis metas y rachas en móvil y escritorio

**Como** persona que consulta el detalle del juego, **quiero** distinguir el
resumen acumulado, los objetivos semanales y las rachas globales, **para** no
confundir avance del juego con cumplimiento ni actividad individual con global.

- **DADO** el detalle con o sin meta, **CUANDO** lo consulto en móvil/escritorio,
  **ENTONCES** mantiene el resumen E1, distingue indicadores y no introduce
  desbordamiento horizontal; porcentajes superiores a 100 % conservan texto real.
- **DADO** una barra de progreso aplicable, **CUANDO** uso tecnologías de apoyo,
  **ENTONCES** tiene nombre y valor accesibles y equivalente numérico visible.

### HV03 — Completar formularios y navegar con teclado

**Como** persona que usa teclado o una pantalla pequeña, **quiero** controles
legibles y accesibles, **para** registrar actividad o gestionar metas sin depender
del color o de animaciones.

- **DADO** un formulario incluido en el ticket, **CUANDO** navego con teclado,
  **ENTONCES** los campos tienen etiquetas, el foco es visible y controles/acciones
  cumplen el tamaño mínimo de 44 px indicado por DESIGN.md.
- **DADO** carga, error, vacío o éxito, **CUANDO** se presenta el estado,
  **ENTONCES** hay texto comprensible y una siguiente acción cuando corresponde;
  se respeta movimiento reducido y el color no es la única señal.

Los cortes visuales no añaden funcionalidades ni autorizan instalar librerías
de UI. No se cambia el nombre SAVEPOINT por Nebula Arcade.

## 4. Criterio INVEST y tamaño de los cortes

- **Independientes:** HU01 funciona sin metas; HU02 sin metas ni HU01. Crear,
  editar, desactivar y gestionar hitos tienen aceptación separada. Comparten
  infraestructura, pero no forman una única entrega indivisible.
- **Negociables:** estas historias describen resultados; rutas, persistencia,
  componentes y mecanismos de actualización se decidirán en specs posteriores.
- **Valiosas:** cada historia entrega un resultado observable para la persona;
  los habilitantes técnicos se identifican como tickets, no como historias ficticias.
- **Estimables:** reglas y ejemplos delimitan trabajo. Los tickets afectados
  por PA tienen estado Bloqueado por decisión; se estimarán tras resolverla.
  No se inventan horas, fechas ni puntos para requisitos todavía ambiguos.
- **Pequeñas:** se separan consulta sin meta, rachas, creación, edición,
  desactivación e hitos. Backend y frontend son tareas de una entrega vertical,
  no historias terminadas por sí solas. HU07 aporta criterios a cada corte;
  registro/eliminación se agrupan y el cambio de periodo conserva su decisión propia.
- **Testeables:** los criterios anteriores y los AC del PRD permiten verificar
  resultados con datos sintéticos. Ninguna historia se considera hecha por tener
  solo la capa backend o solo una maqueta del frontend.

## 5. Definition of Ready y Definition of Done

**Ready:** alcance y dependencias claros, PA relevantes resueltos y spec del
ticket aprobada en `docs/specs/` antes de implementar. Todo ticket de interfaz
requiere también la aprobación de la spec de frontend correspondiente. Ningún
ticket de este backlog está listo para implementar solo por aparecer aquí.

**DoD común**, aplicable a cada ticket además de su DoD particular:

1. Cumple el alcance y los criterios asignados de la spec aprobada, sin ampliar
   E2 ni corregir deuda incidentalmente; mantiene arquitectura y contratos de E1.
2. Tests pertinentes ejecutados y aprobados, incluidos errores/límites y
   regresiones afectadas; registrar comandos, resultados y criterio → prueba.
   Usar configuración/datos aislados sin leer ni cargar `.env`.
3. Backend: casos de cálculo/contrato y validaciones verificados según el corte;
   frontend: interacción, carga/error/vacío/éxito y recuperación verificados.
4. En tickets visuales: evidencia de móvil/escritorio, teclado, contraste y
   movimiento reducido según DESIGN.md; conservar el comportamiento funcional.
5. Diff revisado, sin secretos ni archivos ajenos; documentación afectada coherente.
   No declarar cierre con tests del harness o typecheck como única evidencia.
6. Resultado presentado para revisión. Hacer commit o push requiere autorización
   independiente; no son una condición automática de cierre.

## 6. Decisiones previas y tickets habilitantes

Las decisiones son una lista previa de producto, no tickets de implementación.
Resolverlas no requiere escribir una spec ni ejecutar tests del producto:
requiere registrar el acuerdo explícito. Cada spec solo queda bloqueada por los
puntos que afectan a su alcance, no por toda esta lista.

| Punto abierto     | Decisión pendiente                                                                  | Alcance que afecta                                                                             |
| ----------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| PA01              | Contrastar con la ficha de hechos y el enunciado original cuando estén disponibles. | Conformidad académica; no se inventa una correspondencia.                                      |
| PA02              | Fechas futuras y límites de registro retroactivo.                                   | Contrato de partidas, semana y rachas.                                                         |
| PA03              | Metas inactivas, posible reactivación y tratamiento al borrar un juego.             | Ciclo de vida de metas y borrado; reactivar no está autorizado todavía.                        |
| PA04              | Enteros/decimales de hitos, duplicados y longitud de descripción.                   | Validación y formularios de hitos.                                                             |
| PA05              | Entrada de horas con incrementos de un minuto y presentación/redondeo.              | Metas e indicadores; no condiciona una racha expresada en días enteros.                        |
| PA06              | Política de actualización con pantalla abierta al cambiar día/semana.               | INT-03 y su interfaz; no impide consultas correctas al cargar una vista.                       |
| PA07              | Tratamiento de registros antiguos con posible desfase, sin migración silenciosa.    | Datos existentes; no convierte una migración en requisito de la corrección de entradas nuevas. |
| Alcance visual E1 | Confirmar vistas y profundidad de navegación, biblioteca, formularios e historial.  | VIS-02 queda reservado, sin incorporar ese rediseño al cierre funcional obligatorio de E2.     |

Tipos de ticket: `test`, `fix`, `feat`, `visual`. Las dependencias son para
integración/cierre; pueden prepararse pruebas con datos simulados bajo spec.
La DoR/DoD de la sección 5 aplica a los tickets de las tablas siguientes.

| ID        | Tipo / área           | Trabajo acotado                                                        | Dependencias                                 | DoD particular además del común                                                                                   |
| --------- | --------------------- | ---------------------------------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| E2-HAB-01 | test / BE-FE          | Base mínima de pruebas del producto, con subtareas backend y frontend. | E1-01; solo aislamiento indispensable de T5. | Una prueba reproducible por capa demuestra aislamiento, comandos documentados y ausencia de carga de `.env`.      |
| E2-HAB-03 | fix / BE              | Validación y persistencia del día civil de inicio.                     | E2-HAB-01; PA02 en lo aplicable; E1-02/B1.   | AC01 y límites del contrato pasan sin conversión de día; PA07 se trata aparte y no se reescriben fechas antiguas. |
| E2-HAB-04 | fix / FE              | Selector solo fecha y presentación sin desfase.                        | E2-HAB-01/03; E1-02/B1/B2.                   | AC01: día seleccionado coincide en formulario, historial y resumen, sin pedir hora.                               |
| E2-HAB-05 | fix / integración API | Alinear URL base y `/api` en clientes/documentación.                   | E1-03/B3.                                    | Solicitudes verificadas contra prefijo correcto sin editar `.env`; no refactoriza todo el cliente HTTP.           |
| E2-HAB-06 | fix / FE              | Recuperación del formulario de partida tras error.                     | E2-HAB-01; E1-04/B4.                         | Error y reintento conservan formulario y datos; regresión del registro probada.                                   |

## 7. Tickets funcionales backend

| ID       | Tipo | Historia / épica | Corte                                                   | Dependencias                                                             | DoD particular además del común                                                                                                                                                      |
| -------- | ---- | ---------------- | ------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| E2-BE-01 | feat | HU01 / E2-02     | Consultar horas y días semanales sin meta.              | E2-HAB-01/03.                                                            | AC01/AC02/AC04 y parte de AC11: solo cuenta el juego/semana consultados; sin partidas devuelve ceros.                                                                                |
| E2-BE-02 | feat | HU02 / E2-03     | Consultar racha actual y mejor racha global.            | E2-HAB-01/03.                                                            | AC04/AC05 y rachas sin partidas de AC11; reloj controlado, varios juegos y estados del juego de AC12.                                                                                |
| E2-BE-03 | feat | HU03 / E2-01/02  | Crear/consultar meta sin hitos y calcular cumplimiento. | E2-BE-01; PA05 y solo decisiones PA03 necesarias para creación/consulta. | AC03/AC07/AC08/AC12: objetivos válidos, una sola activa, actividad previa semanal, comparación sin redondear y horas más días. Reactivación/borrado no se añaden como funcionalidad. |
| E2-BE-05 | feat | HU04 / E2-01     | Editar horas y días de meta activa.                     | E2-BE-03.                                                                | AC07/AC08/AC12: validación y recálculo conservan partidas y meta previa ante error.                                                                                                  |
| E2-BE-06 | feat | HU05 / E2-01     | Desactivar meta sin borrar actividad.                   | E2-BE-03; PA03 en lo aplicable.                                          | AC09/AC11: desactivar conserva actividad y permite crear otra sin dos activas; no presume reactivación.                                                                              |
| E2-BE-07 | feat | HU06 / E2-04     | Incorporar/evaluar hasta cinco hitos.                   | E2-BE-03/05; PA04.                                                       | AC07/AC10: límites y estado calculado desde máximo E1; eliminar la sesión máxima puede devolver un hito a pendiente; logros intactos.                                                |

## 8. Tickets funcionales frontend

| ID       | Tipo | Historia / épica | Corte                                              | Dependencias                                  | DoD particular además del común                                                                                                        |
| -------- | ---- | ---------------- | -------------------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| E2-FE-01 | feat | HU01 / E2-05     | Mostrar actividad semanal y avance sin meta.       | E2-HAB-01/04/05, E2-BE-01; presentación PA05. | AC01/AC02/AC04/AC11: valores visibles con carga/error/vacío; resumen E1 conservado e invitación a crear meta. No espera resolver PA06. |
| E2-FE-02 | feat | HU02 / E2-05     | Mostrar ambas rachas como globales.                | E2-HAB-01/05, E2-BE-02.                       | AC04/AC05/AC11/AC12: valores 0 y sin meta correctos; rachas diferenciadas de días semanales del juego.                                 |
| E2-FE-03 | feat | HU03 / E2-05     | Crear meta y mostrar cumplimiento de horas/días.   | E2-FE-01, E2-BE-03; PA05.                     | AC03/AC07/AC08/AC12: límites, 140 % sin desbordar, estados de juego permitidos, error recuperable y sin envíos duplicados.             |
| E2-FE-04 | feat | HU04 / E2-05     | Editar objetivos de meta.                          | E2-FE-03, E2-BE-05.                           | AC07/AC08/AC12: edición válida recalcula, inválida conserva datos y Completado/Abandonado no restringe edición.                        |
| E2-FE-05 | feat | HU05 / E2-05     | Confirmar desactivación y mostrar estado sin meta. | E2-FE-03, E2-BE-06.                           | AC09/AC11: cancelar/confirmar/error/reintento probados; avance y rachas permanecen visibles.                                           |
| E2-FE-06 | feat | HU06 / E2-05     | Añadir/editar hitos y presentar su estado.         | E2-FE-03/04, E2-BE-07; PA04.                  | AC07/AC10: descripción, objetivo y estado textual coherentes; sin marcado manual ni cambios de logros E1.                              |

## 9. Tickets de integración y evidencia

| ID        | Tipo | Historia / épica              | Corte                                                            | Dependencias                                                                                                              | DoD particular además del común                                                                                                                                                                                                |
| --------- | ---- | ----------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| E2-INT-01 | feat | HU07 transversal / E2-06      | Refrescar indicadores tras registrar/eliminar partidas o juegos. | Para primer corte: E2-HAB-06, E2-FE-01/02; ampliar con cada FE posterior.                                                 | AC06/AC10 y regresión AC13: historial/resumen e indicadores disponibles actualizados; otra partida conserva el día; eliminar juego puede reducir rachas. No esperar hitos para refrescar horas/rachas.                         |
| E2-INT-03 | feat | HU07 transversal / E2-06      | Mantener periodo vigente en pantalla abierta.                    | E2-FE-01/02/03; PA06.                                                                                                     | AC05/AC06 según política de PA06 aprobada, con reloj controlado y sin notificaciones; ningún temporizador o mecanismo queda predeterminado.                                                                                    |
| E2-INT-04 | test | HU01–HU07 y HV01–HV03 / E2-06 | Consolidar aceptación, recálculo, regresión y evidencia visual.  | Bloque funcional: E2-INT-01/03 y E2-FE-04/05/06; E1-05. Bloque visual: E2-VIS-01/03; VIS-02 solo con alcance E1 aprobado. | Matriz AC01–AC13 con casos negativos y evidencia por capa/vista; incluye recálculo retroactivo, eliminación y accesibilidad. Cada ticket mantiene sus tests desde su corte; un fallo bloquea el cierre del ticket responsable. |

INT-01 se integra por etapas como criterio de cada historia funcional. No se
considera completada una historia con indicadores desactualizados alegando que
el ticket transversal queda para después. INT-04 reúne evidencia que ya debe
existir; la renovación visual de todas las vistas E1 no bloquea su bloque funcional.

## 10. Tickets de integración visual de SAVEPOINT

Dirección visual aprobada; ejecución sujeta a spec de frontend. Los objetivos
visuales no autorizan ampliar lógica, datos ni contratos de E1/E2.

| ID        | Tipo   | Historia       | Corte                                                                  | Dependencias                                          | DoD particular además del común                                                                                                                                                          |
| --------- | ------ | -------------- | ---------------------------------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E2-VIS-01 | visual | HV01           | Tokens y tipografía con herramientas existentes.                       | Spec visual aprobada; DESIGN.md.                      | Fuente única de tokens, tipografía/licencias verificadas; sin librerías nuevas ni cambios de lógica; evidencia de contraste.                                                             |
| E2-VIS-02 | visual | HV01/HV03      | Actualizar vistas E1: navegación, biblioteca, formularios e historial. | E2-VIS-01, E2-HAB-04/06; confirmar alcance visual E1. | Solo vistas incluidas en la spec: filtros, acciones y formularios E1 conservados; foco/contraste/tamaños verificados. Reservado hasta delimitar alcance; no es requisito de cálculos E2. |
| E2-VIS-03 | visual | HV01/HV02/HV03 | Integrar detalle e interfaces de metas/hitos con Nebula Arcade.        | E2-VIS-01, E2-FE-01/02/03/04/05/06.                   | AC03/AC09/AC11/AC13 visuales: resumen E1 preservado, indicadores globales claros, formularios accesibles y barra sin desbordar; evidencias por vista y pruebas de regresión.             |

Los tickets visuales agrupados admiten subtareas por vista. Si la spec revela
que un corte es demasiado grande, se dividirá conservando referencias y se
revisará el desglose; 23 no es un número impuesto por SDD. La presentación
funcional y la accesibilidad no pueden posponerse alegando que VIS sigue pendiente.

### Correspondencia con los 34 tickets del borrador

No se eliminan criterios por agrupar ni se reutilizan IDs retirados:

- `DEC-01–04`: sustituidos por la lista PA previa; no son tickets de implementación.
- `HAB-02` se integra en `E2-HAB-01`, con subtareas y evidencia por capa.
- `BE-04` se integra en `E2-BE-03`, manteniendo validación y cálculo diferenciados.
- `INT-02` se integra en `E2-INT-01`, conservando casos de alta y eliminación.
- `BE-08` y `VIS-06` se integran en `E2-INT-04`, con bloques de recálculo,
  regresión y evidencia visual además de la aceptación funcional.
- `VIS-04` se integra en `E2-VIS-03`, con criterios por detalle y formulario.
- `VIS-05` se integra en `E2-VIS-02`, reservado al alcance E1 que se confirme.

Quedan 5 habilitantes, 6 backend, 6 frontend, 3 de integración/evidencia y
3 visuales: **23 tickets**. No se añaden tickets de deuda técnica general.

## 11. Orden incremental y cortes de revisión

1. Resolver decisiones necesarias y habilitantes del flujo que se abordará.
2. Entregar HU01 y HU02 como consultas útiles sin exigir metas; revisar cada una
   con su backend, interfaz mínima accesible y pruebas correspondientes.
3. Entregar HU03 sin hitos; después HU04 y HU05 como cortes separados.
4. Entregar HU06; verificar HU07 en cada corte. Registro y eliminación se
   integran por etapas y el cambio de periodo espera la decisión PA06.
5. Adoptar VIS por corte una vez aprobada la spec; puede acompañar cada interfaz
   o revisarse después, conservando reglas funcionales y accesibilidad desde el inicio.
6. Consolidar evidencia funcional y visual. Pedir revisión antes de cualquier commit.

No se declara independencia absoluta de componentes compartidos ni se fuerza
entregar una capa aislada como historia terminada. Las dependencias anteriores
permiten negociar el orden sin alterar las reglas H1–H9.

## 12. Deuda técnica y problemas diferidos pendientes

| ID diagnóstico | Tema                                                     | Tratamiento en el backlog                                                                                          |
| -------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| B1/B2          | Fechas de entrada y presentación.                        | Bloqueantes: HAB-03/04, no deuda opcional para los flujos afectados.                                               |
| B3             | URL base y `/api`.                                       | Bloqueante de integración: HAB-05.                                                                                 |
| B4             | Formulario desaparece tras error.                        | Bloqueante del registro: HAB-06.                                                                                   |
| B5             | Falta de pruebas del producto.                           | HAB-01 (backend y frontend) y DoD de todos los tickets; los tests del harness no lo resuelven.                     |
| T1             | App.tsx concentra responsabilidades.                     | Posterior; cualquier extracción indispensable se acota en el ticket aprobado. No refactorización completa.         |
| T2             | Cliente HTTP duplicado y pérdida de contexto de errores. | Posterior; corregir B3 no implica dar T2 por resuelto.                                                             |
| T3             | JSON malformado y orden de middlewares.                  | Posterior; reevaluar si los criterios de un contrato nuevo lo requieren explícitamente.                            |
| T4             | Duplicados por envíos en formularios E1.                 | Posterior en E1. Formularios nuevos E2 deben prevenirlos desde su aceptación.                                      |
| T5             | Configuración acoplada al entorno.                       | Adelantar solo el aislamiento imprescindible de HAB-01; el resto sigue pendiente.                                  |
| D1             | Descripciones e identidad de logros.                     | Diferido. No confundir con hitos; no corregirlo por incidentalidad en FE-06/VIS-02.                                |
| D2             | Resultados de búsqueda fuera de orden.                   | Diferido. VIS-02 no amplía el alcance a corregir esa concurrencia.                                                 |
| D3             | Atomicidad, consultas sin límite y paginación.           | Diferido. La unicidad de meta activa sí es requisito E2; no autoriza una revisión general de rendimiento/cascadas. |

Los detalles y evidencia permanecen en el diagnóstico. Una reclasificación debe
ser explícita y aprobada; ningún problema diferido se borra por terminar E2.

## 13. Estado y siguiente paso

El desglose simplificado está aprobado como planificación; los tickets afectados
por PA siguen bloqueados por la decisión concreta y todos esperan su spec antes
de implementar. VIS-02 sigue reservado hasta precisar alcance visual E1. No se
ha ejecutado ningún ticket ni creado código o specs al actualizar este documento.

El siguiente paso es resolver los PA del primer corte y solicitar autorización
para crear sus specs. La aprobación de esta organización no decide fechas
futuras, reactivación, borrado de metas o actualización continua. No se ha hecho
staging, commit ni push como parte de esta actualización.
