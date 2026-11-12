# E2-HAB-01 — Base de pruebas aisladas del producto

Fecha: 11 de noviembre de 2026, America/Guayaquil.

Estado: base de pruebas y verificación CRUD local implementadas y verificadas;
pendiente de revisión y autorización de cierre del usuario. En esta ampliación
no se realizó staging, commit ni push. No se avanzó a HAB-03/04 ni a tickets visuales.

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
| Cierre de E2-HAB-01                                                       | Pendiente revisión y aprobación del usuario; no se declara cerrado.                                                  |

### Reproducción y resultados actuales

Desde backend:

```sh
npm test
npm run test:integration
npm run typecheck
```

Desde frontend, sin modificar archivos:

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
- Sin cambios en backend/src, frontend ni otros tickets. No se prepararon
  archivos en staging, no se hizo commit ni push.

Mensaje de commit sugerido, sin ejecutarlo:

`test: habilitar pruebas aisladas para E2-HAB-01`
