# E2-HAB-01 — Base de pruebas aisladas del producto

Fecha: 11 de noviembre de 2026, America/Guayaquil.

Estado: **cerrado con aprobación explícita del usuario**, tras verificar la base
de pruebas, el CRUD local y los estados frontend incluidos en HAB-01.
Autorización registrada en conversación: «Esta bien puedes cerrarlo, aprobado».
Las entregas previas corresponden a ca734b6 (base) y b67caa4 (CRUD local).
En el complemento actual no se realizó staging, commit ni push.
No se avanzó a HAB-03/04 ni a tickets visuales.

## Alcance autorizado

Referencias: [backlog](../backlog/E2-metas-y-rachas.md),
[spec backend](../specs/E2-backend.md) y [spec frontend](../specs/E2-frontend.md).
El usuario aprobó ambas specs y después el plan de empezar únicamente con
HAB-01 como requisito previo a las fechas y al trabajo visual.

Se incorporaron runners y fixtures de backend/frontend, TypeScript de pruebas
y el desacoplamiento mínimo de la fábrica de Express para no importar dotenv.
No se añadieron metas, cálculos E2 ni cambios en componentes/estilos del frontend.

Después, el usuario aprobó expresamente el plan de ampliar HAB-01 con pruebas
HTTP del CRUD de E1 y estableció como decisión definitiva usar exclusivamente
mongodb-memory-server-core local temporal, nunca Atlas. Esta ampliación no
modifica archivos de aplicación ni el comportamiento de E1.

## Tests primero y fallo observado

- Se escribieron primero los tests de salud/404/CORS y validaciones del modelo
  E1. Al ejecutarlos inicialmente, importar app.ts intentó cargar dotenv a través
  de config/env.ts. El preload lo rechazó con `Tests aislados: no se permite
cargar dotenv` antes de cargar archivos de entorno.
- El frontend inicialmente no tenía script test. Se añadieron tests de biblioteca,
  filtrado y error de carga antes de completar la configuración del runner.
- Durante la preparación se detectaron dos diferencias del entorno de tests:
  la app necesita un nodo #root y el disco externo genera metadatos AppleDouble.
  El setup reproduce #root y el runner excluye `._*`, sin cambiar el producto.
- Una prueba adicional detectó que Vitest no heredaba el preload en sus workers.
  Se configuró explícitamente en los forks y se comprobaron accesos síncronos
  y asíncronos contra rutas sintéticas inexistentes, sin crear un archivo .env.

## Cambios y límites de aislamiento

- Backend: `crearApp({ frontendUrl })` recibe solo la configuración que utiliza.
  index.ts entrega el mismo valor de producción que antes. La fábrica de app
  ya no importa config/env.ts; los tests tampoco importan index.ts.
- El runner backend base usa node:test/tsx existentes. No conecta MongoDB: salud,
  rutas desconocidas y CORS se verifican en un puerto efímero de loopback;
  las validaciones del modelo son locales, sin persistencia. El nuevo comando
  explícito test:integration conecta únicamente al MongoDB temporal propio,
  según las comprobaciones detalladas más adelante.
- Frontend: Vitest 3.2.6 compatible con Vite 5, Testing Library, user-event,
  jest-dom y jsdom como dependencias de desarrollo fijadas en lockfile.
  No cambió ninguna versión de los paquetes previamente fijados en ese lockfile.
- vitest.config.ts es independiente del config de desarrollo, usa envDir temporal
  vacío y una base API sintética. HTTP/animaciones se simulan en las pruebas de UI.
- El preload compartido bloquea operaciones readFile/open sobre .env y variantes
  antes de acceder a su contenido, tanto en el proceso principal como en workers.
  En backend se prohíbe además importar dotenv. Es una defensa de estos runners,
  no un sandbox general para cualquier herramienta o syscall.
- El setup backend es .cjs para precargarlo antes de tsx/imports de aplicación,
  en vez del setup.ts previsto tentativamente en la tabla de la spec.
- coverage/ está ignorado. Los informes generados no deben prepararse para commit.

## Criterio → prueba → resultado

