# SAVEPOINT — cierre del bloque de tickets abiertos

Fecha: **12 de noviembre de 2026**, America/Guayaquil.
Base Git: **0018a1b**; las correcciones de este bloque están en el árbol de
trabajo, **todavía sin commit**. No se atribuyen a ese HEAD.

Autorización: el usuario pidió «Trabaja en los tickets abiertos para terminar de
cerralos» y aprobó el plan conjunto mediante «aprobado». El plan comprende
completar FE-01, el corte restante VIS-02, consolidar VIS-01/03, comprobar el DoD
de los demás tickets, ejecutar INT-04 y actualizar solo notas documentales.
Se ejecutó secuencialmente, sin solicitar aprobación entre tickets.

Estado: **21 tickets abiertos con DoD verificado y cierre registrado bajo ese
plan**; HAB-01 y HAB-03 conservan sus cierres anteriores. Total del backlog:
**23 cerrados** dentro de sus alcances aprobados. Los resultados se presentan
para revisión; cerrar estos tickets no aprueba despliegue ni resuelve los PA o
deudas excluidos. No se modificaron las reglas para hacer pasar los criterios.

## 1. Cambios de implementación y ciclo de pruebas

| Corte                                     | Test previo                                                                    | Implementación mínima                                                                                                                                                                               | Verificación antes de continuar                                                                                                |
| ----------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| FE-01 / FC01                              | consultarMetasApi.test.ts: **21 fallaron** al faltar obtener/activa.           | metasApi.ts añade ambos GET reutilizando solicitar/base/validadores; lectura por ID admite inactivas, activa distingue null; señal e identidad. Sin solicitudes extra en Detalle.                   | Frontend **300/300** y TypeScript correctos. [Evidencia individual](E2-FE-01-cierre.md).                                       |
| VIS-02 / FE-AC11                          | formularios-historial-visual.test.tsx: **9 fallaron / 2 pasaron**.             | App.tsx: formularios/historial/ruta desconocida usan tokens; Estados adopta Nebula y anuncia carga/error; historial vacío orienta al registro y reintenta solo GET. Payloads/reglas E1 conservados. | Frontend **311/311**, TypeScript correcto y Chrome **49/49**, cuatro anchos. [Evidencia individual](E2-VIS-02-cierre.md).      |
| VIS-01/03                                 | Suites tokens/biblioteca/progreso/rachas/meta/hitos y revisión CDP existentes. | No se fabrica otro cambio de producción: tokens y componentes E2 ya implementados se verifican junto con las vistas E1 ahora migradas.                                                              | Contraste ≥4,829:1, textos ≥14 px y controles ≥44 px, cuatro anchos sin overflow, foco/diálogo y movimiento reducido.          |
| Habilitantes/backend/frontend/integración | Regresiones y escenarios específicos de la tabla siguiente.                    | Sin correcciones adicionales de backend ni reglas de negocio; los cortes existentes ya satisfacen su aceptación.                                                                                    | B 165, I 162 y F 311; errores/límites y regresiones E1 incluidos.                                                              |
| INT-04 / documentación                    | Matrices completas y comprobación de contratos protegidos.                     | Solo notas de estado de specs/PRD, backlog, auditoría, bitácora y evidencia de cierre.                                                                                                              | 23 escenarios de specs y 13 del PRD vinculados a pruebas; tablas aprobadas conservadas y comprobación de enlaces/formato/diff. |

Incidencias de tests de VIS-02: se actualizó la aserción heredada de error de
catálogo para exigir el nuevo alert accesible y conservar la distinción frente
a error de guardado. Un parche inicial cambió el escenario de vacío equivocado;
se corrigió la aserción, sin debilitar escenarios ni cambiar producto para
acomodarla. La prueba nueva de vacío se ajustó para consultar el status vigente
tras la carga. Las ejecuciones intermedias fallidas permanecen registradas.
Dos intentos iniciales de lanzar npm test desde raíz fallaron porque allí no
existe ese script; los logs rojos de producto citados corresponden después a
las ejecuciones correctas desde frontend.

## 2. DoD común aplicado a cada fila

1. Spec/criterios aprobados antes del código; alcance/arquitectura/contratos E1
   conservados. Las actualizaciones actuales de specs cambian solo estado.
2. Tests de producto pertinentes, límites/errores y regresiones ejecutados con
   configuración sintética protegida. No se usan Atlas ni archivos .env.
3. Carga/error/vacío/éxito y recuperación pertinentes probados; las lecturas no
   se presentan como mutaciones ni los errores como ausencia.
4. En tickets visuales: mediciones reales móvil/escritorio, teclado/foco,
   contraste, controles y movimiento reducido, además de regresiones.
