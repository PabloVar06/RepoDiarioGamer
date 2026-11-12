# Spec E2 — Frontend e integración visual de SAVEPOINT

Fecha de redacción: 11 de noviembre de 2026. Estado: **aprobada por el usuario en conversación**.

Aprobación registrada: «Si esta bien los specs estan aprobados». Se conservan
H1–H9, reglas, contratos, criterios y decisiones aprobadas. La ejecución requiere
además un plan aprobado para cada ticket; aprobar esta spec no acredita su implementación.

Fuentes: [AGENTS.md](../../AGENTS.md), [DESIGN.md](../../DESIGN.md),
[PRD](../prd/savepoint.md), [épicas](../backlog/epicas.md),
[backlog de 23 tickets](../backlog/E2-metas-y-rachas.md),
[diagnóstico](../diagnostico.md) y [spec backend](E2-backend.md).

## 1. Alcance

- Servicio `metasApi.ts`, tipos de Meta/progreso/rachas y componentes E2.
- Detalle con resumen E1 preservado, actividad semanal, meta/hitos y rachas globales.
- Crear/editar objetivos e hitos; confirmar desactivación; estados de carga,
  error, vacío, envío y éxito; recuperación sin perder formularios.
- Reconsulta tras mutaciones del diario o metas y política de cambio de periodo.
- Corrección acotada B2/B3/B4 y pruebas de interfaz B5, sin asumir resuelta toda
  T1/T2/T4. La prevención de duplicados se exige a los formularios E2 nuevos.
- Adopción de Nebula Arcade por tokens y por cortes visuales explícitos.

No añade seguimiento automático, formularios de hora de inicio/fin, edición de
partidas, reactivación de metas, vista histórica, nuevas bibliotecas UI, tienda,
descargas, rankings, notificaciones ni gráficos históricos.

## 2. Registro de contradicciones y decisiones previo a la aprobación

Se conserva el análisis original siguiente como antecedente. Sus referencias
a aprobación pendiente describen la redacción inicial, no el estado actual de esta spec.

| ID    | Diferencia detectada                                                                                                           | Tratamiento propuesto                                                                                                                                          |
| ----- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-C01 | “CRUD” en la solicitud actual frente a desactivación H6/H8 del PRD.                                                            | Seguir C01 backend: UI dice Desactivar meta y DELETE desactiva lógicamente. No mostrar Borrar meta ni reactivar sin nueva decisión.                            |
| F-C02 | Backlog VIS-02 reserva el alcance visual E1; DESIGN.md aplica también a biblioteca/formularios/historial.                      | Adoptar VIS-01/VIS-03 para E2 y definir un corte E1 propuesto separado, P-VIS, más abajo. No interpretar el diseño como autorización de rediseño ilimitado.    |
| F-C03 | T1 difiere reorganización general de App.tsx, pero E2 necesita componentes.                                                    | Extraer solo Detalle si es necesario e incorporar componentes/hooks E2. Mantener rutas y el resto de pantallas salvo cortes visuales explícitamente aprobados. |
| F-C04 | PA06 no define refresco de pantalla abierta; H4 define racha al terminar el día y el backlog INT-03 espera esa decisión.       | Proponer P06 con reconsulta al cambio de día, foco y vuelta a visibilidad, no polling continuo ni notificaciones.                                              |
| F-C05 | Diagnóstico B5 dice sin tests y el harness tiene tests Python.                                                                 | La carencia es de suites del producto. Proponer runner frontend aislado; no dar por cubierta interacción con pruebas del harness.                              |
| F-C06 | H8 pide porcentaje de avance sin meta; no hay objetivo para porcentaje de cumplimiento.                                        | Mostrar siempre avance E1; mostrar “Sin meta activa” para cumplimiento, cuyo dato es null. No transformar ese null en 0 %.                                     |
| F-C07 | Los headers de PRD/épicas conservan pendiente/para revisión aunque su aprobación está registrada en conversación/backlog.      | Usar H1–H9 aprobados y mantener estas specs como borradores. No cambiar fuentes ajenas a esta tarea.                                                           |
| F-C08 | VIS-01 cambia tokens/Tailwind compartidos y puede alterar E1 aunque no se editen componentes, mientras VIS-02 sigue reservado. | Aprobar ese efecto global en P-VIS o limitar temporalmente tokens nuevos a vistas E2. No afirmar aislamiento visual por no tocar App.tsx.                      |

### Resoluciones aprobadas comunes y de interfaz