| Criterio HAB-01                                                   | Evidencia                                                                                                              | Resultado             |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------- |
| Prueba reproducible de comportamiento backend sin entorno privado | Salud 200 con requestId, ruta desconocida 404, CORS con frontend sintético y conexión Mongoose en estado desconectado. | 3 tests pasan.        |
| Regresión básica del modelo E1                                    | Estado Jugando y logro no obtenido por defecto; género Terror válido y terror inválido.                                | 2 tests pasan.        |
| Protección de lectura backend                                     | Ruta sintética inexistente terminada en .env genera error del guard, no lectura ni ENOENT.                             | 1 test pasa.          |
| Prueba de interacción frontend con fixtures                       | Biblioteca muestra dos juegos; filtro actualiza resultados; error no se representa como biblioteca vacía.              | 3 tests pasan.        |
| Cliente HTTP E1 con configuración sintética                       | Base API/filtro codificado, error HTTP conservado y DELETE 204 sin parsear JSON.                                       | 3 tests pasan.        |
| Protección de lectura frontend                                    | readFileSync de .env y readFile asíncrono de .env.local bloqueados en worker.                                          | 2 tests pasan.        |
| Compatibilidad TypeScript                                         | Código existente y nuevas configuraciones/tests comprobados en ambos proyectos.                                        | Ambos comandos pasan. |
| Harness previo conservado                                         | Suite Python de hooks/configuración.                                                                                   | 23 tests pasan.       |

## Comandos de la verificación inicial

Desde backend:

```sh
npm test
npm run typecheck
```

Desde frontend:

```sh
npm test
npm run test:coverage
npm run typecheck
```

Desde la raíz:

```sh
python3 -B -m unittest discover -s tests/harness -v
```

Resultado inicial: **6 backend + 8 frontend = 14 tests del producto**, más
**23 del harness**. Se comprobó formato con Prettier sobre los archivos del ticket.
Los tests HTTP backend necesitaron permiso de puerto local fuera del sandbox
de ejecución; no requieren acceso a un servicio externo ni credenciales.

## Regresión E1 y límites de la verificación

No se modificó frontend/src, sus rutas, componentes ni estilos. En backend no
se cambiaron modelos, servicios, controladores ni routers de E1; el único cambio
de producción es pasar explícitamente frontendUrl al crear la app.

Las regresiones iniciales se complementaron con el CRUD HTTP persistido y la
cascada local documentados abajo. No se ejecutó una prueba de navegador real.
La cobertura frontend inicial es 36,16 % de líneas del conjunto
instrumentado, sin umbral de cobertura inventado para esta base mínima.
React Router emite avisos de migración futura a v7; no se cambió su versión ni
su comportamiento para ocultarlos.

B5 obtiene una base ejecutable, no cobertura funcional completa. T5 solo se
adelanta en la separación de crearApp; sus demás aspectos siguen pendientes.
El resto de bloqueantes y deuda permanece en el diagnóstico.

## Ampliación aprobada: CRUD E1 con MongoDB local temporal

### Preparación y evidencia de aislamiento

- Dependencia de desarrollo fijada: mongodb-memory-server-core **10.2.3**.
  Instalación con `--ignore-scripts`, sin postinstall. El lockfile incorpora 41
  paquetes y no cambia ninguna versión previamente fijada.
- Binario oficial fijado: MongoDB **7.0.24**, macOS ARM64, motor wiredTiger;
  compatible con el Node **22.12.0** y TypeScript **5.9.3** de esta ejecución.
  Se descargó mediante HTTPS desde fastdl.mongodb.org con comprobación MD5
  habilitada. Se verificó la versión real mediante buildInfo.
- No se necesitó URI externa, variable de conexión ni credencial. No se leyó,
  modificó ni mostró ningún archivo .env. Los tests no importan index.ts ni
  config/env.ts y conservan el preload que rechaza dotenv y lecturas .env.
- El preload de integración descarta overrides heredados MONGOMS_* antes de
  importar la librería. El runner genera una base UUID, directorio mkdtemp y
  proceso nuevos; fija bind a 127.0.0.1 y obtiene su puerto efímero.
- Antes de conectar se comprueba protocolo mongodb, host literal 127.0.0.1,
  ausencia de credenciales/opciones de URI, nombre exclusivo, puerto, dbPath
  temporal y PID del proceso hijo vivo. No se aceptan URI de entrada ni fallback.
