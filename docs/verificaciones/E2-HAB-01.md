# E2-HAB-01 — Base de pruebas aisladas del producto

Fecha: 11 de noviembre de 2026, America/Guayaquil.

Estado: implementado y verificado, pendiente de revisión del usuario. No se
realizó staging, commit ni push. No se avanzó a HAB-03/04 ni a tickets visuales.

## Alcance autorizado

Referencias: [backlog](../backlog/E2-metas-y-rachas.md),
[spec backend](../specs/E2-backend.md) y [spec frontend](../specs/E2-frontend.md).
El usuario aprobó ambas specs y después el plan de empezar únicamente con
HAB-01 como requisito previo a las fechas y al trabajo visual.

Se incorporaron runners y fixtures de backend/frontend, TypeScript de pruebas
y el desacoplamiento mínimo de la fábrica de Express para no importar dotenv.
No se añadieron metas, cálculos E2 ni cambios en componentes/estilos del frontend.

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
- El runner backend usa node:test/tsx existentes. No conecta MongoDB: salud,
  rutas desconocidas y CORS se verifican en un puerto efímero de loopback;
  las validaciones del modelo son locales, sin persistencia.
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

## Comandos ejecutados

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

Resultado final: **6 backend + 8 frontend = 14 tests del producto**, más
**23 del harness**. Se comprobó formato con Prettier sobre los archivos del ticket.
Los tests HTTP backend necesitaron permiso de puerto local fuera del sandbox
de ejecución; no requieren acceso a un servicio externo ni credenciales.

## Regresión E1 y límites de la verificación

No se modificó frontend/src, sus rutas, componentes ni estilos. En backend no
se cambiaron modelos, servicios, controladores ni routers de E1; el único cambio
de producción es pasar explícitamente frontendUrl al crear la app.

Las regresiones enumeradas pasan, pero no certifican todo E1: todavía no hay
CRUD completo con base descartable, pruebas de cascada persistida ni una prueba
de navegador real. La cobertura frontend inicial es 36,16 % de líneas del conjunto
instrumentado, sin umbral de cobertura inventado para esta base mínima.
React Router emite avisos de migración futura a v7; no se cambió su versión ni
su comportamiento para ocultarlos.

B5 obtiene una base ejecutable, no cobertura funcional completa. T5 solo se
adelanta en la separación de crearApp; sus demás aspectos siguen pendientes.
El resto de bloqueantes y deuda permanece en el diagnóstico.

Mensaje de commit sugerido, sin ejecutarlo:

`test: habilitar pruebas aisladas para E2-HAB-01`