5. Diff, contratos y documentación comprobados; secretos y archivos de entorno
   excluidos. Formato correcto en archivos modificados; deuda global heredada
   explícita, sin reformatearla incidentalmente.
6. Informe y evidencia presentados al usuario; su instrucción y aprobación del
   bloque autorizan ejecutar el cierre, sin implicar commit/push/despliegue.

Leyenda: **B** backend `npm test`; **I** backend `npm run test:integration`;
**F** frontend `npm test`; **N** navegador Chrome con Express/MongoDB propios.
Las rutas de tests son relativas a backend/tests o frontend/tests según capa.
Los commits son de implementación histórica; este documento no es un commit.

## 3. Evidencia individual de los 21 cierres

| Ticket    | Dependencias / aceptación y DoD particular comprobados                                                | Test → implementación → resultado                                                                                                                                                                       | Commit previo / evidencia original                                        | Estado  |
| --------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------- |
| E2-HAB-04 | HAB-01/03 cerrados. AC01/B1/B2: fecha elegida = JSON/historial/resumen sin hora.                      | F partidas-fecha y utils/fechas, I partidas.fecha.http, N: día civil, cuatro TZ en tests y reloj Guayaquil; sin migrar. App/utils fechas.                                                               | 59bfc98; E2-HAB-04.md; N actual conserva día al registrar.                | CERRADO |
| E2-HAB-05 | B3/E1-03: URL completa y un solo /api, sin configuración privada.                                     | F baseUrl/api/metasApi: configuración válida/ausente/duplicada, rechazo antes de fetch; N proxy real /api. baseUrl y clientes. No certifica Render.                                                     | 1e528cb; E2-HAB-05.md.                                                    | CERRADO |
| E2-HAB-06 | HAB-01; B4: error y reintento conservan formulario y valores.                                         | F partida-error: 400/500/no JSON/red, mismo nodo/borrador, reintento manual, carga/vacío distintos; App conserva contrato; F pasa después de migración visual.                                          | c28df74; E2-HAB-06.md.                                                    | CERRADO |
| E2-BE-01  | HAB-01/03. HU01/AC01/02/04/11: actividad por juego/semana, sin meta o partidas.                       | B progreso/fechas, I progreso.http: límites 09/15, suma/deduplicación, ceros/null y 400/404/500. services/progreso.* y ruta real.                                                                       | a6663ff; E2-BE-01-progreso.md.                                            | CERRADO |
| E2-BE-02  | HAB-01/03. HU02/AC04/05/11/12: actual/mejor globales incluso sin meta.                                | B rachas, I rachas.http: cuatro TZ, corte Guayaquil, varios juegos/estados, retroactividad/bajas y mejor que disminuye. services/rachas.*.                                                              | dab0637; E2-BE-02-rachas.md.                                              | CERRADO |
| E2-BE-03  | BE-01 y PA03/05 resueltos. HU03/AC03/07/08/12: modelo, creación/consulta, cumplimiento e índice real. | B meta.model/metas/progreso; I meta.model/metas.crud/progreso.http: límites, 201/409 concurrentes, índice ausente impide escritura, histórico y 140 % sin cumplir días. C05/T3 negativo pasa.           | 03f8564/a6663ff/dab0637; modelo/CRUD y dependencias FE-03.                | CERRADO |
| E2-BE-05  | BE-03. HU04/AC07/08/12: editar objetivos sin perder partidas, rechazo conserva meta.                  | B metas, I metas.crud/progreso.http: PUT, límites, 400/404/409, inactiva y carrera DELETE/PUT; servicio condicional activa:true y recálculo.                                                            | a6663ff; E2-BE-03-crud.md, progreso posterior.                            | CERRADO |
| E2-BE-06  | BE-03/PA03. HU05/AC09/11: baja lógica, actividad e históricas conservadas.                            | I metas.crud/progreso.http/recalculo.flujo: DELETE 204 idempotente, otra activa con ID nuevo, sin reactivar. metas.service.ts.                                                                          | a6663ff; CRUD/progreso y E2-INT-01-reconsulta.md.                         | CERRADO |
| E2-BE-07  | BE-03/05/PA04. HU06/AC07/10: máximo cinco hitos e identidad/estado derivados.                         | B meta.model/metas/progreso e I metas.crud/progreso.http: ID ajeno/repetido, trim/rangos, []/omisión, máximo80→70 deja hito75 pendiente; logros E1 intactos.                                            | a6663ff; modelo/CRUD/progreso.                                            | CERRADO |
| E2-FE-01  | HAB-01/04/05, BE-01/PA05. HU01/AC01/02/04/11 y contrato completo del servicio.                        | F progreso/consultarMetasApi y demás clientes: carga/error/ceros/null/cancelación/identidad; ProgresoSemanal y Detalle conservan resumen. N y corrección FC01 actual.                                   | db3efbe/dab0637 + trabajo actual; E2-FE-01-panel.md y E2-FE-01-cierre.md. | CERRADO |
| E2-FE-02  | HAB-01/05, BE-02. HU02/AC04/05/11/12: ambas rachas etiquetadas globales.                              | F rachas/rachasApi: ceros, sin meta, error parcial, desfase DTO; RachasGlobales/hook. N confirma presentación y actualización.                                                                          | dab0637; E2-FE-02-rachas.md.                                              | CERRADO |
| E2-FE-03  | FE-01/BE-03/PA05. HU03/AC03/07/08/12: crear/validar/cumplimiento conjunto.                            | F meta-crear/crearMetaApi: total1–6000, 140 %, un POST, 400/409/red incierta, GET fallido solo lectura; MetaForm. N POST real con hitos/estados.                                                        | dab0637; E2-FE-03-crear-meta.md.                                          | CERRADO |
| E2-FE-04  | FE-03/BE-05. HU04/AC07/08/12: editar/recalcular/conservar borrador.                                   | F meta-editar/editarMetaApi: precarga, PUT único, campos protegidos omitidos, 400/409, foco no pisa borrador; N IDs y edición real. MetaForm/Detalle.                                                   | 0018a1b; E2-FE-04-editar-meta.md.                                         | CERRADO |
| E2-FE-05  | FE-03/BE-06. HU05/AC09/11: confirmar/cancelar y conservar actividad.                                  | F meta-desactivar/desactivarMetaApi: sin DELETE al abrir/cancelar/Escape, 204 sin JSON, único envío y reconsulta. N foco inicial/retorno, Tab, cuatro tamaños.                                          | 0018a1b; E2-FE-05-desactivar-meta.md.                                     | CERRADO |
| E2-FE-06  | FE-03/04/BE-07/PA04. HU06/AC07/10: editor/lista de hitos.                                             | F hitos y N: cinco, descripción/objetivo, IDs al renombrar, lista completa/[]/omisión, sin checkboxes de alcanzado; baja del máximo actualiza estado. HitosEditor/Lista/MetaForm.                       | 0018a1b; E2-FE-06-hitos.md.                                               | CERRADO |
| E2-VIS-01 | Spec visual y DESIGN aprobados. HV01: tokens/tipografía/contraste sin librerías.                      | F tokens y N: diez colores, Tailwind/variables, escala y fallbacks aprobados; mínimo4,829:1. No se afirma instalar Nebula/Orbitron/Poppins. CSS/Tailwind existentes sin cambios en este bloque.         | 0fedabd; E2-VIS-01.md y auditoría actual.                                 | CERRADO |
| E2-VIS-02 | VIS-01/HAB-04/06 y P-VIS. HV01/HV03: vistas E1 conservadas y accesibles.                              | F formularios-historial-visual/biblioteca/base/partida-error y N: 24 muestras de seis vistas, cuatro anchos, controles44, texto14, sin legacy/sombras/overflow. App; T4/D1/D2 explícitamente diferidos. | 8904efc + trabajo actual; E2-VIS-02-cierre.md.                            | CERRADO |
| E2-VIS-03 | VIS-01/FE-01–06. HV01–HV03/AC03/09/11/13 visuales: detalle/meta/hitos.                                | F progreso/rachas/meta/hitos/desactivar y N: resumen E1 junto al semanal, barra limitada/texto real, rachas globales, paneles/formularios/diálogo adaptables y teclado. Sin código ficticio adicional.  | dab0637/0018a1b; bloque 7/8 y auditoría actual.                           | CERRADO |
| E2-INT-01 | HAB-06/FE-01/02 y ampliación por FE posterior. HU07/AC06/10/13.                                       | F reconsulta/progreso/rachas/hitos, I recalculo.flujo y N: alta/baja partida, historial, edición/desactivación/hitos, cascada conserva datos ajenos y no consulta ID borrado.                           | dab0637/0018a1b; E2-INT-01-reconsulta.md.                                 | CERRADO |
| E2-INT-03 | FE-01/02/03/PA06. HU07/AC05/06: período vigente sin polling.                                          | F cambio-periodo y N: timer día/semana Guayaquil, foco/visibilidad agrupados, suspensión, errores, StrictMode/ID y limpieza; borrador conservado. Hook existente.                                       | 0018a1b; E2-INT-03-periodo.md.                                            | CERRADO |
| E2-INT-04 | INT-01/03, FE-04/05/06 y bloque VIS aprobado. HU01–07/HV01–03.                                        | Matrices de AUDITORIA: BE11/FE12 y PRD13, tests/archivos/estados por criterio; B/I/F/N actuales, errores/regresiones E1 y evidencia visual. FC01/FE-AC11 corregidos en su alcance aprobado.             | Consolidación actual; AUDITORIA.md y este registro.                       | CERRADO |