- Antes de habilitar HTTP y antes de cada petición se comprueba la conexión
  Mongoose y se consultan serverStatus/getCmdLineOpts, de solo lectura: deben
  coincidir PID, bindIp, puerto y dbPath con el proceso propio. autoCreate y
  autoIndex están deshabilitados para evitar escrituras de modelos antes de
  verificar esa propiedad.
- **15 pruebas de seguridad pasan**: un destino sintético válido y 14 rechazos
  (SRV, host externo, credenciales, otra base, nombre no reservado, otro puerto,
  opciones de URI, directorios ajenos, bind externo o proceso distinto/detenido).
  Estas pruebas usan valores sintéticos y no intentan conexiones externas.

Fragmento de la ejecución real, 11/11/2026 aproximadamente 20:52 en Ecuador
(los logs HTTP usan UTC: 12/11/2026 01:52):

```text
E1 aislamiento confirmado:
version=7.0.24; host=127.0.0.1; port=60880; pid=67910
dbName=savepoint_e1_test_e7084b64021d47da9aed95ee46497030
dbPath=<tmp>/savepoint-e1-rlVO5a/data
autoCreate=false; autoIndex=false
E1 aislamiento: MongoDB detenido; directorio temporal y datos eliminados.
tests 53; pass 53; fail 0; cancelled 0; skipped 0
```

`<tmp>` abrevia únicamente el directorio temporal del sistema. No representa
una base configurable. El runner registra el dbPath completo al ejecutarse.

### Operaciones realmente probadas

| Flujo                             | Rutas HTTP reales                                                                                 | Comprobación y resultado                                                                                                                                                                                                                                                                              |
| --------------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CRUD de videojuegos               | POST/GET /api/videojuegos; GET/PUT/DELETE /api/videojuegos/:id                                    | 201 al crear; 200 al listar, filtrar, consultar y editar; 204 vacío al borrar; consulta posterior 404. Se comprueba persistencia, trim, defaults y conservación de logros cuando PUT no los sustituye. Pasa.                                                                                          |
| Partidas y relaciones             | POST/GET /api/partidas; GET /api/videojuegos/:id/partidas; DELETE /api/partidas/:id               | Referencia correcta, historial general con videojuego poblado e historial propio; baja 204, segunda baja 404 y conservación de juego/partidas ajenos. Pasa.                                                                                                                                           |
| Logros                            | PATCH /api/videojuegos/:id/logros/:logroId; GET /api/videojuegos/:id                              | Marcar/desmarcar, persistencia del booleano e identidad y conservación del otro logro. Pasa.                                                                                                                                                                                                          |
| Resumen acumulado E1              | GET /api/videojuegos/:id/resumen                                                                  | Sin partidas: ceros y ultimaPartida null. Con 60/90/30 minutos: 3 horas; avances 80/30/70: máximo 80 aunque la última sesión sea 70. Orden por fecha, recálculo tras bajas y 1 minuto redondeado a 0,02 horas. Pasa.                                                                                  |
| Cascada                           | DELETE /api/videojuegos/:id; GET /api/partidas y consultas del otro juego                         | Desaparecen juego y sus dos partidas; el otro juego permanece idéntico, con su partida y resumen intactos. Pasa.                                                                                                                                                                                      |
| Validaciones 400                  | POST/PUT de videojuegos; POST de partidas; PATCH de logros                                        | Required, trim vacío, longitudes, enums con mayúsculas, referencias/tipos/IDs inválidos, fecha no interpretable, duración 0/1441, avance -1/101, notas largas y obtenido no booleano. Rechazos no crean documentos ni persisten ediciones inválidas; error y requestId coherentes con cabecera. Pasa. |
| Límites válidos                   | POST de videojuegos/partidas; GET del historial                                                   | Nombre 120, logro 100, notas 1000 caracteres; duración 1/1440, avance 0/100; enums Terror, Movil y Abandonado. Pasa.                                                                                                                                                                                  |
| Recursos inexistentes y rutas 404 | Consultas, PUT/DELETE y PATCH existentes; POST de partida con juego inexistente; ruta desconocida | IDs mal formados devuelven 400; ObjectId válido sin recurso, referencia o logro inexistentes devuelven 404. Incluye historiales y resumen de juego inexistente. Pasa.                                                                                                                                 |

