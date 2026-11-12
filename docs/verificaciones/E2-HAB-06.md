# E2-HAB-06 — Recuperación del formulario de partida tras error

Fecha: 12 de noviembre de 2026, America/Guayaquil.

Estado: **implementado y verificado; revisión y cierre pendientes del usuario**.
Plan aprobado mediante «aprobado» antes de escribir tests/código. Este corte
no cierra HAB-04/05/06 ni autoriza staging, commit o push.

Fuentes: [AGENTS.md](../../AGENTS.md), [diagnóstico B4](../diagnostico.md),
[backlog](../backlog/E2-metas-y-rachas.md), [spec frontend](../specs/E2-frontend.md)
y [DESIGN.md](../../DESIGN.md). La dependencia HAB-01 está cerrada. El contrato
de recuperación de formulario y el corte HAB-06 ya estaban en la spec antes
del código; no se cambian reglas, contratos, criterios ni dependencias.

## Cambio acotado

Solo cambia FormPartida en App.tsx: errores de carga y envío tienen estados
separados. Un POST fallido muestra un aviso `role="alert"` dentro del formulario;
no lo desmonta ni borra valores. Al enviar de nuevo se limpia el aviso anterior,
se conserva el borrador durante la solicitud y se navega al detalle al confirmar
éxito. Cancelar conserva su navegación al historial sin otro POST.

Se mantiene el selector civil y el envío YYYY-MM-DD de HAB-04. No cambian
clientes HTTP, tipos, rutas, backend, estilos globales ni componentes restantes.
El aviso usa tokens existentes: panel, error, borde y radio de aviso. No se
incorporan librerías ni se ejecuta la adaptación visual VIS-02/03.

El plan excluyó expresamente T4: no se añade bloqueo de doble envío. Tampoco
se reintenta POST automáticamente ni se incorporan idempotencia o cambios T2/T3.

## Tests primero y resultados

Se creó `frontend/tests/partida-error.test.tsx` antes de cambiar App.tsx.
La primera ejecución dio **7 fallos y 3 correctos**: los errores de envío
ocultaban el formulario, mientras carga/vacío/error del catálogo ya funcionaban.
Después de la corrección pasaron **10/10** dirigidos.

| Comando / verificación                         | Resultado real                                                                    |
| ---------------------------------------------- | --------------------------------------------------------------------------------- |
| FE: `npm test -- tests/partida-error.test.tsx` | 10/10, sin fallos u omisiones.                                                    |
| FE: `npm test`                                 | **141/141**, nueve archivos: 131 regresiones + 10 nuevas; sin fallos u omisiones. |
| FE: `npm run typecheck`                        | Aplicación y pruebas correctas, salida 0.                                         |
| BE: `npm run typecheck`                        | Aplicación y pruebas correctas, salida 0.                                         |
| Chrome con API sintética local                 | **7/7 casos**, ejecución final correcta.                                          |

Los tests dirigidos están incluidos en los completos. Se usan clientes reales
con fetch simulado, no una implementación alternativa del formulario. No se
repitieron las suites backend ni se inició MongoDB: este ticket no cambia
backend/contratos y su verificación utiliza exclusivamente datos sintéticos.
No se presentan resultados de HAB-03/04 como pruebas ejecutadas en este corte.

Prettier `--check` y `git diff --check` pasaron sobre los cuatro archivos del
corte. La comparación del AST de TypeScript confirmó cambios únicamente en
FormPartida; backend permanece sin cambios. Se conservaron historias, criterios,
dependencias y DoD aprobados; los 23 estados siguen representados y los enlaces
locales de backlog/evidencia son válidos. Staging permanece vacío.

## Criterio → prueba → evidencia

| Criterio B4 / DoD y regresión E1                   | Prueba                                                                 | Resultado                                                                                                                                                        |
| -------------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Error visible con formulario y valores disponibles | Casos POST 400, 500, 500 sin JSON y rechazo de red                     | Aviso accesible; mismas referencias DOM de los cinco controles, con videojuego, fecha, duración, avance y notas conservados. Un solo intento realizado por caso. |
| Corrección y reintento manual                      | Primer POST rechazado, cambio de duración y segundo POST pendiente/201 | Error anterior desaparece al reintentar; borrador permanece hasta resolver; JSON conserva día civil/resto de datos; navegación al detalle tras éxito.            |
| Segundo fallo recuperable                          | 400 seguido de 500, con notas corregidas                               | El mensaje se actualiza y las correcciones se conservan.                                                                                                         |
| Cancelar después del error                         | Link Cancelar tras POST rechazado                                      | Navega a /partidas; no genera un nuevo POST.                                                                                                                     |
| Carga inicial diferenciada del envío               | Catálogo pendiente/resuelto, vacío y 503                               | Conserva los estados E1; error de catálogo no se muestra como fallo de guardado ni permite enviar sin juegos.                                                    |
| Conservación de HAB-04/E1                          | Suite completa frontend                                                | Las 131 pruebas anteriores pasan; fechas civiles, biblioteca, historiales, resumen y servicios existentes conservan sus regresiones.                             |