## 4. Resultados finales reproducibles

| Verificación                     | Resultado                                                                                                                                                                                     |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend npm test                 | **165/165**, 0 fallos/canceladas/omitidas; funciones puras incluidas.                                                                                                                         |
| Backend npm run test:integration | **162/162**, 0 fallos/canceladas/omitidas.                                                                                                                                                    |
| Frontend npm test                | **311/311**, 24 archivos, 0 fallos/omitidas.                                                                                                                                                  |
| Harness Python                   | **23/23**. core.hooksPath=.githooks y guard-env verificados.                                                                                                                                  |
| TypeScript BE/FE                 | Ambos npm run typecheck, aplicación/tests, salida0.                                                                                                                                           |
| Build backend                    | npm run build -- --outDir /tmp/savepoint-cierre-build/backend, salida0. No ejecuta index/env.                                                                                                 |
| Build frontend                   | Typecheck + Vite build programático con configFile/envFile false, envDir vacío y URL sintética; salida0, 52 módulos, CSS15,22kB/JS288,82kB. No se ejecuta build normal que pueda cargar .env. |
| Navegador                        | **49/49** escenarios en Chrome157.0.8103.51; Express/MongoDB reales y locales.                                                                                                                |
| Formato                          | Archivos nuevos/modificados comprobados; global conserva los diez heredados documentados, sin reforma fuera de alcance.                                                                       |