**No existe actualización ni consulta individual de Partida.** No se inventaron
ni implementaron PUT/PATCH /api/partidas/:id o GET /api/partidas/:id. La consulta
de sesiones se verificó mediante los dos listados implementados.

### Errores observados, criterios y pendientes

- **T3 reproducido y pendiente:** POST con JSON truncado devuelve **500**, cuerpo
  `{"error":"Error interno del servidor"}` y sin requestId/cabecera x-request-id.
  El parser informa entity.parse.failed y el manejador existente lo trata como
  inesperado. La colección permanece intacta. Un test caracteriza esa deuda;
  pasar ese test no aprueba el contrato de error deseado para E2.
- No se encontraron fallos en los flujos E1 cubiertos. La primera consulta npm
  dentro del sandbox falló por DNS (ENOTFOUND); la instalación y ejecución con
  permisos de red/puertos locales funcionaron. No se recurrió a Atlas.

| Criterio autorizado                                                       | Estado                                                                                                               |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| MongoDB local exclusivo, sin Atlas ni configuración privada               | Verificado antes del CRUD, con validación antes de cada petición.                                                    |
| CRUD existente, relaciones, logros, resumen, cascada y preservación ajena | Verificados con HTTP real y persistencia MongoDB.                                                                    |
| Validaciones y errores 400/404                                            | Verificados; no se modificó la clasificación de errores de E1.                                                       |
| Detener instancia y limpiar datos                                         | Verificado: stop del proceso propio, PID inexistente (ESRCH), borrado exclusivo del mkdtemp y stat posterior ENOENT. |
| Tests y TypeScript                                                        | Pasan; detalle de comandos debajo.                                                                                   |
| JSON malformado conforme al contrato futuro                               | Pendiente T3, expresamente excluido de corrección en esta ampliación.                                                |
| Cierre de E2-HAB-01                                                       | Cerrado con aprobación explícita del usuario tras completar la evidencia del DoD.                                    |

### Reproducción y resultados de la ampliación CRUD

Desde backend:

```sh
npm test
npm run test:integration
npm run typecheck
```

Desde frontend, sin modificar archivos en aquella ampliación:

```sh
npm test
npm run typecheck
```

Desde la raíz:

```sh
python3 -B -m unittest discover -s tests/harness -v
```

- Backend base: **21/21** (6 previos y 15 nuevos del guard de aislamiento).
- Integración: **53/53**, desglosados en 9 escenarios principales y 44 subpruebas;
  52 comprobaciones de E1 y una caracterización de deuda T3. Ninguna omitida.
- Frontend: **8/8**. Harness: **23/23**. TypeScript backend/frontend: sin errores.
- La descarga inicial del binario requiere red y los tests necesitan permiso de
  escucha local. El runner de integración falla si falta un binario compatible
  o no puede confirmar aislamiento; nunca utiliza otra base como alternativa.
- El binario queda en backend/node_modules/.cache/savepoint-mongodb, ignorado
  por Git, para reutilizarlo. Los datos siempre usan un temporal nuevo y se
  eliminan al terminar; no se hace dropDatabase ni se limpia un servicio ajeno.

### Límites y archivos de esta ampliación

Esta prueba local standalone no certifica Atlas, despliegue, concurrencia,
rendimiento, atomicidad de la cascada ante fallos parciales (D3), todos los
enums posibles ni navegación de navegador real. Las fechas se comprueban solo
según el contrato E1 existente; no se resuelven B1/B2 ni se anticipa HAB-03.
T3, D1–D3 y las demás deudas del diagnóstico permanecen pendientes.

- Modificados: backend/package.json, backend/package-lock.json y este documento.
- Nuevos: backend/tests/integration-safety.test.ts y, bajo tests/integration/,
  preload.cjs, safety.ts, temporary-mongo.ts y e1-crud.test.ts.
- Sin cambios en backend/src ni frontend en la ampliación CRUD. Esa evidencia
  se registró antes del commit b67caa4, solicitado posteriormente por el usuario.

## Complemento aprobado: estados frontend y coherencia documental

El usuario aprobó el CRUD y mantuvo HAB-01 abierto hasta completar su DoD.
Después aprobó el plan de cinco pruebas frontend y correcciones de referencias
en las dos specs, antes de modificar archivos. Se ejecutó únicamente ese plan.

### Pruebas añadidas y regresiones

