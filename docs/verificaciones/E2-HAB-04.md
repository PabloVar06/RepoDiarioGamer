# E2-HAB-04 — Selector solo fecha y presentación sin desfase

Fecha: 12 de noviembre de 2026, America/Guayaquil.

Estado: **implementado y verificado; pendiente de revisión y autorización de
cierre**. Plan aprobado por el usuario mediante «Aprobado», después de cerrar
HAB-03 y presentar el corte frontend. Sin staging, commit ni push.

Fuentes: [AGENTS.md](../../AGENTS.md), [DESIGN.md](../../DESIGN.md),
[diagnóstico B1/B2](../diagnostico.md), [backlog](../backlog/E2-metas-y-rachas.md),
[spec frontend](../specs/E2-frontend.md), regla 6 y tabla HAB-04, y P02/P07 de la
[spec backend](../specs/E2-backend.md). Dependencias HAB-01/HAB-03 cerradas.
La regla de envío y los contratos constan en specs versionadas antes del código
(ca734b6, actualizadas en 03f8564); no se cambian decisiones de negocio.

## Cambio implementado

- Utilidad pura `hoyGuayaquil(instante)` con zona explícita America/Guayaquil.
  El formulario usa ese día como valor inicial y límite máximo; mínimo 0001-01-01.
- `Fecha de inicio` usa `type="date"` y conserva el string seleccionado. El
  cliente existente recibe/envía `YYYY-MM-DD`, sin convertirlo a un instante.
- Utilidad `formatearFechaCivil` con locale es-EC y zona UTC para el día ya
  almacenado. Se usa en última partida del resumen, historial del juego e
  historial general, sin mostrar una hora inexistente del dominio.
- Fechas fuera del contrato o imposibles muestran «Fecha no disponible» sin
  inventar otra fecha. El resumen sin sesiones conserva «Sin sesiones».
- No se modificaron servicios API, tipos, rutas, backend, estilos ni tokens.
  No se migraron registros ni se añadieron componentes E2 o nuevas funciones.

El límite de selección usa el reloj del dispositivo interpretado en Guayaquil;
el backend mantiene la validación definitiva. No se añaden temporizadores ni
políticas nuevas de refresco de periodos en este ticket.

## Pruebas primero

La primera ejecución dirigida, antes de implementar, produjo **9 tests React
fallidos y 1 correcto**; la suite unitaria no pudo cargar porque la utilidad
todavía no existía. Reprodujo el campo con hora y la presentación dependiente
del locale/zona del navegador. Después del primer cambio pasaron 33/33.

La revisión añadió el caso ISO no canónico `2026-11-15T24:00:00.000Z`: falló
1 de 24 unitarias porque JavaScript normaliza esa hora al día siguiente. Se
rechazó esa normalización comprobando el día resultante; la suite final cubre
**24 unitarias de utilidad y 10 React**, además de las regresiones previas.

## Verificaciones ejecutadas

| Capa / comando                             | Resultado final                                                                           |
| ------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Frontend: `npm test`                       | **131/131**, ocho archivos: 97 previas + 34 nuevas; sin fallos ni omisiones.              |
| Frontend: `npm run typecheck`              | Aplicación y tests correctos, salida 0.                                                   |
| Backend: `npm test`                        | **146/146**, sin fallos, omitidas ni canceladas.                                          |
| Backend: `npm run test:integration`        | **151/151**, sin fallos, omitidas ni canceladas.                                          |
| Backend: `npm run typecheck`               | Aplicación y tests correctos, salida 0.                                                   |
| Chrome con servidor/API sintéticos locales | **9/9 casos**: cuatro zonas, móvil, legado UTC, carga/resolución, vacío y error de carga. |

Las nuevas pruebas React usan los dos clientes API reales y simulan únicamente
fetch. El caso de guardado verifica el JSON, navegación a Detalle, historial,
resumen y conservación de duración/avance/notas/logro. No se suman los tests
dirigidos a los completos como si fueran pruebas distintas.

Prettier `--check` pasó en los 22 archivos modificados/nuevos, incluidos los
cambios previos; `git diff --check` pasó y staging sigue vacío. La comparación
semántica conservó historias, criterios, dependencias y DoD; los 23 tickets
siguen representados una vez en la tabla de estados y los enlaces locales de
backlog/evidencia resuelven correctamente. El diff backend es idéntico al que
existía al comenzar HAB-04, comprobado mediante SHA-256.

