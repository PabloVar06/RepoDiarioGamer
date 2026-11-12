# E2 — informe conjunto de pasos 7 y 8

Fecha: 12 de noviembre de 2026, America/Guayaquil.

Estado: **implementado y verificado; pendiente de revisión del usuario**.
No se cierran tickets automáticamente, no se avanza a otro bloque y no se hace
staging, commit ni push. El usuario aprobó el resultado anterior y autorizó
este bloque secuencial sin aprobaciones intermedias; después pidió terminarlo.

## Alcance y trazabilidad

HEAD inicial **dab0637**. Specs backend/frontend aprobadas y versionadas en
59bfc98 antes del código nuevo; se conservan contratos, decisiones PA y criterios.
Se consultaron AGENTS.md, DESIGN.md, diagnóstico, backlog y ambas specs. No fue
necesario implementar dependencias fuera del alcance ni modificar las specs.

| Ticket                   | Dependencias y criterios cubiertos                                                                                                                                                                    | Evidencia individual                         |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| FE-04 — editar objetivos | FE-03 aprobado y BE-05 verificado. Precarga, límites, PUT sin campos protegidos, hitos omitidos conservados, 400/409, borrador, envío único y GET posterior. Completado/Abandonado permitidos.        | [Edición](E2-FE-04-editar-meta.md)           |
| FE-05 — desactivar       | FE-03/BE-06 cubiertos. Diálogo nativo, Cancelar/Escape/foco, DELETE lógico 204, actividad conservada, error y reintento solo de consulta tras baja confirmada.                                        | [Desactivación](E2-FE-05-desactivar-meta.md) |
| FE-06 — hitos            | FE-03/04 y BE-07 disponibles. De cero a cinco, descripción trim 1–120, porcentaje entero 1–100, IDs estables, [] explícito, lista derivada y recálculo al borrar máximo; logros E1 intactos.          | [Hitos](E2-FE-06-hitos.md)                   |
| INT-01 — reconsulta      | Se integra por mutación en FE-04/05/06. Registro/borrado de partida, vuelta desde historial, borrado de juego, edición/hitos/desactivación y datos ajenos comprobados. Sin cálculos duplicados React. | [Integración](E2-INT-01-reconsulta.md)       |
| INT-03 — período/foco    | FE-01/02/03 y P06 aprobados. Siguiente día Guayaquil, retorno visible/foco agrupados, suspensión, errores sin polling, desfases, StrictMode y limpieza; borrador preservado.                          | [Período](E2-INT-03-periodo.md)              |

Se ejecutó cada corte después de verificar el anterior. Frontend pasó de
219 pruebas iniciales a **237** (FE-04), **248** (FE-05), **262** (FE-06), **265**
(INT-01), **278** (INT-03) y **279** tras la regresión adicional de foco encontrada
en navegador. TypeScript pasó antes de continuar en cada corte.

Pruebas escritas primero: FE-04 tuvo 18 fallos, FE-05 11, FE-06 14 e INT-03 seis
fallos y una prueba ya correcta. INT-01 añadió pruebas sobre reconsultas ya
integradas y pasaron sin requerir código de producción adicional.

## Verificación final

| Comando / entorno                  | Pasaron | Fallaron | Omitidas |
| ---------------------------------- | ------: | -------: | -------: |
| Backend `npm test`                 |     165 |        0 |        0 |
| Backend `npm run test:integration` |     162 |        0 |        0 |
| Frontend `npm test`                |     279 |        0 |        0 |
| Chrome con Express/MongoDB reales  |      18 |        0 |        0 |

**606 pruebas automatizadas de producto**, más 18 escenarios de navegador.
`npm run typecheck` correcto en backend/frontend, incluyendo tests. Prettier en
los archivos del bloque y `git diff --check` correctos; staging vacío. Sin build,
servidor productivo, cambios de dependencias ni acceso a archivos `.env`.