Los **638 resultados de producto** son 165+162+311; no se suman dos veces las
pruebas dirigidas, las repeticiones ni los subgrupos. H y N son comprobaciones
adicionales; las cuentas de Node incluyen las subpruebas según su reporte.

Logs actuales bajo /tmp/savepoint-cierre-: backend.log, integracion.log,
vis02-green2.log, backend-types.log, vis-final-types.log, harness.log,
build-backend.log, build-frontend.log y browser.log. El verificador de build
reutilizado está en /tmp/savepoint-auditoria-build.cjs y su salida frontend en
/tmp/savepoint-auditoria-build/frontend. Scripts CDP/reporte/capturas en
/tmp/savepoint-cierre-browser.cjs y /tmp/savepoint-cierre-browser/.
Estos artefactos son temporales, no parte del commit; las suites y este registro
permanecen en el proyecto como evidencia reproducible.

MongoDB7.0.24: **siete instancias de integración + una de navegador**, todas
con base UUID, 127.0.0.1 y proceso/dbPath propios. El runner verifica identidad
antes de operar; las ocho limpiezas se registran y se confirmó adicionalmente
que cada PID ya no existe y cada directorio fue eliminado. Chrome/HTTP/Vite
propios cerrados. No se afecta el MongoDB de desarrollo ni Atlas.

## 5. Límites de cierre y revisión

- PA01 permanece SIN VERIFICAR por falta de fuente académica; no es un ticket
  técnico del backlog. No se declara equivalencia externa ni se añade alias.
- Persisten minutosObjetivo y /api/videojuegos/:id/progreso; resumen E1 intacto.
- El cierre visual corresponde a P-VIS y sus exclusiones aprobadas. T4 de
  duplicados E1 continúa diferida, aunque DESIGN la mencione como expectativa
  general; se documenta la excepción, sin cambiar requisitos ni resolverla
  incidentalmente. E2 sí previene duplicados y está probado.
- T1/T2/resto T5 y D1–D3 no se dan por cerrados. T3 ya corregida no se repite.
- No se verificaron despliegue real, variables privadas, carga o todos los
  navegadores/lectores de pantalla; no forman una garantía implícita del cierre.
- La excepción histórica SDD de HAB-01 se conserva. Los contratos funcionales
  de este bloque ya estaban versionados antes del código; sus notas actuales
  no sustituyen retrospectivamente una spec nueva ni reescriben Git.
- Los tres documentos que ya estaban preparados al comenzar permanecen con
  el mismo contenido en staging; no se preparan cambios nuevos ni se elimina
  lo que el usuario había preparado. Las actualizaciones están sin preparar.

Se entrega el resultado para revisión. Sin staging, commit, push ni despliegue
realizados por el agente en esta sesión.