Los runners mantienen la protección contra `.env`/dotenv y configuración
sintética. No se ejecutaron los scripts normales de desarrollo/build.
Las advertencias existentes de React Router y de la API CJS de Vite no fueron
errores de pruebas ni se corrigieron incidentalmente.

## Criterio → prueba → resultado

| Criterio                                  | Evidencia                                                                                                   | Resultado / límite                                                                                                                                  |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC01: enviar exactamente el día de inicio | partidas-fecha.test.tsx, clientes reales/fetch simulado y POST observado en Chrome                          | `2026-11-15` llega sin hora ni conversión; Detalle, resumen e historial muestran 15/11/2026.                                                        |
| B2: presentación sin desfase              | fechas.test.ts y React en UTC, Guayaquil, Tokio y Los Ángeles; emulación de esas zonas en Chrome            | Mismo día visible, formato español y sin hora añadida.                                                                                              |
| Hoy de Guayaquil                          | Unitarias justo antes/después de 05:00 UTC y cambio de año; formulario con reloj controlado                 | Fecha inicial y máximo corresponden a Guayaquil, independiente del TZ del proceso/navegador.                                                        |
| Calendario y límites                      | Unitarias de bisiestos, años 0001/0099/9999 e inválidos; React de required/futuro; validación nativa Chrome | Fechas vacías/futuras no generan POST; tipos/fechas fuera del contrato no se normalizan para mostrarlas. Backend conserva la validación definitiva. |
| P07 y datos existentes                    | Fixture UTC legado con hora, tests React y Chrome                                                           | Se conserva el componente de día UTC, sin reconstruir inicio local ni modificar el dato.                                                            |
| Regresión E1                              | 97 tests previos FE, suites completas BE y tests nuevos del flujo de registro                               | Rutas, campos restantes, logros y resumen conservados. HAB-06 sigue pendiente para errores del envío.                                               |
| Accesibilidad del selector                | Tab desde el selector de juego, etiqueta nativa y estilos computados en Chrome                              | Altura 44 px, foco violeta 3 px y separación 3 px; contraste del texto 15,92:1 y del foco frente al fondo del control 5,06:1.                       |
| Adaptabilidad y estados                   | Chrome 1440×1000 y 375×812, carga/resolución/vacío/error; capturas inspeccionadas                           | Sin desbordamiento horizontal móvil; control visible tras cargar. No se acredita recuperación después de fallo de POST.                             |

La compatibilidad de escritura con HAB-03 queda verificada por contrato y por
capas: backend real con MongoDB temporal y frontend con transporte simulado.
La revisión de navegador usa una API sintética, **no es una prueba de navegador
conectado a Express y MongoDB**. No se declara verificación de producción.

## Navegador y DESIGN.md

Chrome **157.0.8103.51**, reloj sintético 2026-11-16T04:59:59.999Z y zona
emulada por caso. Servidor únicamente en 127.0.0.1, `configFile: false`,
`envFile: false` y directorio de entorno vacío. HTTPS externo bloqueado; sin
instalar paquetes, cargar credenciales o conectar el navegador a MongoDB.

El verificador CDP se corrigió para devolver booleanos en sus esperas, omitir
hojas externas inaccesibles y esperar dos cuadros antes de medir el foco.
Los intentos incompletos se distinguen de la ejecución final correcta. No se
modificaron estilos de la aplicación para hacer pasar esas mediciones.
Chrome, servidor y perfil/directorio temporales quedaron cerrados y eliminados.

| DESIGN.md en este corte                               | Cumplimiento                                                                                                                   |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Control etiquetado, teclado y tamaño mínimo           | Verificado sobre el selector de fecha.                                                                                         |
| Foco visible y contraste                              | Verificado sobre el selector; contraste calculado con sus fondos compuestos.                                                   |
| Diseño adaptable y estados                            | Verificado para las vistas/casos indicados.                                                                                    |
| Paleta, tipografía y renovación completa de pantallas | Sin cambios en este ticket; VIS-02/03 siguen pendientes. La apariencia E1 aún visible no se considera Nebula Arcade terminado. |

Artefactos temporales, fuera del repositorio:

- `/tmp/savepoint-hab04-browser.cjs`: verificador CDP reproducible en este entorno.
- `/tmp/savepoint-hab04-browser/reporte.json`: nueve casos y mediciones.
- `/tmp/savepoint-hab04-browser/formulario-1440.png` y `formulario-375.png`.
- `/tmp/savepoint-hab04-browser/detalle-1440.png` e `historial-375.png`.
- `/tmp/savepoint-hab04-browser-final.log` y logs de intentos previos `browser-red*`/`browser-check*`.