Backend conserva modelos, servicios, controladores y rutas de dab0637: solo se
añade un recorrido HTTP de integración. Se verifican los contratos vigentes;
no se añaden endpoints ni se altera el resumen E1.

Logs reproducibles de suites y resultados locales:

- `/tmp/savepoint-bloque78-final-frontend.log`
- `/tmp/savepoint-bloque78-final-frontend-types.log`
- `/tmp/savepoint-int01-backend.log`
- `/tmp/savepoint-int01-integration.log`
- `/tmp/savepoint-int01-backend-types.log`
- `/tmp/savepoint-bloque78-formato.log`
- `/tmp/savepoint-bloque78-browser.log`
- `/tmp/savepoint-e2-bloque78-browser/reporte.json`

Incidencias resueltas: el primer intento completo de FE-05 tuvo un timeout de
beforeEach/RPC en una prueba previa de rachas; repetir sin cambiar tests ni
timeouts dio 248/248. El navegador detectó retorno de foco incorrecto en una
apertura programática; la prueba añadida falló primero y luego pasó al capturar
el disparador explícitamente. No se ocultaron fallos ni se relajaron criterios.

## MongoDB temporal y limpieza

Mismo runner seguro del proyecto, mongodb-memory-server-core con MongoDB 7.0.24.
Cada suite crea una base UUID y proceso propios en **127.0.0.1**; antes de cada
escritura/solicitud se comprueban host/puerto/base/PID/dbPath. AutoCreate/autoIndex
se desactivan hasta verificar propiedad; inicializarMetas crea/verifica el índice.
Sin Atlas, credenciales ni archivos de entorno; preloads bloquean dotenv/.env.

La regresión completa creó siete instancias seriales, todas detenidas y con
directorios eliminados según el log. Ejemplo del nuevo recorrido INT-01:
puerto 57828, PID 88189, base `savepoint_e1_test_d570d1051a51481188eeb57bbef08afb`.
La última revisión de navegador usó puerto 59632, PID 89160, base
`savepoint_e1_test_6652796c95b34f0aaf84c2744eb76534`. Su salida 0 confirma parada
de Chrome/HTTP/MongoDB y eliminación de directorios temporales.

## Navegador y DESIGN.md

Chrome **157.0.8103.51**, perfil propio temporal. Vite programático con configFile
y envFile false, envDir vacío y configuración sintética; API Express real mediante
proxy local. Solo el fallo parcial de lectura se inyectó en el proxy. No se
modificó la aplicación de desarrollo ni se usaron conexiones externas.

| Criterio                        | Verificación real                                                                                                                                                          | Resultado                                                     |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Paleta, jerarquía y componentes | Tokens existentes, título 32 px, secciones 24 px, cuerpo/campos 16 px, botones 18 px y ayudas mínimo 14 px. Sin librerías/fuentes nuevas ni sombras decorativas.           | Cumple el corte; se conservan familias y fallbacks aprobados. |
| Contraste / controles           | Contraste mínimo **4,8299:1** en formularios; controles mínimo **44 px**.                                                                                                  | Cumple.                                                       |
| Adaptabilidad                   | Formulario con hitos y diálogo a 320/375/768/1440 px, sin desbordamiento horizontal; diálogo limitado a viewport.                                                          | Cumple.                                                       |
| Teclado/foco                    | Cancelar inicial, Tab contenido, Escape nativo sin DELETE, retorno al disparador; si desaparece, regreso al enlace de biblioteca.                                          | Cumple; regresión de apertura programática corregida.         |
| Crear/editar hitos              | POST con dos hitos, IDs generados por backend; PUT único conserva ID al renombrar y añade otro; cinco permitidos y sexto bloqueado; nueva meta conserva anterior inactiva. | Persistencia real comprobada.                                 |
| Recálculo y E1                  | Borrar sesión máxima desde E1 vuelve hito a pendiente; resumen/avance/rachas se reconsultan. Borrar juego elimina metas activas/inactivas y conserva otro juego.           | Cumple los flujos probados.                                   |
| Estados                         | Éxito, error de consulta parcial, borrador intacto, actividad sin meta tras desactivar y metas con/sin hitos. Negativos de escritura cubiertos además en React/HTTP.       | Cumple los flujos del bloque.                                 |
| Período                         | Foco/visibilidad simultáneos generan una pareja GET; timer cruza medianoche Guayaquil y muestra racha 0 conservando el borrador.                                           | Cumple con reloj controlado y backend real.                   |