No se afirma que un error de red garantice ausencia de escritura en servidor;
estas pruebas demuestran conservación del borrador y ausencia de reintento
automático de la aplicación. La incertidumbre de persistencia/idempotencia y
la prevención de envíos simultáneos no se resuelven en HAB-06.

## Navegador, accesibilidad y límites

Chrome 157.0.8103.51 con servidor Vite y API sintéticos en 127.0.0.1, reloj fijo
y Guayaquil. Configuración `configFile: false`, `envFile: false` y envDir vacío;
preload de protección de archivos y HTTPS externo bloqueado. No se usaron
Atlas, credenciales, `.env` ni el servidor de producción.

| Caso / DESIGN.md                                   | Resultado                                                                                                                                       |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| POST 400 → corregir → guardar, 1440×1000 y 375×812 | Mismo formulario y valores; dos intentos explícitos, una creación sintética exitosa y navegación correcta. Sin desbordamiento horizontal móvil. |
| POST 500 y 500 sin JSON                            | Aviso, borrador y Cancelar disponibles; Cancelar no reenvía.                                                                                    |
| Carga/resolución, catálogo vacío y error de carga  | Tres casos diferenciados; aviso de envío ausente donde no corresponde.                                                                          |
| Mensaje y contraste                                | Texto salmón sobre panel, radio 12 px; contraste medido **6,66:1**. Error expresado por texto y role alert.                                     |
| Teclado tras error                                 | Tab entre campos sigue funcionando; foco violeta de 3 px con separación 3 px.                                                                   |
| Renovación completa Nebula Arcade                  | Sigue en VIS-02/03; aquí solo se aplica el aviso con tokens existentes.                                                                         |

Se inspeccionaron las capturas de escritorio y móvil. El verificador se ajustó
para convertir colores CSS modernos a sRGB antes de medir contraste y consultar
el texto del encabezado sin su transformación visual a mayúsculas. Son cambios
del verificador temporal, no correcciones adicionales de la aplicación.

Chrome, servidor y perfil/directorio temporal quedaron cerrados y limpiados.
El navegador usa una API sintética; no acredita integración con Express/MongoDB
ni producción. El fallo de red se verifica en React, no en los casos Chrome.

Artefactos temporales fuera del repositorio:

- `/tmp/savepoint-hab06-red.log` y `/tmp/savepoint-hab06-green.log`.
- `/tmp/savepoint-hab06-fe-all.log`, `/tmp/savepoint-hab06-fe-typecheck.log` y `/tmp/savepoint-hab06-be-typecheck.log`.
- `/tmp/savepoint-hab06-browser.cjs` y `/tmp/savepoint-hab06-browser-final2.log`.
- `/tmp/savepoint-hab06-browser/reporte.json`, `error-1440.png` y `error-375.png`.

## Archivos y DoD

| Archivo                                 | Cambio                                                                           |
| --------------------------------------- | -------------------------------------------------------------------------------- |
| `frontend/src/App.tsx`                  | FormPartida: errores separados y aviso accesible, conservando el formulario.     |
| `frontend/tests/partida-error.test.tsx` | Nuevo: diez pruebas con transporte simulado.                                     |
| `docs/backlog/E2-metas-y-rachas.md`     | Estado/evidencia y referencia al commit anterior 59bfc98; sin alterar criterios. |
| `docs/verificaciones/E2-HAB-06.md`      | Este registro.                                                                   |

| Condición                                             | Estado                                                          |
| ----------------------------------------------------- | --------------------------------------------------------------- |
| Spec/plan aprobados y dependencia HAB-01              | Cubierto.                                                       |
| Tests primero y reproducción del defecto              | Cubierto: 7 fallos iniciales; 10/10 finales.                    |
| Error/corrección/reintento conservan formulario/datos | Cubierto por React y navegador con los límites indicados.       |
| Regresiones frontend y TypeScript de ambas capas      | Cubierto.                                                       |
| Navegador, móvil, teclado y contraste del aviso       | Cubierto.                                                       |
| Formato, alcance y documentación                      | Cubierto: Prettier, diff, AST, criterios y enlaces comprobados. |
| Revisión y cierre                                     | Pendiente de autorización del usuario.                          |

T3, T4 y el resto de deuda/diferidos siguen pendientes. HAB-04 continúa con
cierre formal pendiente. No se ejecutaron otros tickets ni se hizo staging,
commit o push.

Mensaje sugerido: `fix: conservar formulario tras errores en E2-HAB-06`.