## Seguridad de las regresiones MongoDB

Se reutilizó mongodb-memory-server-core 10.2.3 y MongoDB **7.0.24**, cinco bases
exclusivas en procesos hijos propios. El runner verificó antes de escribir
127.0.0.1, puerto/base, PID mediante serverStatus y dbPath mediante
getCmdLineOpts, con autoCreate/autoIndex desactivados al conectar.
La ejecución confirmó cinco aislamientos y cinco cierres/limpiezas completos:

| Suite         | Puerto | PID   | Base exclusiva                                     |
| ------------- | ------ | ----- | -------------------------------------------------- |
| E1 CRUD       | 57655  | 79533 | savepoint_e1_test_f88929ace61147fa8438281bd5d28c85 |
| Modelo Meta   | 57670  | 79547 | savepoint_e1_test_0d7a0f623d8844d5b91e31584951ea99 |
| CRUD Meta     | 57677  | 79550 | savepoint_e1_test_12395fefdec049b3bd203354ba0c90e3 |
| Fechas HAB-03 | 57690  | 79553 | savepoint_e1_test_cc9d051569824d40a18abfdec318f91b |
| Progreso      | 57701  | 79557 | savepoint_e1_test_dc122d5705644ab89fd9a39b93904d19 |

ESRCH del hijo y ENOENT del directorio se comprobaron al cerrar cada instancia.
No se utilizó Atlas ni datos reales. Las dos caracterizaciones T3 siguen pasando
porque confirman el defecto de parser; T3 no está corregido.

## Archivos y alcance

| Archivo                                  | Cambio                                                                          |
| ---------------------------------------- | ------------------------------------------------------------------------------- |
| `frontend/src/App.tsx`                   | Uso de utilidades en Detalle/ListaPartidas/FormPartida; selector y envío civil. |
| `frontend/src/utils/fechas.ts`           | Nuevo: hoy de Guayaquil y presentación civil UTC.                               |
| `frontend/src/utils/fechas.test.ts`      | Nuevo: 24 tests unitarios.                                                      |
| `frontend/tests/partidas-fecha.test.tsx` | Nuevo: 10 tests React con clientes reales/fetch simulado.                       |
| `docs/backlog/E2-metas-y-rachas.md`      | Estado y evidencia; sin cambiar criterios/dependencias.                         |
| `docs/verificaciones/E2-HAB-04.md`       | Este registro.                                                                  |

Prettier normalizó App.tsx completo, por lo que el diff incluye formato. Una
comparación de funciones mediante el AST de TypeScript, tras formatear la copia
previa, confirmó cambios solo en Detalle, ListaPartidas y FormPartida; las demás
funciones/componentes se conservaron. No se reorganizó App.tsx ni se resolvió T1.
La copia comparable está en `/tmp/savepoint-hab04-App-before-formatted.tsx`.
Los cambios previos del repositorio se conservan; no se añadieron cambios backend.

Logs de tests y TypeScript: `/tmp/savepoint-hab04-red.log`, `green.log`,
`edge-red.log`, `fe-final.log`, `fe-typecheck-final.log`, `be-all.log`,
`integration-all.log` y `be-typecheck.log`, todos con prefijo
`/tmp/savepoint-hab04-` (green/red son ejecuciones dirigidas, no resultados finales).

## DoD y pendientes

| Condición                                                    | Estado                                                                |
| ------------------------------------------------------------ | --------------------------------------------------------------------- |
| Spec y plan aprobados; dependencias del ticket               | Cubierto: HAB-01/HAB-03 cerrados.                                     |
| Tests primero; fechas civiles enviadas/mostradas sin desfase | Cubierto por unitarias, React y navegador.                            |
| Regresiones E1, TypeScript y datos de prueba seguros         | Cubierto con resultados anteriores.                                   |
| Revisión en navegador por vista, teclado, móvil y estados    | Cubierto en Chrome con los límites indicados.                         |
| Formato, alcance y documentación                             | Cubierto por Prettier, diff, comparación semántica y enlaces locales. |
| Revisión y cierre del ticket                                 | Pendiente de autorización del usuario.                                |

HAB-06 (recuperación tras fallo de API), T3 y el resto de deuda/diferidos se
mantienen pendientes. PA01 sigue sin cotejo externo. No se implementaron metas,
rachas, hitos, rediseño VIS ni otros tickets.

Commit sugerido, sin ejecutarlo:
`fix: conservar fechas civiles en frontend E2-HAB-04`.