Capturas y reporte locales en `/tmp/savepoint-e2-bloque78-browser/`:
`hitos-formulario-*.png`, `confirmacion-*.png`, `editada.png`,
`hito-pendiente.png` y `error-con-borrador.png`. Se inspeccionaron también
visualmente el formulario móvil y el diálogo a 320 px.
Verificador temporal: `/tmp/savepoint-e2-bloque78-browser.cjs`.
Los artefactos /tmp no forman parte del commit ni sustituyen los tests permanentes.

## Archivos del bloque

| Área               | Modificados                                                                                                                       | Creados                                                                                                                                                                                                                                    |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Cliente/tipos      | `frontend/src/api/metasApi.ts`, `frontend/src/tipos.ts`                                                                           | `frontend/src/api/editarMetaApi.test.ts`, `frontend/src/api/desactivarMetaApi.test.ts`                                                                                                                                                     |
| Componentes/página | `frontend/src/components/MetaForm.tsx`, `frontend/src/components/ProgresoSemanal.tsx`, `frontend/src/pages/DetalleVideojuego.tsx` | `frontend/src/components/ConfirmarDesactivacion.tsx`, `frontend/src/components/HitosEditor.tsx`, `frontend/src/components/HitosLista.tsx`                                                                                                  |
| Consulta/período   | `frontend/src/hooks/useProgresoVideojuego.ts`                                                                                     | `frontend/src/hooks/useActualizacionPeriodo.ts`                                                                                                                                                                                            |
| Tests React        | `frontend/tests/setup.ts` (Date sintética alineada con DTO)                                                                       | `frontend/tests/meta-editar.test.tsx`, `frontend/tests/meta-desactivar.test.tsx`, `frontend/tests/hitos.test.tsx`, `frontend/tests/reconsulta.test.tsx`, `frontend/tests/cambio-periodo.test.tsx`, `frontend/tests/fixtures/metas-http.ts` |
| Tests backend      | Ninguno                                                                                                                           | `backend/tests/integration/recalculo.flujo.test.ts`                                                                                                                                                                                        |
| Documentación      | `docs/backlog/E2-metas-y-rachas.md` (solo estado/evidencia)                                                                       | Este informe y las cinco evidencias individuales enlazadas arriba.                                                                                                                                                                         |

No se eliminan archivos. No se modifican App.tsx, modelos/backend de producción,
estilos globales, Tailwind, librerías, specs ni comportamientos E1.

## Pendientes y límites conservados

- Revisión del usuario y formalización de cierres; no se presume cierre por código.
- INT-04: consolidación de aceptación completa. VIS-03: revisión/consolidación
  visual del detalle; VIS-02: formularios e historial E1 aún pendientes.
- PA01: cotejo con ficha académica original ausente; sin aliases ni cambios
  de contrato. Se conserva minutosObjetivo y GET `/api/videojuegos/:id/progreso`.
- Deuda T1/T2/T4/resto T5 y D1–D3 se conserva. No hay atomicidad general de
  cascada ni versionado de ediciones concurrentes de hitos; sí IDs preservados y
  escrituras condicionales a activa según la spec.
- No se añaden tienda, descargas, rankings, notificaciones, cron ni gráficos.
- Una pestaña suspendida se actualiza al volver; el navegador puede retrasar el
  timer. No se promete sincronización entre pestañas ni snapshot entre GETs.

Esperar revisión antes del siguiente bloque, staging o commit.
