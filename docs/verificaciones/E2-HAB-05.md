# E2-HAB-05 — Alinear URL base y `/api` en clientes/documentación

Fecha: 11 de noviembre de 2026, America/Guayaquil.

Estado: implementado y verificado, pendiente de revisión y autorización de
cierre del usuario. Implementación incorporada en **1e528cb**, por invocación
manual de la skill commit. El commit no constituye aprobación de cierre.
La regularización documental posterior no realizó staging, commit ni push.

## Alcance aprobado y trazabilidad

Fuentes: [backlog](../backlog/E2-metas-y-rachas.md),
[diagnóstico B3](../diagnostico.md),
[spec frontend: Base URL y prefijo](../specs/E2-frontend.md#base-url-y-prefijo).

El usuario aprobó primero el orden HAB-05 → HAB-03 → HAB-04 → HAB-06 y después
el plan concreto de HAB-05 mediante «plan aprobado», antes de modificar archivos.
El corte comparte únicamente la resolución de base entre los clientes E1,
prueba su comportamiento y corrige la documentación. No añade endpoints,
componentes, estilos, dependencias ni funcionalidades de metas/rachas.

## Contrato implementado

`resolverBaseApi(valor: string | undefined, esDesarrollo: boolean): string`
es una función pura en frontend/src/api/baseUrl.ts. Recibe valores explícitos;
no accede a archivos, red ni variables de entorno por sí misma.

| Configuración                                                                                                       | Resultado                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| URL HTTP(S) absoluta cuya ruta termina en un único segmento api                                                     | Base válida. Se normalizan espacios exteriores y barras finales; los clientes añaden solo la ruta del recurso. |
| `/api` explícito, con o sin barra final, en desarrollo                                                              | Base relativa `/api`, para el proxy ya existente de Vite.                                                      |
| Valor ausente, vacío o solo espacios en desarrollo                                                                  | Fallback `/api`, sin conexión absoluta implícita a localhost.                                                  |
| Valor ausente, vacío o solo espacios en producción                                                                  | Error comprensible que identifica VITE_API_URL; no se ejecuta fetch.                                           |
| Valor relativo en producción, base sin `/api`, prefijo duplicado, URL/protocolo inválido o recurso en lugar de base | Error antes de fetch; no se añade `/api` automáticamente para corregir configuración inválida.                 |
| Barras como único valor, barras internas duplicadas, consulta, fragmento o credenciales                             | Configuración inválida. El error no reproduce el valor recibido.                                               |

Ambos clientes llaman al resolver dentro de su función async request, antes de
fetch, usando import.meta.env.VITE_API_URL e import.meta.env.DEV. Una configuración
inválida rechaza la promesa; no lanza al importar el módulo ni impide montar App.
Los manejadores de error existentes pueden mostrar el mensaje. Cada cliente
conserva sus rutas, métodos, cabeceras, cuerpo, errores HTTP y DELETE 204.

El README explica el contrato y corrige el ejemplo público a
`VITE_API_URL=https://savepoint-diariogamer.onrender.com/api`. La configuración
de Vite ya incluía el proxy requerido y no fue modificada. Los demás cambios
de formato de README y clientes proceden de Prettier sobre los archivos editados.

## Tests primero y resultados intermedios

1. Se añadieron baseUrl.test.ts y pruebas de ambos clientes antes de crear el
   resolver. La primera ejecución dirigida falló en **2 suites**, sin ejecutar
   casos, porque el módulo baseUrl todavía no existía.
2. Tras la implementación mínima pasaron **37 casos dirigidos**: 23 del resolver
   y 14 del cliente HTTP.
3. Se añadieron tres casos de URL inválida: barra sola, solo barras y barras
   internas duplicadas. **24 pasaron y 2 fallaron**: la normalización hacía que
   los valores `/` y `///` se confundieran con ausencia en desarrollo.
4. Se separó la detección de ausencia de la normalización de barras. La suite
   final completa pasó; no se mantuvieron tests fallidos ni se ocultaron casos.

## Criterio → prueba → resultado final

| Evidencia  | Verificación                                                                                                                                                     | Resultado                                                                       |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| HAB05-AC01 | Base absoluta válida y barras finales; casos inválidos sin prefijo, prefijo duplicado, URL/protocolo incorrecto y recurso en vez de base.                        | Pasan en baseUrl.test.ts.                                                       |
| HAB05-AC02 | Ausencia/vacío/espacios en desarrollo devuelve `/api`; producción los rechaza. Base relativa explícita se admite solo en desarrollo.                             | Pasan en baseUrl.test.ts.                                                       |
| HAB05-AC03 | Videojuegos y Partidas utilizan la base normalizada y el fallback de desarrollo; las URL finales contienen una sola ocurrencia de `/api`.                        | Pasan cuatro pruebas parametrizadas en tests/api.test.ts; fetch está simulado.  |
| HAB05-AC04 | Ambos clientes rechazan configuración de producción ausente o base sin `/api` antes de fetch y mediante promesa, no error al importar.                           | Pasan cuatro pruebas parametrizadas, incluida comprobación de fetch no llamado. |
| HAB05-AC05 | Contratos E1: filtro codificado, mensaje HTTP, creación de partida con cabeceras/cuerpo y respuestas 204 sin parsear JSON; fallback de mensaje ante 500 no JSON. | Pasan seis tests de cliente, incluidos los tres previos.                        |
| HAB05-AC06 | Biblioteca y filtro, carga/vacío de juegos y partidas, error y recuperación mediante filtro.                                                                     | Pasan los ocho tests UI heredados de HAB-01, con servicios simulados.           |
| HAB05-AC07 | Protección de lecturas de entorno y regresión backend/CRUD con persistencia local.                                                                               | Pasan los guards y las suites backend; no se utilizaron datos privados.         |

La suite frontend contiene **26 pruebas del resolver + 14 del cliente HTTP +
8 de interfaz + 2 de aislamiento = 50**. Son 37 pruebas nuevas respecto a las
13 existentes al cerrar HAB-01.

## Comandos y resultados ejecutados

Desde frontend:

```sh
npm test -- src/api/baseUrl.test.ts tests/api.test.ts
npm test -- src/api/baseUrl.test.ts --reporter=dot
npm run test:coverage
npm run typecheck
```

Los dos primeros comandos corresponden a los ciclos dirigidos descritos arriba.
test:coverage ejecutó todos los tests frontend después de la corrección.

Desde backend:

```sh
npm test
npm run test:integration
npm run typecheck
```

| Comprobación final                       | Resultado                                                               |
| ---------------------------------------- | ----------------------------------------------------------------------- |
| Frontend completo, 4 archivos de pruebas | 50 aprobadas, 0 fallidas, 0 omitidas.                                   |
| Backend base                             | 21 aprobadas, 0 fallidas, 0 omitidas.                                   |
| Integración HTTP con MongoDB temporal    | 53 aprobadas, 0 fallidas, 0 omitidas.                                   |
| Total reportado por estos runners        | 124 aprobadas, 0 fallidas, 0 omitidas.                                  |
| TypeScript frontend/backend              | Ambos comandos terminaron con código 0; aplicación y tests sin errores. |
| Formato y whitespace                     | Prettier de los siete archivos y git diff --check correctos.            |

Las 53 de integración incluyen escenarios principales/subpruebas y una
caracterización del defecto T3, no su corrección. La cobertura frontend de líneas
es **53,03 %**; baseUrl.ts alcanza **100 % de líneas** en esta ejecución. Estos
porcentajes no certifican todo E1 ni sustituyen los criterios del ticket.
Se mantienen los avisos existentes de migración futura React Router v7.

## Evidencia de aislamiento

Solo se utilizaron configuración sintética y los runners protegidos de HAB-01:
Vitest con envDir temporal vacío y preload que impide lecturas de archivos
privados; backend sin importar index.ts/config/env.ts y con bloqueo de dotenv.
Las pruebas frontend de HTTP simulan fetch, sin solicitudes a los dominios de ejemplo.

Regresión backend ejecutada aproximadamente a las 22:19 del 11/11/2026 en Ecuador
(03:19 del 12/11/2026 UTC en los logs):

```text
version=7.0.24; host=127.0.0.1; port=51385; pid=71479
dbName=savepoint_e1_test_fae54709f0f5495181b042290b741b7a
dbPath=<tmp>/savepoint-e1-jTIQA9/data
E1 aislamiento: MongoDB detenido; directorio temporal y datos eliminados.
tests 53; pass 53; fail 0; cancelled 0; skipped 0
```

Se validaron identidad, host, puerto, nombre y directorio antes del CRUD. Después
se confirmó independientemente PID inexistente (ESRCH) y temporal eliminado.
No se accedió a Atlas ni se leyeron, modificaron o mostraron archivos .env.

## Cumplimiento del DoD y límites

| Requisito                             | Estado y evidencia                                                                                                           |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| DoD particular HAB-05                 | Verificado con bases sintéticas, prefijo único en ambos clientes y documentación alineada; sin editar configuración privada. |
| Alcance y arquitectura                | Solo resolución compartida de BASE; se conservan los dos clientes, sus contratos y las capas actuales.                       |
| Tests, errores, límites y regresiones | 124 resultados finales aprobados, incluidos rechazos previos a fetch y CRUD E1 local.                                        |
| Estados frontend pertinentes          | Regresiones UI de HAB-01 conservadas; errores nuevos de configuración se propagan como rechazo async de los clientes.        |
| Evidencia visual                      | No aplica: no se cambian componentes, estilos ni diseño.                                                                     |
| Documentación, formato y diff         | README y este documento revisados; siete archivos autorizados; sin dependencias ni archivos ajenos.                          |
| Revisión y cierre                     | Resultado presentado al usuario; autorización de cierre pendiente. No se declara cerrado por tener código o tests aprobados. |

No se verificó Render ni el valor real de VITE_API_URL desplegado. No se ejecutó
build/dev, porque podrían cargar archivos privados. Desarrollo/producción se
probaron mediante parámetros explícitos del resolver; la unión de base/ruta se
probó con fetch simulado. No se certifica una prueba de navegador conectado al
backend ni la operación real del proxy de Vite. El CRUD backend se probó aparte
con HTTP y MongoDB local, sin afirmar un E2E completo.

T2 no se considera resuelta: request y la representación de errores siguen
separados. T3 permanece pendiente (JSON malformado 500 sin requestId). No se
resolvieron B1/B2/B4 ni se avanzó a HAB-03/04/06 o funcionalidades E2.

## Archivos de implementación del ticket (1e528cb)

- Nuevos: frontend/src/api/baseUrl.ts, frontend/src/api/baseUrl.test.ts y este documento.
- Modificados: frontend/src/api/videojuegosApi.ts, frontend/src/api/partidasApi.ts,
  frontend/tests/api.test.ts y README.md.
- Sin cambios en backend, componentes, estilos, dependencias, specs o backlog.

Commit de implementación ejecutado por autorización independiente del usuario:

`1e528cb fix: alinear base API y prefijo en E2-HAB-05`

## Regularización de trazabilidad SDD

El usuario aprobó el plan documental mediante «Plan aprobado». Se actualiza la
referencia al commit, sin alterar resultados ni autorizar cierre. Las specs
estaban versionadas en ca734b6 y actualizadas en 25d1daf, ambos anteriores al
código HAB-05 de 1e528cb. El alcance concreto fue aprobado antes de implementarlo.

La tabla de archivos de la spec frontend asigna ahora la creación inicial de
metasApi.ts únicamente a FE-01. HAB-05 conserva la resolución de base y sus dos
clientes E1, según el plan aprobado; no se considera faltante una funcionalidad
que no pertenecía a ese corte.

Estado, dependencias y métodos de verificación se consultan en el
[backlog](../backlog/E2-metas-y-rachas.md#13-estado-actual-y-siguiente-paso).
La matriz diferencia aceptación funcional E2 prevista de las regresiones E1 ya
ejecutadas. No se volvieron a ejecutar tests del producto para este ajuste documental;
T2/T3 y las limitaciones de despliegue/producción descritas siguen vigentes.
