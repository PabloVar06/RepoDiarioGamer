# E2 — informe del bloque de progreso, rachas y creación de metas

Fecha: 12 de noviembre de 2026, America/Guayaquil.

Estado: **implementado y verificado; pendiente de revisión del usuario**.
No se cierran tickets automáticamente ni se avanza al siguiente bloque.
Sin staging, commit ni push.

## Autorización, alcance y trazabilidad

El usuario autorizó agrupar los pasos 4, 5 y 6, con verificaciones entre tickets,
y después respondió «Autorizado» a la ampliación limitada C05/T3 y cascada INT-01.
Se aplicó la skill [savepoint-sdd](../../.agents/skills/savepoint-sdd/SKILL.md).
AGENTS.md, DESIGN.md, diagnóstico, backlog y specs existentes fueron consultados.

Las specs [backend](../specs/E2-backend.md) y
[frontend](../specs/E2-frontend.md) ya estaban versionadas: su última modificación
antes de este bloque es **59bfc98**; HEAD inicial **8904efc**. Este bloque no
cambia reglas de negocio, contratos ni specs, y su código permanece sin commit.
Las frases sobre implementación pendiente de documentos anteriores describen
sus cortes históricos; esta evidencia registra los resultados posteriores.

| Corte, ejecutado en orden | Dependencias y resultado individual                                                                                                                                                                                                                                                               | Evidencia                                |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| C05/T3 + cascada INT-01   | Autorización adicional explícita. Parser 400/413 con requestId; borrar juego elimina sus metas activas/inactivas y partidas, conservando otro juego. Backend 146/146 base + 153/153 integración; TypeScript correcto.                                                                             | [Dependencias](E2-dependencias-FE-03.md) |
| E2-FE-01                  | HAB-01/04/05 y BE-01 con implementación/evidencia previa. Panel integrado junto a resumen E1, actividad con/sin meta, carga/error/vacío, cancelación y respuestas obsoletas. Frontend 163/163 y TypeScript correcto antes de continuar.                                                           | [Panel](E2-FE-01-panel.md)               |
| E2-BE-02                  | HAB-01/03 cubiertos. Función pura y GET `/api/rachas` global; un reloj por petición, historial completo sin filtro de meta/estado, exclusión de futuros y recálculo. Backend 165/165 + 161/161 integración; TypeScript correcto.                                                                  | [Backend rachas](E2-BE-02-rachas.md)     |
| E2-FE-02                  | Backend BE-02 verificado antes de consumo. Racha actual y mejor histórica, ceros, carga/error independientes, reconsulta acotada ante distinto día. Frontend 181/181 y TypeScript correcto antes de continuar.                                                                                    | [Frontend rachas](E2-FE-02-rachas.md)    |
| E2-FE-03                  | FE-01/BE-03 disponibles; dependencias parser/cascada verificadas. Formulario, conversión a minutos, límites, 409 y borrador, recuperación sin repetir POST confirmado o incierto. Frontend 217/217 y TypeScript; regresión final 219/219 al añadir StrictMode y el fixture dirigido AC04 a FE-02. | [Crear meta](E2-FE-03-crear-meta.md)     |

Los cierres administrativos anteriores pendientes no se inventan. INT-01 se
acredita solo en los flujos disponibles; no se da por terminado INT-04 ni VIS-03.

## Comprobaciones finales

| Comando / verificación             | Pasaron | Fallaron | Omitidas |
| ---------------------------------- | ------: | -------: | -------: |
| Backend `npm test`                 |     165 |        0 |        0 |
| Backend `npm run test:integration` |     161 |        0 |        0 |
| Frontend `npm test`                |     219 |        0 |        0 |
| Chrome, escenarios del bloque      |      18 |        0 |        0 |

**545 pruebas automatizadas de producto**, además de 18 escenarios de navegador.
`npm run typecheck` pasó en ambos proyectos, para aplicación y tests. Prettier
comprobado en todos los archivos creados/modificados; `git diff --check` sin
errores y staging vacío. No se ejecutó build ni configuración productiva.

Pruebas negativas escritas antes de implementar: parser/cascada reproducían sus
fallos; FE-01 tuvo diez fallos iniciales; BE-02 no tenía módulo/ruta; FE-02 tuvo
18 fallos y FE-03 32. Las ejecuciones finales anteriores son las válidas tras
la implementación y las ampliaciones de cobertura.

Logs finales locales:

- `/tmp/savepoint-e2-final-backend.log`
- `/tmp/savepoint-e2-final-integration.log`
- `/tmp/savepoint-e2-final-frontend.log`
- `/tmp/savepoint-e2-final-backend-types.log`
- `/tmp/savepoint-e2-final-frontend-types.log`
- `/tmp/savepoint-e2-format.log`
- `/tmp/savepoint-e2-browser.log`
- `/tmp/savepoint-e2-bloque-browser/reporte.json`

## Aislamiento y limpieza

Se reutilizó `tests/integration/temporary-mongo.ts`: MongoDB **7.0.24**, enlazado
a **127.0.0.1**, proceso hijo propio y base `savepoint_e1_test_<UUID>` nueva en
cada suite. Antes de escrituras y HTTP se verificaron host/puerto/base, PID con
serverStatus y dbPath con getCmdLineOpts. Sin reutilizar conexiones ni URI ajenas.
Los preloads bloquean dotenv y lecturas de `.env` y sus variantes.

La regresión final creó seis instancias seriales, todas con parada y eliminación
del directorio confirmadas en el log. Ejemplo: rachas, puerto 52434, PID 85883,
base `savepoint_e1_test_cd4a6dc29d6840689fc8951d0858e372`.

El navegador utilizó **React → proxy local → Express real → MongoDB temporal**;
se validó el aislamiento antes de cada solicitud HTTP. Su última ejecución usó
puerto MongoDB 51943, PID 85695 y base
`savepoint_e1_test_fa8cba057a074d30a83cd17f44f335c9`. El runner confirmó parada y
eliminación de datos al finalizar. No se usó Atlas ni credenciales.

Limitación de infraestructura encontrada: el primer intento del navegador pasó
los 18 escenarios, pero su cierre quedó esperando. Se detuvieron únicamente
el runner y su instancia identificados, se comprobó la parada y se eliminaron
sus dos directorios temporales. Se corrigió el cierre del verificador temporal
y se repitió la ejecución completa: **18/18 y salida 0**, limpieza confirmada.
No fue un cambio del código de SAVEPOINT. Al inicio también se requirieron
permisos de ejecución fuera del sandbox para los puertos locales (EPERM).

## Navegador, E1 y DESIGN.md

Chrome **157.0.8103.51**, sesión headless con perfil temporal propio, sin cargar
vite.config ni archivos de entorno. Vite programático con configuración
sintética explícita, carga de `.env` bloqueada, React/Tailwind existentes y API
local. Se bloquearon URLs HTTPS en el navegador.

| Criterio                       | Evidencia real                                                                                                                                                                                    | Resultado                                                                               |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Paleta, tipografía y jerarquía | Colores computados de tokens; título 32 px, secciones 24 px y texto mínimo 14 px; botones nuevos 18 px y campos 16 px. Se conservan familias y fallbacks existentes; no se descargan fuentes.     | Cumple el corte; fuentes Nebula/Orbitron/Poppins no se incorporan como recursos nuevos. |
| Superficies y espaciado        | Paneles y formulario con tokens/radios existentes, sin sombras ni degradados; detalle extraído sin clases gamer/white antiguas.                                                                   | Cumple.                                                                                 |
| Contraste y teclado            | Contraste mínimo medido **4,8299:1** en detalle; formularios también ≥4,5. Foco real 3 px violeta/separación 3 px; Tab Horas→Minutos.                                                             | Cumple; controles ≥44 px, checkbox con etiqueta de área ampliada.                       |
| Adaptabilidad                  | Detalle y formulario a 320, 375, 768 y 1440 px; sin desbordamiento horizontal, una acción primaria por contexto.                                                                                  | Cumple.                                                                                 |
| Estados                        | Carga parcial/error de progreso inyectados únicamente en proxy, sin ocultar resumen/rachas; reintento GET; vacío real de otro juego sin partidas/meta; validación, éxito y 409 reales.            | Cumple los flujos del bloque.                                                           |
| Actividad, rachas y creación   | Dos días del juego A suman 420 min; otro juego aporta tercer día a racha global; POST único 300 min/3 días produce 140 % con barra 100 y meta pendiente.                                          | Persistencia y respuestas reales comprobadas.                                           |
| Regresión E1                   | Resumen con máximo/horas/fechas conservado, logro manual marcado por HTTP real, eliminación confirmada de partida reconsulta resumen/progreso/rachas. Suites conservan CRUD y cascada existentes. | Cumple los flujos probados.                                                             |
| Movimiento                     | Medios normal/reducido, sin dependencia funcional de animaciones nuevas.                                                                                                                          | Cumple.                                                                                 |