Se amplió frontend/tests/base.test.tsx, utilizando App y servicios existentes.
Las llamadas a listar se simulan dentro del test; no se cambian componentes,
servicios, estilos, dependencias ni comportamiento de E1. Las promesas de carga
se mantienen pendientes hasta comprobar la interfaz y se resuelven explícitamente.

| ID de evidencia | Escenario                      | Verificación real                                                                                                                                                                                                                                                             | Resultado final |
| --------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| HAB01-FE01      | Carga de videojuegos           | Con la API pendiente muestra Cargando datos…, sin vacío ni tarjetas; al resolver aparecen videojuegos y desaparece carga.                                                                                                                                                     | Pasa.           |
| HAB01-FE02      | Carga de partidas              | Con la API pendiente muestra carga y no vacío; al resolver muestra sesión y enlace a su videojuego.                                                                                                                                                                           | Pasa.           |
| HAB01-FE03      | Biblioteca vacía               | La API responde []; muestra el mensaje vacío sin carga ni tarjetas de videojuegos.                                                                                                                                                                                            | Pasa.           |
| HAB01-FE04      | Historial vacío                | La API responde []; muestra vacío sin carga ni botones de eliminar y conserva el enlace Nueva partida.                                                                                                                                                                        | Pasa.           |
| HAB01-FE05      | Recuperación tras error de API | La primera consulta falla; escribir Hades en el filtro existente provoca la segunda consulta. Durante ella desaparece el error y aparece carga; al resolver se muestran resultados, conservando filtro y mismo elemento DOM, sin remontar la interfaz. Dos llamadas en total. | Pasa.           |

La prueba previa de error de carga sigue comprobando que un fallo no se anuncia
como biblioteca vacía. Se conservan las regresiones de biblioteca, filtro,
cliente HTTP, eliminación 204 y protección de lecturas del entorno.
Esta recuperación verifica la biblioteca mediante el filtro existente; no
resuelve B4 ni acredita recuperación del formulario de partidas de HAB-06.

Primera ejecución dirigida: **7 pasaron y 1 falló** en base.test.tsx. El selector
buscaba las notas como texto exacto, pero la interfaz las concatena con la fecha.
Se corrigió únicamente el selector del test para buscar el contenido de las notas.
No se cambió la aplicación ni se detectó un fallo de producto en estos escenarios.

### Correcciones documentales y conservación de contratos

- E2-backend.md y E2-frontend.md registran la aprobación ya existente mediante
  «Si esta bien los specs estan aprobados», sin inventar una fecha de aprobación.
- El análisis de contradicciones inicial se conserva identificado como antecedente.
  Se actualizan referencias a runners, comandos disponibles, setup.cjs y evidencia.
- Se diferencia infraestructura HAB-01 ya verificada de criterios funcionales E2
  todavía asignados a otros tickets. Se aclara que T3 sigue pendiente en HAB-01.
- Comparación automática contra HEAD: secciones 3–8 de ambas specs (reglas y
  contratos), filas BE-AC/FE-AC y filas de decisiones C/F-C/P conservan su contenido,
  normalizando únicamente espacios. No se modificaron reglas ni criterios aprobados.

### Ejecución final y aislamiento confirmado

Ejecución del 11/11/2026 aproximadamente 21:58 en Ecuador
(12/11/2026 02:58 UTC en logs backend).

```sh
# frontend
npm run test:coverage
npm run typecheck

# backend
npm test
npm run test:integration
npm run typecheck

# raíz
python3 -B -m unittest discover -s tests/harness -v
```

test:coverage ejecuta la suite frontend completa, incluidas las cinco pruebas
nuevas y las regresiones previas. TypeScript comprueba aplicación y tests en
ambos proyectos mediante tsc --noEmit y tsconfig.test.json.

| Suite o comprobación                                      | Pasaron | Fallaron | Omitidas |
| --------------------------------------------------------- | ------- | -------- | -------- |
| Backend base                                              | 21      | 0        | 0        |
| Integración HTTP con MongoDB temporal                     | 53      | 0        | 0        |
| Frontend: 8 de interfaz, 3 del cliente y 2 de aislamiento | 13      | 0        | 0        |
| Harness                                                   | 23      | 0        | 0        |
| Total reportado por los runners                           | 110     | 0        | 0        |

