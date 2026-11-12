# Backlog E2 — Metas y rachas de SAVEPOINT

Fecha: 11 de noviembre de 2026.

Estado: planificación y simplificación aprobadas en conversación el 11 de
noviembre de 2026, mediante «Si esta bien, aprobado», después de revisar las
conclusiones del borrador. Se pasa de 34 a 23 tickets con trazabilidad de los
agrupados. El [PRD](../prd/savepoint.md) y las [épicas](epicas.md) están aprobados.
Las specs backend/frontend fueron aprobadas después mediante «Si esta bien los
specs estan aprobados» y están versionadas. PA02–PA07 se resuelven en ellas;
PA01 conserva el cotejo académico externo pendiente. Cada ticket necesita además
su plan aprobado. Este backlog no sustituye los contratos de las specs ni acredita
implementación por sí solo; sus estados actuales y la trazabilidad están en las secciones 13–15.

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

No incorpora reactivación ni una pantalla de metas históricas, conforme a PA03 resuelto en la spec backend aprobada.

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

La validación de enteros, duplicados y longitud de descripción sigue PA04 de la spec backend aprobada.

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

El último criterio se verifica con P06 de la spec frontend aprobada y corresponde
a INT-03. No se introduce otra frecuencia o mecanismo por esta regularización.

## 3. Historias de actualización visual

HV01–HV03 expresan objetivos de presentación y calidad. Sus entregas se acotan
por las vistas y cortes descritos en la spec frontend aprobada y por el plan de
cada ticket. La accesibilidad y la interpretación de indicadores se exigen ya en
las historias funcionales; renovar las vistas E1 se limita a P-VIS, sin ampliarlo.

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
  componentes y actualización están precisados en las specs aprobadas. Un cambio
  posterior de decisiones o contratos requiere aprobación, no se infiere del backlog.
- **Valiosas:** cada historia entrega un resultado observable para la persona;
  los habilitantes técnicos se identifican como tickets, no como historias ficticias.
- **Estimables:** reglas y ejemplos delimitan trabajo. Las referencias a PA ya
  resueltos no bloquean por sí mismas los tickets; se consulta su estado vigente.
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

| Referencia        | Estado / resolución                                                                                      | Alcance que afecta                                                                |
| ----------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| PA01              | Pendiente: contrastar con la ficha original cuando esté disponible; sin inventar equivalencia con H1–H8. | Conformidad académica; no es un bloqueo técnico global.                           |
| PA02              | Resuelto en P02 backend aprobado.                                                                        | Fechas futuras y límites de registro retroactivo.                                 |
| PA03              | Resuelto en P03 backend aprobado.                                                                        | Inactivas, ausencia de reactivación y cascada al borrar un juego.                 |
| PA04              | Resuelto en P04 backend aprobado.                                                                        | Enteros, duplicados e identidad/longitud de hitos.                                |
| PA05              | Resuelto en P05 backend/frontend aprobado.                                                               | Minutos canónicos, entrada y presentación de objetivos/indicadores.               |
| PA06              | Resuelto en P06 frontend aprobado.                                                                       | Reconsulta al cambio de día/foco/visibilidad; implementación pendiente en INT-03. |
| PA07              | Resuelto en P07 backend aprobado.                                                                        | Interpretación de fechas antiguas sin migración.                                  |
| Alcance visual E1 | P-VIS descrito en la spec frontend aprobada; ejecución pendiente de plan por ticket/vista.               | VIS-02 conserva exclusivamente ese corte, sin ampliar funciones de E1.            |