Capturas en `/tmp/savepoint-e2-bloque-browser/`: `detalle-320.png`,
`detalle-375.png`, `detalle-768.png`, `detalle-1440.png`, `formulario-*.png`,
`validacion.png`, `meta-creada.png`, `conflicto-409.png`, `carga-parcial.png`,
`error-parcial.png`, `vacio-real.png` y `recalculo.png`. Se inspeccionaron también
visualmente el detalle de escritorio y el formulario móvil. El verificador
temporal `/tmp/savepoint-e2-bloque-browser.cjs` conserva las comprobaciones.
Estos artefactos son locales, no forman parte del commit ni sustituyen los
tests permanentes del producto.

## Archivos del bloque

Rutas relativas a la raíz; no se modificaron modelos Videojuego/Partida/Meta,
estilos globales, Tailwind, dependencias ni archivos de entorno.

| Grupo               | Modificados                                                                                                    | Creados                                                                                                                                                                                                                                                                        |
| ------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Backend aplicación  | `backend/src/app.ts`, `backend/src/middlewares/errorHandler.ts`, `backend/src/services/videojuegos.service.ts` | `backend/src/services/rachas.calculos.ts`, `backend/src/services/rachas.service.ts`, `backend/src/controllers/rachas.controller.ts`, `backend/src/routes/rachas.routes.ts`                                                                                                     |
| Backend pruebas     | `backend/tests/integration/e1-crud.test.ts`, `backend/tests/integration/metas.crud.test.ts`                    | `backend/tests/rachas.test.ts`, `backend/tests/integration/rachas.http.test.ts`                                                                                                                                                                                                |
| Frontend aplicación | `frontend/src/App.tsx`, `frontend/src/api/metasApi.ts`, `frontend/src/tipos.ts`                                | `frontend/src/pages/DetalleVideojuego.tsx`, `frontend/src/hooks/useProgresoVideojuego.ts`, `frontend/src/components/EstadoCargaError.tsx`, `frontend/src/components/ProgresoSemanal.tsx`, `frontend/src/components/RachasGlobales.tsx`, `frontend/src/components/MetaForm.tsx` |
| Frontend pruebas    | `frontend/tests/partida-error.test.tsx` (fixture GET ampliado)                                                 | `frontend/tests/fixtures/e2.ts`, `frontend/tests/progreso.test.tsx`, `frontend/tests/rachas.test.tsx`, `frontend/tests/meta-crear.test.tsx`, `frontend/src/api/rachasApi.test.ts`, `frontend/src/api/crearMetaApi.test.ts`                                                     |
| Documentación       | `docs/backlog/E2-metas-y-rachas.md`, `docs/diagnostico.md` (estado/evidencia, sin cambiar criterios)           | Este informe y las cinco evidencias individuales enlazadas en la primera tabla.                                                                                                                                                                                                |

No se eliminaron archivos. Se retiró de App.tsx solo el Detalle trasladado y
su helper visual sin usos. Las demás pantallas E1 permanecen en App.tsx.

## Pendientes conservados

- Revisión/autorización de cierre de estos tickets y de habilitantes previamente
  implementados; este bloque no la presume.
- FE-04, FE-05 y FE-06: edición, desactivación con confirmación y gestión de hitos.
- INT-03: cambio de día, foco/visibilidad y limpieza de timers; este bloque solo
  corrige desfases detectados entre respuestas. No hay polling ni cron nuevos.
- VIS-02 formularios/historial E1; VIS-03 e INT-04 completos dependen de los
  flujos restantes. No se declara adoptado todo Nebula Arcade en la aplicación.
- T1/T2/T4 y resto de T5, D1–D3. C05/T3 se corrige únicamente en parser/orden de
  observabilidad; no se promete una auditoría completa de todos los errores.
- D3: cascada secuencial, sin nueva atomicidad frente a fallo/creación concurrente.
- PA01: ficha académica original ausente. Se conservan `minutosObjetivo`,
  GET `/api/videojuegos/:id/progreso` y resumen E1; no se añaden alias ni cambios
  no aprobados de contratos.

Esperar revisión del usuario antes del siguiente bloque o cualquier commit.