Integración conserva el desglose de 9 escenarios principales y 44 subpruebas,
incluida una caracterización de T3. Las pruebas iniciales fallidas no se suman
a esta ejecución final. TypeScript backend/frontend termina con código 0.

Cobertura frontend de líneas: **44,66 %**, frente a **36,16 %** en la base inicial.
No se exige ni se inventa un umbral; este porcentaje no certifica todo E1/E2.
Persisten los avisos de futura migración React Router v7, sin ocultarlos ni
cambiar versiones o comportamiento para eliminarlos.

MongoDB volvió a iniciarse exclusivamente mediante el runner local aprobado,
con controles de identidad antes del CRUD y antes de las peticiones:

```text
version=7.0.24; host=127.0.0.1; port=64785; pid=70238
dbName=savepoint_e1_test_3a3f656a493f414b8ef85c8a66ca316d
dbPath=<tmp>/savepoint-e1-LzA7I7/data
E1 aislamiento: MongoDB detenido; directorio temporal y datos eliminados.
tests 53; pass 53; fail 0; cancelled 0; skipped 0
```

Se confirmó además, de forma independiente tras la suite, PID 70238 inexistente
(ESRCH) y directorio temporal eliminado. No se utilizó Atlas ni se leyeron,
modificaron o mostraron archivos .env. El binario reutilizado permanece en la
caché ignorada de node_modules; los datos del nuevo proceso se eliminaron.

### Cumplimiento de Definition of Done

Evaluación limitada al corte aprobado de HAB-01 y a su ampliación de regresión
CRUD. No acredita criterios funcionales E2 ni resolución de deudas ajenas.

| Requisito del backlog                                                                                  | Estado técnico          | Evidencia                                                                                                                                                               |
| ------------------------------------------------------------------------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DoD particular: prueba reproducible por capa, comandos y aislamiento sin entorno privado               | Cumplido                | Runners backend/frontend, pruebas de guards, MongoDB propio y comandos/resultados registrados.                                                                          |
| DoD común 1: alcance aprobado y arquitectura/contratos E1 conservados                                  | Cumplido                | Solo un archivo de tests y tres documentos en este complemento; backend/src y frontend/src sin cambios. Reglas, criterios y decisiones de specs comparados contra HEAD. |
| DoD común 2: tests pertinentes, límites, errores y regresiones con datos aislados                      | Cumplido                | 110 resultados aprobados, 0 fallos y 0 omitidos en la ejecución final; CRUD, validaciones, fixtures y comprobaciones de aislamiento.                                    |
| DoD común 3: backend según el corte y frontend con interacción, carga/error/vacío/éxito y recuperación | Cumplido                | CRUD E1 y errores 400/404; cinco pruebas nuevas HAB01-FE01–05 más las regresiones anteriores de interacción y error.                                                    |
| DoD común 4: evidencia visual                                                                          | No aplica a este ticket | No se modifican componentes o estilos ni se implementa un corte visual.                                                                                                 |
| DoD común 5: diff acotado, sin secretos y documentación coherente                                      | Cumplido                | Cuatro archivos previstos; encabezados/referencias corregidos; revisión del diff y formato Prettier sin errores.                                                        |
| DoD común 6: resultado presentado para revisión                                                        | Cumplido                | Informe y tabla del DoD entregados al usuario; staging, commit y push no realizados en este complemento.                                                                |
| Autorización de cierre                                                                                 | Aprobada por el usuario | Cierre autorizado explícitamente tras revisar el informe final y el DoD.                                                                                                |

**T3 sigue pendiente:** JSON malformado devuelve 500 sin requestId. El test
caracteriza el defecto y no lo convierte en comportamiento aprobado de E2.
Las limitaciones de navegador real, atomicidad, concurrencia, rendimiento y
fechas de otros tickets siguen vigentes. No quedan sin evidencia los tres
escenarios frontend solicitados dentro del alcance acordado.

Archivos modificados en este complemento:

- frontend/tests/base.test.tsx.
- docs/specs/E2-backend.md.
- docs/specs/E2-frontend.md.
- docs/verificaciones/E2-HAB-01.md.

No se añadieron archivos ni dependencias. No se modificó código de aplicación,
no se avanzó a otro ticket y no se realizó staging, commit ni push.