Las condiciones pendientes del análisis F-C01–F-C08 describen el antecedente
anterior a la aprobación. El estado consolidado vigente está en el
[PRD](../prd/savepoint.md#estado-consolidado-de-decisiones-pa).

- **P02/P03/P04/P07:** aplicar las resoluciones aprobadas de PA02, PA03, PA04 y
  PA07 descritas en backend. No inventar validaciones diferentes en UI.
- **P05 / PA05:** objetivo mediante dos controles etiquetados Horas y Minutos,
  ambos enteros; horas 0–100, minutos 0–59 y total de 1–6000 minutos. A 100 horas
  solo se permite minuto 0. Días enteros 1–7. Mostrar objetivo como horas/minutos,
  actividad como horas con hasta dos decimales y equivalente en minutos disponible,
  y porcentaje con hasta dos decimales (`es-EC`), sin redondear para decidir cumplimiento.
  Si el redondeo llevara un valor menor de 100 a “100 %”, mostrar “<100 %” y no
  marcar cumplido: prevalece la comparación precisa de backend. Valores que
  exceden 100 conservan su condición de exceso aunque el formato deba mostrar
  “>100 %” para un exceso menor que la precisión visible. Esta precisión forma parte de la spec aprobada.
- **P06 / PA06:** usar `fechaLocalActual` y zona del backend como referencia.
  Mientras la vista está visible, programar una única próxima reconsulta en el
  siguiente cambio de día de Guayaquil; reprogramar tras responder. Al recuperar
  foco/visibilidad, reconsultar para cubrir suspensión de pestaña. No hacer polling
  periódico. Un temporizador puede retrasarse por el navegador: actualizar al
  recuperar ejecución y no prometer cambio de DOM exacto con la pestaña suspendida.
- **P-VIS:** la renovación E1 descrita para VIS-02 incluye navegación/layout,
  biblioteca, formularios de videojuegos/partidas e historial, con cambios solo
  de tokens, jerarquía, espaciado, controles y estados. No cambiar rutas, modelo
  de logros, búsqueda concurrente ni campos de negocio. El detalle E1/E2 queda
  en VIS-03. La ejecución de este alcance requiere su plan aprobado por ticket/vista.

La aprobación de la spec no permite ampliar estas resoluciones ni ejecutar otros
tickets sin su plan aprobado. PA01 sigue pendiente de la ficha externa ausente;
las resoluciones anteriores no se reabren por esta regularización documental.

## 3. Reglas DEBE / NO DEBE

1. DEBE conservar E1, sus rutas y resumen acumulado, incluido máximo avance.
2. DEBE mostrar actividad por videojuego y rachas globales con etiquetas claras.
   NO DEBE calcular una racha separada usando solo las partidas del detalle.
3. DEBE mostrar avance E1 aun sin meta. NO DEBE representar cumplimiento null
   como 0 %, ocultar horas/días sin meta o depender del estado del juego para ofrecer meta.
4. DEBE mostrar horas y días como condiciones distintas; NO DEBE anunciar meta
   cumplida solo por llegar al 100 % de horas.
5. DEBE limitar la barra a 100 sin recortar el porcentaje real de texto. Un estado
   inválido de datos NO DEBE sustituirse silenciosamente por ceros.
6. DEBE enviar fechas civiles de inicio como YYYY-MM-DD, sin convertirlas a
   instantes con `new Date(fecha).toISOString()`; el selector NO DEBE pedir hora.
7. DEBE conservar formulario y valores ante error de envío y bloquear envíos
   repetidos mientras haya solicitud pendiente. NO DEBE reintentar POST automáticamente.
8. DEBE reconsultar el progreso del servidor tras mutaciones exitosas. NO DEBE
   mantener cálculos de negocio duplicados como fuente de verdad en React.
9. DEBE aplicar DESIGN.md en las vistas aprobadas usando tokens únicos y Tailwind
   existente. NO DEBE introducir colores arbitrarios ni librerías de UI nuevas.
10. DEBE resolver B2/B3/B4 en sus cortes aprobados; NO DEBE usar E2 para una
    refactorización general de App.tsx o del cliente HTTP E1.
11. NO DEBE leer/modificar `.env`, ejecutar tests/build que los carguen ni
    implementar antes de aprobación de esta spec y las propuestas afectadas.

## 4. Contratos del servicio metasApi.ts

Backend es la fuente canónica de DTO y estados HTTP; la tabla siguiente DEBE
mantenerse alineada con la sección 5 de la spec backend. Al 12 de noviembre de
2026 existen los endpoints backend de metas/progreso; falta el de rachas. En el
cliente solo está implementado `metasApi.progreso`; los demás métodos de esta
tabla siguen previstos para sus tickets. App.tsx todavía no consume metasApi.

| Método de servicio       | Contrato HTTP                       | Resultado                                      |
| ------------------------ | ----------------------------------- | ---------------------------------------------- |
| `crear(datos)`           | POST `/api/metas` con CrearMeta     | MetaDTO; 201.                                  |
| `obtener(id)`            | GET `/api/metas/:id`                | MetaDTO; 200.                                  |
| `activa(videojuegoId)`   | GET `/api/videojuegos/:id/meta`     | Objeto `{ meta: MetaDTO o null }`; 200.        |
| `actualizar(id, datos)`  | PUT `/api/metas/:id` con EditarMeta | MetaDTO; 200.                                  |
| `desactivar(id)`         | DELETE `/api/metas/:id`             | Sin resultado ni intento de parsear JSON; 204. |
| `progreso(videojuegoId)` | GET `/api/videojuegos/:id/progreso` | ProgresoJuegoDTO; 200.                         |
| `rachas()`               | GET `/api/rachas`                   | RachasDTO; 200.                                |

GET debe admitir señal de cancelación. NO se envía cuerpo en consultas ni se
añaden query params de usuario/periodos históricos. La vista Detalle usa progreso
y rachas; no está obligada a pedir además activa si ya recibe meta en progreso.

### Base URL y prefijo

La configuración `VITE_API_URL` significa base completa **con `/api`**, según
B3. El servicio añade solo `/metas`, `/rachas` o `/videojuegos/...`; no duplica
el prefijo. Se propone compartir únicamente la resolución de BASE en
`frontend/src/api/baseUrl.ts` y alinear los clientes existentes en HAB-05.
No se exige fusionar sus implementaciones request ni resolver toda T2.

Propuesta de fallback: `/api` solo en desarrollo con proxy de Vite; en build
de producción sin base configurada, error comprensible de configuración y no
conexión silenciosa al localhost del usuario. No se revisan ni editan `.env`
para comprobarlo: usar configuración sintética en pruebas.

### Tipos e interfaces de datos

| Tipo             | Datos que consume la interfaz                                                                                                                                                                            |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MetaDTO          | `_id`, `videojuego`, `minutosObjetivo`, `diasPorSemana`, `hitos`, `activa`, `createdAt`, `updatedAt`. Hito tiene `_id`, `descripcion`, `porcentajeObjetivo`.                                             |
| CrearMeta        | `videojuego`, `minutosObjetivo`, `diasPorSemana` e `hitos` opcionales nuevos sin ID, con los nombres exactos del backend.                                                                                |
| EditarMeta       | minutosObjetivo/diasPorSemana requeridos; hitos omitidos conservan la lista, [] la vacía. Conservar IDs de hitos existentes al editar y no emparejarlos por descripción.                                 |
| ProgresoJuegoDTO | ID juego, zonaHoraria, fechaLocalActual, semana inicio/fin, minutosSemana, horasSemana, diasJugados, porcentajeAvanceActual, meta o null, porcentajeHoras o null, metaCumplida o null e hitos evaluados. |
| RachasDTO        | ámbito global (`ambito`), zonaHoraria, fechaLocalActual, rachaActual y mejorRacha.                                                                                                                       |
| ErrorApi         | status HTTP o ausencia de status en fallo de red, mensaje, requestId opcional, detalles de campo opcionales. Sin exponer stack ni valores sensibles.                                                     |

Los nombres exactos de campos DTO son los del backend. La UI NO DEBE convertir
un null de ausencia en dato numérico ni aceptar IDs de otro juego al cambiar de ruta.
En el envío, transformar horas/minutos a un entero una sola vez y validar antes
de llamar al servicio. NO convertir horas decimales redondeadas para producir el objetivo.

La edición de solo objetivos puede omitir hitos; el editor completo envía la
lista íntegra con IDs conservados. Los campos protegidos (`activa`, dueño,
timestamps) NO aparecen como inputs ni se reenvían desde un objeto MetaDTO entero.

## 5. Componentes, límites y organización de App.tsx

Nombres/rutas previstos; no se crean en esta fase. Conservar rutas públicas E1.
Formularios de metas se proponen como paneles dentro del detalle, sin nuevas
rutas ni navegación adicional obligatoria.

| Pieza                    | Responsabilidad / interfaz conceptual                                                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `DetalleVideojuego`      | Página extraída de Detalle solo para integrar E2; recibe ID de ruta y compone resumen E1, actividad, rachas y acciones. No aloja todos los formularios en App.tsx. |
| `useProgresoVideojuego`  | Orquesta carga/reconsulta, error, cancelación y control de respuestas obsoletas para el ID actual; no calcula reglas de rachas/hitos.                              |
| `ProgresoSemanal`        | Recibe ProgresoJuegoDTO; presenta semana, horas/días, objetivos, porcentaje y condición conjunta, sin inferirla del texto redondeado.                              |
| `RachasGlobales`         | Recibe RachasDTO o su estado de carga/error; muestra dos valores con nombre global, aun sin meta.                                                                  |
| `MetaForm`               | Modo crear/editar, datos iniciales, callbacks de guardar/cancelar, estado de envío y errores. Gestiona horas/minutos/días e integra editor de hitos en su corte.   |
| `HitosEditor`            | Lista de 0–5 entradas, preservación de IDs y validación de P04; no checkboxes de “alcanzado” editables.                                                            |
| `HitosLista`             | Estados calculados Alcanzado/Pendiente con texto/icono y objetivo; no muta la lista.                                                                               |
| `ConfirmarDesactivacion` | Confirmación accesible explícita, cancelar/confirmar y estado pendiente/error; no llama DELETE al abrirse.                                                         |
| `EstadoCargaError`       | Mensaje y reintento, con recuperación accesible; no convierte un error en vacío ni desmonta el formulario por error de envío.                                      |

App.tsx DEBE conservar su responsabilidad de router/layout y las pantallas E1
no extraídas. No se propone una migración completa a una nueva estructura.
Un fallo de rachas no DEBE ocultar el resumen E1 ni las horas ya disponibles;
un fallo parcial se presenta en su sección, con reintento.

## 6. Formularios y estados

| Situación                                         | Comportamiento obligatorio                                                                                                                           |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Carga inicial                                     | Mensaje de carga por bloque; no mostrar ceros como si fueran datos cargados ni crear una meta antes de conocer si existe activa.                     |
| Juego inexistente / 404                           | Mensaje de recurso no encontrado y regreso a biblioteca; no ofrecer crear meta para ID inválido.                                                     |
| Sin meta                                          | Mostrar actividad/avance E1 y rachas globales; invitar a crear; cumplimiento no aplicable y sin barra engañosa.                                      |
| Meta activa                                       | Objetivos, horas/días observados, porcentaje y cumplimiento conjunto. Acciones editar/desactivar disponibles en todos los estados del juego.         |
| Creación/edición                                  | Validar horas/minutos/días e hitos, mostrar errores junto a campos, bloquear doble envío; cancelar no hace escritura.                                |
| 400                                               | Mapear detalles de campo, mostrar resumen accesible y mantener valores. Si faltan detalles, mensaje general sin inventar errores por campo.          |
| 409 al crear                                      | Informar que ya existe meta y reconsultar progreso. No volver a enviar POST automáticamente ni pisar el borrador sin avisar.                         |
| 409 al editar                                     | Informar que cambió el estado de la meta; conservar el borrador separado, reconsultar y no editar la inactiva como si siguiera activa.               |
| Desactivación                                     | Confirmación con explicación de conservación del diario. Cancelar no cambia datos; confirmar envía una vez y muestra resultado.                      |
| Red / 500 / fallo de formato de respuesta         | Mensaje comprensible y reintento explícito; preservar formulario. Mostrar requestId si existe para diagnóstico sin detalles internos.                |
| Guardado exitoso y GET posterior fallido          | Mantener constancia de que la escritura se confirmó y avisar que no se pudo actualizar la vista. Reintentar solo consulta; no duplicar la escritura. |
| Error durante envío por resultado incierto de red | No asumir ni éxito ni ausencia de escritura. Antes de un nuevo POST ofrecer reconsultar la meta, conservando el borrador.                            |

Confirmar desactivación propuesta con diálogo propio accesible: foco inicial
en Cancelar, Escape cancela y cierre devuelve foco al disparador; etiquetas y
estado pendientes claros. No introducir una biblioteca de diálogos.
Las confirmaciones existentes de eliminación de partidas/juegos no se eliminan
por adoptar el nuevo diseño y no requieren migración general en este alcance.

## 7. Reconsulta y cambio de periodo

| Acción exitosa                                                         | Datos que se deben reconsultar                                                                                                                |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Crear/editar/desactivar meta                                           | Progreso del juego; si el bloque de rachas se vuelve a cargar, no inferir que la mutación las cambió.                                         |
| Registrar/eliminar partida                                             | Historial pertinente, resumen E1, progreso del juego y rachas globales. Al navegar al detalle, su carga cubre esa reconsulta.                 |
| Eliminar videojuego                                                    | Biblioteca y rachas cuando vuelvan a mostrarse; abandonar el detalle eliminado. No pedir progreso del ID borrado para intentar reconstruirlo. |
| Volver a una vista, recuperar foco/visibilidad o cambiar día según P06 | Progreso y rachas para el día vigente; evitar solicitudes duplicadas por foco/visibilidad simultáneos.                                        |

Un mecanismo local al flujo es suficiente: no introducir store global o bus de
eventos solo para E2. Las mutaciones de E1 fuera del detalle reconsultan cuando
corresponda por navegación; no se exige sincronización entre pestañas.

Al cambiar ID o desmontar, cancelar consultas/descartar respuestas anteriores.
No permitir que el resultado de un juego sustituya al de otro. Si progreso y
rachas tienen `fechaLocalActual` distinta, reconsultar ambos antes de presentarlos
como un conjunto del mismo día. No añadir polling infinito al recuperar errores.
Los timers/listeners DEBEN limpiarse y ser seguros bajo StrictMode.

P06 requiere tests con reloj controlado, retorno de foco y pestaña suspendida.
No se promete transacción/snapshot entre GETs: ante escrituras concurrentes,
se presenta el último resultado confirmado y se ofrece reintento si falla la carga.

## 8. Adopción visual de Nebula Arcade

DESIGN.md DEBE seguir siendo la única fuente de verdad visual; esta spec no lo
reescribe. Colores en variables CSS únicas; Tailwind consume esas variables y
los componentes NO duplican hexadecimales. Mantener modo oscuro y nombre SAVEPOINT.

| Corte / regla                | Aplicación prevista                                                                                                                                                                                                                 |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| VIS-01                       | Tokens de fondo/panel/primario/acento/destacado/textos/éxito/error/borde según DESIGN.md; reutilizar Tailwind, no instalar framework UI.                                                                                            |
| Tipografía                   | Títulos Nebula solo con recurso/licencia disponible; si no, Orbitron y fallbacks previstos. Cuerpo Poppins y fallbacks. Proponer conservar fallbacks si no se dispone de recurso verificable; no descargar fuentes automáticamente. |
| Jerarquía                    | Escala 32/24/18/16/14 px y pesos de DESIGN.md; títulos mayúsculos, display no usado en párrafos ni errores.                                                                                                                         |
| Acciones                     | Una acción primaria coral por contexto; secundarias delineadas violetas, sin relleno violeta. Destructivas con confirmación/texto.                                                                                                  |
| Superficies                  | Sin sombras decorativas, un degradado decorativo máximo por pantalla, radios y espaciados de DESIGN.md. No introducir más degradados en barras.                                                                                     |
| VIS-03                       | Resumen E1 conservado y junto a progreso semanal, rachas globales claramente nombradas y metas/hitos con los estados aprobados.                                                                                                     |
| VIS-02, condicionado a P-VIS | Navegación/biblioteca/formularios E1/historial: solo corte visual acordado. No resolver D1/D2 ni refactorizar todas las pantallas.                                                                                                  |
| Accesibilidad                | Contraste de texto normal ≥4,5:1, controles ≥44 px, etiquetas reales, foco violeta 3 px con separación 3 px, estado expresado con texto/icono y avisos dinámicos accesibles.                                                        |
| Barra                        | Valor accesible limitado al rango visual 0–100, con texto accesible/visible del porcentaje real. Sin meta no hay barra de cumplimiento con valor inventado.                                                                         |
| Móvil/escritorio             | Una columna cuando no alcance el ancho, sin scroll horizontal por tarjetas/formularios; áreas seguras preservadas.                                                                                                                  |
| Movimiento                   | Respetar prefers-reduced-motion. Evitar observer/animaciones duplicadas al extraer componentes; GSAP existente es opcional, no un requisito funcional.                                                                              |

Cualquier retirada de sombras/degradados, cambio tipográfico o sustitución de
tokens es implementación visual y NO se realiza al redactar esta spec.

## 9. Casos límite, criterios y verificaciones

| ID      | DADO / CUANDO / ENTONCES                                                                                                                                                      | Verificación futura                                                               |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| FE-AC01 | DADO un día de inicio elegido en Ecuador, CUANDO envío y veo historial/resumen, ENTONCES conserva el día sin campo de hora ni conversión de instante.                         | AC01/AC02; prueba de formulario y representación con distintos TZ.                |
| FE-AC02 | DADO 420 minutos/2 días y meta 5 horas/3 días, CUANDO carga el detalle, ENTONCES texto 140 %, barra 100 y meta no cumplida.                                                   | AC03; contraste entre texto, aria y estado conjunto.                              |
| FE-AC03 | DADO juego sin meta, CUANDO consulto, ENTONCES horas/días, avance y rachas globales permanecen visibles, con invitación a crear y sin falso 0 % de cumplimiento.              | AC11, incluidos ceros reales y error distinto de vacío.                           |
| FE-AC04 | DADO meta válida o inválida, CUANDO guardo dos veces rápidamente o el servidor rechaza, ENTONCES hay un solo envío pendiente y los valores siguen disponibles al fallar.      | AC07/AC08; 400, 409 y fallo de red.                                               |
| FE-AC05 | DADO una meta activa, CUANDO cancelo o confirmo desactivación, ENTONCES cancelar no envía DELETE; confirmar envía una vez, respeta 204 y reconsulta sin borrar actividad.     | AC09; teclado/foco y fallo de consulta posterior sin repetir DELETE.              |
| FE-AC06 | DADO hitos conocidos y máximo avance, CUANDO edito o borro la sesión máxima, ENTONCES IDs se conservan y se muestran estados reconsultados sin checkboxes manuales.           | AC10; máximo 5, edición con omisión/lista vacía y errores P04.                    |
| FE-AC07 | DADO juego Completado/Abandonado, CUANDO creo/edito/cambio el estado, ENTONCES las acciones de meta siguen disponibles y no hay desactivación automática.                     | AC12; probar también juego sin meta.                                              |
| FE-AC08 | DADO altas/bajas de partidas, CUANDO regreso/actualizo el detalle, ENTONCES historial, resumen, progreso, hitos y rachas reflejan el conjunto existente.                      | AC06/AC10/AC13; borrado de juego redirige sin consultar ID inexistente.           |
| FE-AC09 | DADO consultas de juegos diferentes o fechas de respuesta distintas, CUANDO llegan fuera de orden, ENTONCES no se mezclan ni reemplazan el ID/día actual.                     | Cancelación/obsolescencia y nueva consulta por cambio de día.                     |
| FE-AC10 | DADO final de día/semana o pestaña suspendida, CUANDO se ejecuta la política P06 aprobada, ENTONCES reconsulta y muestra racha/semana vigentes sin polling continuo.          | AC05 y PA06; timers/listeners limpios bajo StrictMode.                            |
| FE-AC11 | DADO vistas incluidas en el corte visual aprobado, CUANDO uso móvil, escritorio, teclado o movimiento reducido, ENTONCES cumple DESIGN.md sin cambiar funciones de E1.        | AC13 visual; evidencia por vista, contraste, foco, estados y tamaño de controles. |
| FE-AC12 | DADO carga parcial o guardado confirmado con GET fallido, CUANDO se informa, ENTONCES no desaparecen E1/formularios ni se duplica la escritura; se ofrece reintentar lectura. | Tests de estados independientes y respuesta 500/no JSON.                          |

### Verificación dirigida de AC04

Con el fixture de AC04 definido en la sección 9 de la spec backend, una prueba de
interfaz con DTO simulados comprueba en el juego A 1,5 horas y 1 día semanal,
y racha actual/mejor globales de 1. Las dos partidas del mismo juego no producen
2 días ni la del otro juego aumenta la racha a 3. No se recalcula la regla en React.

Responsables: E2-FE-01, E2-FE-02 y consolidación E2-INT-04. Es verificación prevista,
no evidencia ejecutada. FE-AC02 conserva exclusivamente la vinculación con AC03.

Runner de HAB-01 disponible: Vitest 3.2.6, React Testing Library/user-event y
jsdom, como dependencias de desarrollo fijadas en package.json/lockfile y
comprobadas con el Vite/React existente. No se incorporan librerías de UI.
Los tests HTTP de `metasApi` con fetch simulado y fixture DTO del contrato
siguen previstos para sus tickets E2; los de interacción verifican comportamiento,
no snapshots como única prueba.

El runner DEBE usar config de test explícita con `envDir` apuntando a un directorio
temporal vacío y sin imports del config de desarrollo. No cargar `.env` reales
ni ejecutar build/dev para probar. La base de API se inyecta como valor sintético.
Comandos disponibles en frontend: `npm test`, `npm run test:coverage` y
`npm run typecheck`. Typecheck comprueba aplicación y pruebas sin emitir archivos;
es complementario. Configuración y resultados de HAB-01 constan en
[su evidencia](../verificaciones/E2-HAB-01.md).

## 10. Tabla ticket → archivos previstos

N = nuevo y M = modificación respecto al plan original. HAB-01 está cerrado y
HAB-05 implementado, pendiente de cierre. FE-01 y VIS-01 tienen únicamente los
cortes técnicos acreditados abajo; el resto conserva su planificación aprobada.
Rutas repetidas indican trabajo incremental.

| Ticket                      | Archivos previstos                                                                                                                                                                                                                                                               | Alcance / evidencia                                                                                                                           |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| E2-HAB-01 (parte FE)        | M `frontend/package.json`, lockfile; N `frontend/vitest.config.ts`, `tests/setup.ts`, `tests/base.test.tsx`                                                                                                                                                                      | Runner aislado sin carga de `.env`; no configuración de pruebas escondida en build.                                                           |
| E2-HAB-04                   | M `frontend/src/App.tsx`; N `src/utils/fechas.ts`, `src/utils/fechas.test.ts`, `tests/partidas-fecha.test.tsx`                                                                                                                                                                   | Campo fecha y formato civil en E1; no extraer todas las pantallas.                                                                            |
| E2-HAB-05                   | N `frontend/src/api/baseUrl.ts`, `src/api/baseUrl.test.ts`; M `src/api/videojuegosApi.ts`, `src/api/partidasApi.ts`                                                                                                                                                              | Base con `/api` y fallback de desarrollo implementados en 1e528cb; cierre pendiente. Solo BASE común, sin refactor total T2; README alineado. |
| E2-HAB-06                   | M `frontend/src/App.tsx`; N `frontend/tests/partida-error.test.tsx`                                                                                                                                                                                                              | Error de envío no desmonta formulario E1 ni borra valores.                                                                                    |
| E2-FE-01                    | N `frontend/src/api/metasApi.ts`, `src/api/metasApi.test.ts`, `src/pages/DetalleVideojuego.tsx`, `src/hooks/useProgresoVideojuego.ts`, `src/components/ProgresoSemanal.tsx`, `src/components/EstadoCargaError.tsx`; M `src/tipos.ts`, `src/App.tsx`; N `tests/progreso.test.tsx` | DTO/metasApi inicial, carga parcial y actividad sin meta; extracción acotada de Detalle.                                                      |
| E2-FE-02                    | N `frontend/src/components/RachasGlobales.tsx`, `tests/rachas.test.tsx`; M `src/api/metasApi.ts`, `src/hooks/useProgresoVideojuego.ts`, `src/pages/DetalleVideojuego.tsx`, `src/tipos.ts`                                                                                        | Rachas globales, ceros y ausencia de meta.                                                                                                    |
| E2-FE-03                    | N `frontend/src/components/MetaForm.tsx`, `tests/meta-crear.test.tsx`; M `src/pages/DetalleVideojuego.tsx`, `src/api/metasApi.ts`, `src/hooks/useProgresoVideojuego.ts`, `src/components/ProgresoSemanal.tsx`                                                                    | Crear, validar y reconsultar; no repetición de POST.                                                                                          |
| E2-FE-04                    | M `frontend/src/components/MetaForm.tsx`, `src/pages/DetalleVideojuego.tsx`, `src/api/metasApi.ts`; N `tests/meta-editar.test.tsx`                                                                                                                                               | Edición de objetivos, 409 y conservación de borrador.                                                                                         |
| E2-FE-05                    | N `frontend/src/components/ConfirmarDesactivacion.tsx`, `tests/meta-desactivar.test.tsx`; M `src/pages/DetalleVideojuego.tsx`, `src/api/metasApi.ts`                                                                                                                             | Confirmación accesible, DELETE/204 y reconsulta.                                                                                              |
| E2-FE-06                    | N `frontend/src/components/HitosEditor.tsx`, `src/components/HitosLista.tsx`, `tests/hitos.test.tsx`; M `src/components/MetaForm.tsx`, `src/pages/DetalleVideojuego.tsx`, `src/tipos.ts`                                                                                         | Hasta 5 hitos, IDs estables y estados calculados.                                                                                             |
| E2-INT-01 (parte FE)        | M `frontend/src/App.tsx`, `src/pages/DetalleVideojuego.tsx`, `src/hooks/useProgresoVideojuego.ts`; N `tests/reconsulta.test.tsx`                                                                                                                                                 | Registro/eliminación y navegación E1; refrescar cada indicador desde su entrega.                                                              |
| E2-INT-03 (parte FE)        | M `frontend/src/hooks/useProgresoVideojuego.ts`; N `tests/cambio-periodo.test.tsx`                                                                                                                                                                                               | P06 aprobado; no introducir cron ni polling.                                                                                                  |
| E2-VIS-01                   | M `frontend/src/index.css`, `frontend/tailwind.config.cjs`; M `frontend/index.html` solo si se aprueba un recurso/licencia de fuente; N `tests/tokens.test.ts`                                                                                                                   | Tokens y tipografía; el test de tokens no sustituye evidencia de contraste real.                                                              |
| E2-VIS-02                   | M `frontend/src/App.tsx`, `src/index.css` y componentes E1 si el corte aprobado los requiere                                                                                                                                                                                     | Exclusivamente P-VIS aprobado: no reorganización general ni resolución incidental D1/D2.                                                      |
| E2-VIS-03                   | M `frontend/src/pages/DetalleVideojuego.tsx`, `src/components/ProgresoSemanal.tsx`, `RachasGlobales.tsx`, `MetaForm.tsx`, `HitosEditor.tsx`, `HitosLista.tsx`, `ConfirmarDesactivacion.tsx`                                                                                      | Adopción visual E2 conservando comportamiento funcional.                                                                                      |
| E2-INT-04 (parte FE/visual) | N/M `frontend/tests/*.test.tsx` de los tickets previos; documentación de evidencia en `docs/`                                                                                                                                                                                    | Matriz AC01–AC13 por criterios, vistas y bloques; no snapshots como única evidencia.                                                          |

Las tablas backend/frontend cubren conjuntamente los 23 IDs vigentes; los IDs
agrupados del borrador de 34 no se reintroducen como tickets nuevos.
La resolución de BASE descrita en la sección 4 está implementada y verificada en
HAB-05 (1e528cb), pendiente de cierre; la validación se realiza al solicitar datos,
según el plan aprobado y su evidencia. Esta nota de estado no cambia el contrato.
La creación inicial de metasApi.ts corresponde a FE-01, no a HAB-05. Los métodos
se incorporan progresivamente en los cortes FE posteriores, reutilizando baseUrl.ts.
El [corte técnico FE-01](../verificaciones/E2-FE-01-servicio.md) acredita tipos,
GET de progreso, validación de DTO, errores y cancelación del cliente; no crea
componentes, hooks ni integración con Detalle. La
[base VIS-01](../verificaciones/E2-VIS-01.md) acredita tokens/reglas globales y
verificación de navegador limitada; no acredita VIS-02/03 ni carga de las fuentes
previstas. Las clases antiguas de App.tsx todavía cubren gran parte del tema.
El [estado consolidado](../verificaciones/E2-estado-implementacion.md) distingue
esas pruebas técnicas de la aceptación UI que continúa pendiente.
El [backlog](../backlog/E2-metas-y-rachas.md#14-matriz-de-trazabilidad-y-verificación)
relaciona decisiones, historias, AC, tickets y método de verificación.

## 11. Restricciones y aprobación

- NO programar ni cambiar componentes, estilos, fuentes o dependencias en esta tarea.
- NO rehacer todo App.tsx; extracción mínima de Detalle y piezas E2, más los
  cortes visuales E1 expresamente incluidos al aprobar P-VIS.
- NO resolver deuda general T1/T2/T4, logros D1, búsqueda D2 o rendimiento D3
  incidentalmente. Identificar cualquier excepción indispensable antes de implementarla.
- DEBE mantener sincronizados tipos, servicio y contratos de ambas specs.
- DEBE verificar errores, límites, reconsulta y regresiones E1 en cada corte,
  además del diseño de las vistas incluidas, antes de cerrar tickets.
- NO hacer staging, commit, push o despliegue sin instrucción independiente.

**Aprobación:** registrada en la conversación mediante «Si esta bien los specs estan
aprobados». Los cambios posteriores de contratos o decisiones requieren nueva
aprobación y el plan de cada ticket delimita la implementación autorizada.

**Evidencia actual:** runners y pruebas básicas de E1 documentados en
[E2-HAB-01](../verificaciones/E2-HAB-01.md) y resolución de base API verificada en
[E2-HAB-05](../verificaciones/E2-HAB-05.md), pendiente de cierre. Esto no acredita
componentes E2 ni adopción visual de Nebula Arcade, que corresponden a otros tickets.