El [PRD](../prd/savepoint.md#estado-consolidado-de-decisiones-pa) consolida las
resoluciones y sus fuentes canónicas. Las condiciones de decisión citadas en las
tablas originales siguientes se interpretan conforme a este estado vigente: las
referencias a PA02–PA07 y a delimitar P-VIS no significan que sigan sin resolución.
Se conservan IDs, dependencias y condiciones funcionales del DoD de los 23 tickets.

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

Dirección y spec frontend aprobadas; ejecución sujeta al plan de cada ticket/vista.
Los objetivos visuales no autorizan ampliar lógica, datos ni contratos de E1/E2.

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
   integran por etapas y el cambio de periodo sigue P06 aprobado en INT-03.
5. Adoptar VIS por corte una vez aprobada la spec; puede acompañar cada interfaz
   o revisarse después, conservando reglas funcionales y accesibilidad desde el inicio.
6. Consolidar evidencia funcional y visual. Pedir revisión antes de cualquier commit.

No se declara independencia absoluta de componentes compartidos ni se fuerza
entregar una capa aislada como historia terminada. Las dependencias anteriores
permiten negociar el orden sin alterar las reglas H1–H9.

## 12. Deuda técnica y problemas diferidos pendientes

| ID diagnóstico | Tema                                                     | Tratamiento en el backlog                                                                                                                                     |
| -------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B1/B2          | Fechas de entrada y presentación.                        | Bloqueantes: HAB-03/04, no deuda opcional para los flujos afectados.                                                                                          |
| B3             | URL base y `/api`.                                       | Bloqueante de integración: HAB-05.                                                                                                                            |
| B4             | Formulario desaparece tras error.                        | Bloqueante del registro: HAB-06.                                                                                                                              |
| B5             | Falta de pruebas del producto.                           | HAB-01 (backend y frontend) y DoD de todos los tickets; los tests del harness no lo resuelven.                                                                |
| T1             | App.tsx concentra responsabilidades.                     | Posterior; cualquier extracción indispensable se acota en el ticket aprobado. No refactorización completa.                                                    |
| T2             | Cliente HTTP duplicado y pérdida de contexto de errores. | Posterior; corregir B3 no implica dar T2 por resuelto.                                                                                                        |
| T3             | JSON malformado y orden de middlewares.                  | Corte C05/T3 autorizado y verificado en dependencias FE-03: 400/413 con requestId; conservar diagnóstico histórico y no presumir auditados todos los errores. |
| T4             | Duplicados por envíos en formularios E1.                 | Posterior en E1. Formularios nuevos E2 deben prevenirlos desde su aceptación.                                                                                 |
| T5             | Configuración acoplada al entorno.                       | Adelantar solo el aislamiento imprescindible de HAB-01; el resto sigue pendiente.                                                                             |
| D1             | Descripciones e identidad de logros.                     | Diferido. No confundir con hitos; no corregirlo por incidentalidad en FE-06/VIS-02.                                                                           |
| D2             | Resultados de búsqueda fuera de orden.                   | Diferido. VIS-02 no amplía el alcance a corregir esa concurrencia.                                                                                            |
| D3             | Atomicidad, consultas sin límite y paginación.           | Diferido. La unicidad de meta activa sí es requisito E2; no autoriza una revisión general de rendimiento/cascadas.                                            |

Los detalles y evidencia permanecen en el diagnóstico. Una reclasificación debe
ser explícita y aprobada; ningún problema diferido se borra por terminar E2.

## 13. Estado actual y siguiente paso

Revisión: **12 de noviembre de 2026**, HEAD 8904efc y bloque de pasos 4–6
implementado en el árbol de trabajo, sin staging/commit/push. Se distinguen
implementación, verificación y cierre aprobado. La autorización adicional
«Autorizado» cubrió C05/T3 y la cascada de INT-01; no cambió criterios ni contratos.

| Tickets vigentes                       | Estado real                                                                        | Evidencia / requisito pendiente                                                                                                                                                                                                              |
| -------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E2-HAB-01                              | Cerrado con aprobación explícita del usuario.                                      | ca734b6, b67caa4 y 25d1daf; [evidencia](../verificaciones/E2-HAB-01.md).                                                                                                                                                                     |
| E2-HAB-05                              | Implementado y verificado; cierre pendiente del usuario.                           | 1e528cb; [evidencia](../verificaciones/E2-HAB-05.md). Sin certificar despliegue productivo.                                                                                                                                                  |
| E2-HAB-03                              | Cerrado con aprobación explícita del usuario.                                      | 59bfc98; [evidencia](../verificaciones/E2-HAB-03.md). Escritura civil y regresiones backend.                                                                                                                                                 |
| E2-HAB-04                              | Implementado y verificado; revisión/cierre pendientes.                             | 59bfc98; [evidencia](../verificaciones/E2-HAB-04.md). Selector/presentación civil sin desfase.                                                                                                                                               |
| E2-HAB-06                              | Implementado y verificado; revisión/cierre pendientes.                             | c28df74; [evidencia](../verificaciones/E2-HAB-06.md). Recuperación del formulario E1; T4 sigue pendiente.                                                                                                                                    |
| E2-BE-01                               | Consulta/cálculos verificados; ticket abierto.                                     | a6663ff; [progreso](../verificaciones/E2-BE-01-progreso.md) y regresión del bloque actual.                                                                                                                                                   |
| E2-BE-03, E2-BE-05, E2-BE-06, E2-BE-07 | Cortes backend verificados; tickets abiertos.                                      | 03f8564/a6663ff; [modelo](../verificaciones/E2-BE-03-modelo.md), [CRUD](../verificaciones/E2-BE-03-crud.md), progreso posterior. [Parser/cascada](../verificaciones/E2-dependencias-FE-03.md) ahora verificados; revisión del DoD pendiente. |
| E2-BE-02                               | Implementado/verificado; revisión/cierre pendientes.                               | [Rachas globales](../verificaciones/E2-BE-02-rachas.md): función pura y HTTP real con MongoDB temporal; 19 pruebas puras y ocho HTTP nuevas. Sin commit.                                                                                     |
| E2-FE-01                               | Panel integrado/verificado; revisión/cierre pendientes.                            | db3efbe para cliente previo y [panel](../verificaciones/E2-FE-01-panel.md) nuevo; detalle E1 conservado. Sin commit del nuevo corte.                                                                                                         |
| E2-FE-02                               | Implementado/verificado; revisión/cierre pendientes.                               | [Rachas React](../verificaciones/E2-FE-02-rachas.md), estados independientes, ceros y desfase entre DTO. Sin commit.                                                                                                                         |
| E2-FE-03                               | Implementado/verificado; revisión/cierre pendientes.                               | [Crear meta](../verificaciones/E2-FE-03-crear-meta.md), POST/validaciones/409 y recuperación sin duplicados. Sin commit.                                                                                                                     |
| E2-FE-04, E2-FE-05, E2-FE-06           | Pendientes de implementación.                                                      | Edición, confirmación de desactivación y gestión de hitos no se ejecutaron en este bloque.                                                                                                                                                   |
| E2-VIS-01                              | Base implementada/verificada; revisión/cierre pendientes.                          | 0fedabd; [evidencia](../verificaciones/E2-VIS-01.md). Tokens/fallbacks; sin nuevas fuentes instaladas.                                                                                                                                       |
| E2-VIS-02                              | Parcial: marco/navegación/biblioteca verificados; ticket abierto.                  | 8904efc; [corte 1](../verificaciones/E2-VIS-02-corte-1.md). Formularios/historial E1 pendientes.                                                                                                                                             |
| E2-VIS-03                              | Parcial: detalle/panel/rachas/formulario crear verificados; ticket abierto.        | [Navegador del bloque](../verificaciones/E2-bloque-progreso-rachas-creacion.md). Falta adaptar los componentes FE-04/05/06 cuando se implementen.                                                                                            |
| E2-INT-01                              | Parcial: cascada Meta y reconsulta de flujos actuales verificadas; ticket abierto. | Borrado real de partida actualiza resumen/progreso/rachas; creación actualiza progreso. Se ampliará con FE-04/05/06.                                                                                                                         |
| E2-INT-03, E2-INT-04                   | Pendientes de consolidación.                                                       | INT-03 sin implementar: cambio de día/foco/visibilidad. INT-04 requiere flujos pendientes; no basta con pruebas de este bloque.                                                                                                              |

Total: **23 tickets, 2 cerrados y 21 abiertos**. De los abiertos, 12 tienen
cortes funcionales verificados (HAB-04/05/06; BE-01/02/03/05/06/07; FE-01/02/03),
cuatro tienen alcance parcial (VIS-01/02/03 e INT-01) y cinco requieren su corte
pendiente (FE-04/05/06 e INT-03/04). No equivale a certificar todo el DoD.

El [informe conjunto](../verificaciones/E2-bloque-progreso-rachas-creacion.md)
registra tests, TypeScript, navegador, archivos y limitaciones. Esperar revisión
antes del siguiente bloque o un commit. FE-04 → FE-05 → FE-06 siguen como pasos
funcionales posteriores, cada uno según sus dependencias; esta actualización
no los ejecuta. Los cierres HAB-04/05/06 y VIS previos tampoco se presumen.
PA01 sigue pendiente de la ficha original; se conservan contratos aprobados.

## 14. Matriz de trazabilidad y verificación

Fuentes canónicas: [PRD](../prd/savepoint.md), [épicas](epicas.md),
[spec BE](../specs/E2-backend.md) y [spec FE](../specs/E2-frontend.md).
BE/FE en la tabla remiten a esas specs; los IDs BE-AC/FE-AC son sus escenarios.
En las columnas de tickets, HAB/BE/FE/INT/VIS abrevia el prefijo E2; una barra
separa sufijos del mismo prefijo (BE-01/02 significa E2-BE-01 y E2-BE-02).
Los métodos describen la aceptación completa prevista; la última columna separa
la evidencia ya registrada de lo que falta. Nombrar un test o disponer de un
runner no significa haber ejecutado aceptación funcional E2 ni pruebas UI.

| Decisión  | Historia / épica                  | Criterio PRD | Tickets responsables                        | Spec / escenario                          | Método de verificación                                                                                                                                                                      | Evidencia actual                                                                                                                                    |
| --------- | --------------------------------- | ------------ | ------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| H1/H3     | HU01, HU07 / E1-02, E2-02         | AC01         | HAB-03/04, BE-01, FE-01, INT-04             | BE-AC01, FE-AC01; contrato de fecha civil | Unitarias de calendario y TZ, HTTP local de partidas y UI de formulario/historial/resumen; toda la duración queda en el día declarado.                                                      | HAB-03 cerrado y HAB-04 verificado; panel semanal FE-01 ahora integrado/verificado. Cierres HAB-04/FE-01 pendientes.                                |
| H1        | HU01 / E2-02                      | AC02         | BE-01, FE-01, INT-04                        | BE-AC01, FE-AC01                          | Reloj de referencia controlado, límites inclusivos lunes/domingo y exclusión de 08/16; fijar hoy al 15/11 para incluir el domingo sin contradecir P02.                                      | Cálculo/HTTP BE-01 y panel React FE-01 verificados; semana visible según DTO, sin calcularla otra vez en React.                                     |
| H2/H3     | HU03, HU04 / E2-01/02             | AC03         | BE-03/05, FE-03/04, VIS-03, INT-04          | BE-AC02, FE-AC02                          | Unitarias y HTTP de cumplimiento; UI con 420 minutos/2 días, objetivo 300 minutos/3 días: 140 %, barra 100, no cumplida.                                                                    | Backend y UI verifican 140 %, barra 100 y condición conjunta; creación FE-03 probada. Edición FE-04 pendiente.                                      |
| H3/H4     | HU01, HU02 / E2-02/03             | AC04         | BE-01/02, FE-01/02, INT-04                  | BE/FE §9, verificación dirigida AC04      | Dos sesiones de 30/60 minutos del juego A y 15 del B en la misma fecha: A=90 minutos/1 día, B=15/1; rachas globales=1/1. Unitarias de ambas funciones, GET de progreso/rachas y UI con DTO. | Fixture dirigido en rachas.http.test.ts y rachas.test.tsx: A=90 min/un día, rachas globales 1/1. Backend y UI verificados.                          |
| H4        | HU02, HU07 / E2-03                | AC05         | BE-02, FE-02, INT-03/04                     | BE-AC03, FE-AC10                          | Reloj/TZ controlados para hoy/ayer y corte de día; UI con timers/foco/visibilidad y limpieza StrictMode según P06.                                                                          | Rachas puras/HTTP verifican corte de día y cuatro TZ; UI descarta consultas canceladas bajo StrictMode. Timers/foco/visibilidad INT-03 pendientes.  |
| H4/H6/H7  | HU07 / E2-02/03/04/06             | AC06         | BE-01/02, INT-01/04                         | BE-AC09, FE-AC08                          | Unitarias y HTTP local tras altas/bajas/retroactividad y borrado de juego; UI reconsulta; una partida restante conserva el día global.                                                      | HTTP verifica recálculo y cascada a Meta; UI reconsulta progreso/rachas/resumen tras borrar partida. Flujos FE-04/05/06 pendientes de integración.  |
| H5        | HU03, HU04, HU06 / E2-01/04       | AC07         | BE-03/05/07, FE-03/04/06, INT-04            | BE-AC05/06, FE-AC04; P04/P05              | Tablas de límites/tipos y ausencia de mutaciones; HTTP local, concurrencia con índice real y UI de validación/conservación de campos.                                                       | Modelo, DTO, parser 400/413 y creación UI/validaciones/borrador verificados; edición/hitos UI pendientes.                                           |
| H5/H6     | HU03, HU04 / E2-01/02             | AC08         | BE-03/05, FE-03/04, INT-04                  | BE-AC05/07/11, FE-AC04                    | HTTP concurrente con índice creado y escrituras condicionales; una sola activa, actividad previa incluida, edición recalcula y carrera PUT/DELETE no reactiva.                              | Índice real/concurrencia/PUT/DELETE backend y creación UI con 409/POST único verificados; edición UI pendiente.                                     |
| H6/H8     | HU05 / E2-01                      | AC09         | BE-06, FE-05, INT-04                        | BE-AC07, FE-AC05                          | HTTP DELETE 204/repetición; UI de cancelar/confirmar, teclado/foco, reconsulta y error sin pérdida de actividad.                                                                            | DELETE lógico/idempotente y actividad conservada verificados en backend; rachas ya visibles. Confirmación/desactivación FE-05 pendientes.           |
| H7        | HU06, HU07 / E2-04/06             | AC10         | BE-07, FE-06, INT-01/04                     | BE-AC08, FE-AC06/08                       | Unitarias y HTTP de máximo 80/30/70 e hito 75; borrar el 80 devuelve pendiente. UI reconsulta, IDs estables y logros E1 intactos.                                                           | Hitos derivados/recalculo del máximo backend verificados; editor/lista/reconsulta de hitos FE-06 pendientes.                                        |
| H8        | HU01, HU02, HU05 / E2-02/03/05    | AC11         | BE-01/02/06, FE-01/02/05, INT-04            | BE-AC04, FE-AC03                          | Unitarias y HTTP con/sin meta y sin partidas; UI distingue ceros de null, conserva avance/rachas e invita a crear meta.                                                                     | Backend y UI presentan actividad/avance/rachas sin meta, null/ceros diferenciados y creación funcional; FE-05 pendiente.                            |
| H9/H4     | HU02, HU03, HU04 / E2-01/03/05    | AC12         | BE-02/03/05, FE-02/03/04, INT-04            | BE-AC06, FE-AC07                          | HTTP y UI de crear/editar/cambiar estado Completado/Abandonado; meta permanece y partidas cuentan en racha global.                                                                          | Todos los estados en rachas HTTP; creación backend/UI Completado/Abandonado verificada. Edición UI FE-04 pendiente.                                 |
| E1, H1–H9 | HU07, HV01–HV03 / E1-05, E2-05/06 | AC13         | HAB-01/03/04/05/06, INT-01/04, VIS-01/02/03 | Regresiones E1, BE §9, FE-AC08/11/12      | HTTP local de E1, UI de estados/recuperación; revisión manual por vista de móvil/escritorio, teclado, contraste, tamaño y movimiento reducido.                                              | Regresiones E1 completas y navegador con Express/MongoDB temporal para el bloque actual. Faltan formularios/historial VIS-02 y flujos E2 restantes. |

### Criterios de contrato y habilitantes complementarios

| Criterio / fuente                                     | Ticket responsable                                            | Método previsto o evidencia existente                                                                                                                                                                                                                     |
| ----------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BE-AC10 y contrato HTTP 400/404/409/413/500/requestId | BE-03 según C05/T3; regresión en cada corte afectado e INT-04 | HTTP local negativo: parser, tamaño, validación, duplicados y fallos controlados. C05/T3 autorizado y verificado: JSON roto/escalar 400 y tamaño 413 con requestId, sin escrituras; caracterizaciones anteriores sustituidas por aceptación del contrato. |
| BE-AC11                                               | BE-03/06 e INT-04                                             | Ejecutado en metas.crud.test.ts: DELETE ganador impide PUT y conserva la meta inactiva; cierre transversal pendiente.                                                                                                                                     |
| FE-AC09                                               | FE-01/02, INT-03/04                                           | Cliente, hook/UI, respuestas fuera de orden, cancelación/StrictMode y desfase entre DTO verificados. INT-03 (cambio de día/foco/visibilidad) pendiente.                                                                                                   |
| FE-AC12                                               | FE-03/04/05, INT-01/04                                        | Ejecutado para FE-03: carga parcial, 500/no JSON y POST confirmado con GET fallido; solo reintentar lectura. Red incierta obliga a consultar antes de otro POST. FE-04/05 pendientes.                                                                     |
| B5 / DoD HAB-01                                       | HAB-01                                                        | Ejecutado y cerrado: runners aislados, regresión E1 y estados UI; [evidencia](../verificaciones/E2-HAB-01.md). No cubre por sí solo aceptación E2.                                                                                                        |
| B3 / DoD HAB-05                                       | HAB-05                                                        | Ejecutado, cierre pendiente: resolver puro, ambos clientes con fetch simulado y rechazo previo a red; [evidencia](../verificaciones/E2-HAB-05.md). Sin certificar Render ni proxy real.                                                                   |
| B1/B2 / DoD HAB-03/04                                 | HAB-03/04                                                     | HAB-03 cerrado y HAB-04 implementado/verificado: calendario, HTTP, selector y presentación en cuatro TZ. Evidencia HAB-03/04; cierre HAB-04 pendiente.                                                                                                    |
| B4 / DoD HAB-06                                       | HAB-06                                                        | Ejecutado: 10 pruebas dirigidas de formulario, error y reintento manual; siete casos en navegador con API sintética. [Evidencia HAB-06](../verificaciones/E2-HAB-06.md); cierre pendiente.                                                                |

## 15. Precedencia SDD en Git

| Entrega                                     | Hecho comprobado en Git                                                                                                              | Lectura de trazabilidad                                                                                                                                                      |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PRD, épicas y backlog                       | Incorporados en 873d26f.                                                                                                             | Documentación de producto previa a HAB-01 y HAB-05.                                                                                                                          |
| Specs BE/FE y primera base de HAB-01        | Ambos documentos se incorporaron por primera vez en ca734b6, junto con código/configuración/tests de HAB-01; no estaban en su padre. | Excepción histórica: aprobación previa en conversación, pero no hubo un commit de specs anterior al código inicial de HAB-01. No se inventa precedencia ni se reescribe Git. |
| Ampliaciones y cierre HAB-01                | b67caa4 y 25d1daf posteriores a ca734b6.                                                                                             | Specs ya versionadas; cierre explícito registrado en su evidencia.                                                                                                           |
| HAB-05                                      | Código, pruebas y evidencia en 1e528cb, posterior a ca734b6 y 25d1daf.                                                               | Specs existentes anteriores al código; plan concreto aprobado en conversación. Cierre todavía pendiente.                                                                     |
| Modelo Meta y actualización de trazabilidad | 03f8564 incorpora modelo, pruebas y actualización de specs; las reglas de modelo/índice ya estaban en ca734b6.                       | No se acredita una precedencia separada para la regularización de 03f8564 respecto al modelo de ese mismo commit. No se trata como código sin contrato previo.               |
| CRUD Meta y progreso semanal                | a6663ff incorpora servicios, rutas y pruebas de BE-01/03/05/06/07, después de 03f8564.                                               | Contratos y reglas aplicables ya versionados; evidencia por cortes, sin cierre automático ni rachas.                                                                         |
| Cliente de progreso FE-01                   | db3efbe incorpora metasApi, tipos y pruebas, después de las specs.                                                                   | Corte técnico; no acredita componentes ni aceptación del ticket completo.                                                                                                    |
| Base visual VIS-01                          | 0fedabd incorpora tokens, Tailwind y pruebas, después de la spec frontend.                                                           | No acredita VIS-02/03 ni sustitución de las pantallas E1.                                                                                                                    |
| Revisión documental del 12 de noviembre     | Incluida en 59bfc98 junto con HAB-03/04.                                                                                             | Corrige estados y evidencia, sin cambiar reglas/criterios ni reescribir la historia. Nuevos cambios de contrato requerirían aprobación y commit de spec previo al código.    |

La excepción de HAB-01 es documental y no revoca el cierre ya aprobado ni obliga
a rehacer su implementación. Para los siguientes tickets se comprobará que la
versión aplicable de la spec figure en un commit anterior al código, además de
la aprobación explícita y del plan concreto. Esta regularización solo modifica
documentación, sin staging, commit ni push. La
[revisión consolidada](../verificaciones/E2-estado-implementacion.md) diferencia
los resultados históricos registrados de las verificaciones documentales actuales.
