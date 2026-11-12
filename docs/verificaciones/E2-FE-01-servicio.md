# E2-FE-01 — evidencia del servicio de progreso y tipos

Fecha: 11 de noviembre de 2026, America/Guayaquil.

Estado: primer corte técnico implementado y verificado bajo el plan aprobado
mediante «Aprobado»; pendiente de revisión del usuario. **E2-FE-01 permanece
abierto**: no se implementó todavía el panel de progreso ni sus estados visuales.

## Alcance y trazabilidad

Ticket: E2-FE-01 — Mostrar actividad semanal y avance sin meta.
Se aplican [spec frontend, §4](../specs/E2-frontend.md#4-contratos-del-servicio-metasapits),
[contrato backend, §5](../specs/E2-backend.md#5-contratos-http-aprobados) y
[backlog](../backlog/E2-metas-y-rachas.md#8-tickets-funcionales-frontend).
La spec estaba versionada antes del código; HEAD al comenzar era `a6663ff`.

Este corte incorpora únicamente:

- `metasApi.progreso(videojuegoId, signal?)`, GET
  `/api/videojuegos/:id/progreso`, sin cuerpo, sin parámetros de periodo ni
  usuario y con señal de cancelación opcional.
- Tipos `HitoDTO`, `HitoEvaluado`, `MetaDTO`, `ProgresoJuegoDTO` y
  `DetalleErrorApi`, conservando null explícito en meta y cumplimiento.
- `ErrorApi`, exportado desde el servicio, con mensaje, status opcional,
  requestId opcional y detalles de campo permitidos.
- Validación estructural de respuesta: campos y tipos requeridos, formato de
  IDs/fechas, rangos del contrato y correspondencia del videojuego solicitado.
  No se recalculan horas, porcentajes, cumplimiento ni hitos en frontend.

Los métodos de crear, editar, desactivar y rachas se incorporarán en sus propios
cortes. No se introdujeron stubs ni datos inventados para funcionalidades pendientes.
No se implementaron componentes, hooks, formularios, estilos ni cálculos de dominio.

## Comportamiento verificado

La base se obtiene de `resolverBaseApi`, usando variables de Vite ya disponibles
en ejecución, sin leer archivos privados. Se añade solo `/videojuegos/...`, sin
duplicar `/api`. El ID se codifica como un segmento. La falta de configuración
de producción y las bases inválidas se rechazan antes de llamar a fetch.

La respuesta conserva ceros reales, null, porcentajes superiores a 100 y los
decimales entregados por backend. No redondea ni limita porcentajes. Los datos
de otro videojuego, las metas inactivas en el DTO de progreso y respuestas
incompletas o de tipos incorrectos no se aceptan como éxito ni como un vacío.

Un error HTTP conserva su status y requestId del cuerpo o, en su defecto, de
la cabecera `x-request-id`. Los 400/404/409 pueden conservar mensaje y detalles
de campo; se seleccionan únicamente `campo` y `mensaje`, descartando otros
atributos. Los 5xx usan un mensaje genérico y descartan detalles internos.
Respuestas de error sin JSON también mantienen status y requestId disponibles.
Un fallo de red tiene ErrorApi sin status inventado. No hay reintentos automáticos.

Una respuesta 200 no JSON o incompatible produce ErrorApi con status 200: ese
status representa la respuesta HTTP recibida, no una aceptación de sus datos.
Un 204 es inesperado para este GET y también se rechaza, sin presentarlo como
progreso vacío. No se añadió aún el método DELETE de desactivación.

La cancelación conserva AbortError o el motivo de la señal. Una señal ya
cancelada evita fetch; si se cancela durante la lectura JSON, se descarta la
respuesta tardía. La gestión de solicitudes obsoletas entre rutas y periodos
corresponderá al hook de FE-01/INT-03, no se da por resuelta aquí.

## Pruebas ejecutadas y resultados reales

Las pruebas se escribieron antes del servicio. Primera ejecución dirigida:
falló la colección de la suite porque `./metasApi` todavía no existía. Después
de implementar pasaron 41 de 42; la aserción de cancelación tardía evaluaba
`signal.reason` antes de que ocurriera el abort asíncrono. Se corrigió el test
para comprobar el motivo después de recibir el rechazo, sin cambiar ese
comportamiento del servicio. La suite completa final pasó.

| Verificación / comando                                                                                                                                                     | Resultado                                                                                                                       |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Frontend: `npm test -- src/api/metasApi.test.ts`                                                                                                                           | Primera ejecución: suite sin recolectar por módulo inexistente. Primera implementación: 41 pasan/1 fallo en aserción asíncrona. |
| Frontend: `npm test`                                                                                                                                                       | **92/92**, cinco archivos; **42 nuevos + 50 existentes**. Ningún test falló o quedó omitido.                                    |
| Frontend: `npm run typecheck`                                                                                                                                              | Exit 0: aplicación y tests sin errores. Incluye comprobaciones estáticas de los campos null de ProgresoJuegoDTO.                |
| Backend: `npm run typecheck`                                                                                                                                               | Exit 0: aplicación y tests sin errores; backend sin cambios.                                                                    |
| Raíz: `./node_modules/.bin/prettier --check frontend/src/api/metasApi.ts frontend/src/api/metasApi.test.ts frontend/src/tipos.ts docs/verificaciones/E2-FE-01-servicio.md` | Los cuatro archivos cumplen formato.                                                                                            |
| Raíz: `git diff --check`                                                                                                                                                   | Exit 0.                                                                                                                         |

Desglose de las 50 regresiones existentes: 26 del resolver de base, 14 de los
clientes E1, ocho de interfaz E1 y dos de aislamiento. Se mantuvieron los avisos
existentes de futuras opciones de React Router; no se corrigieron en este corte.

## Criterio → prueba → evidencia

Todas las pruebas nuevas están en `frontend/src/api/metasApi.test.ts`.

| Contrato o criterio relacionado                     | Método                                                                                             | Resultado / límite                                                                                                                      |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Spec FE §4: ruta/base y cancelación GET             | Fetch simulado; base sintética, HTTPS con barra final y proxy; configuración inválida antes de red | Prefijo único, ruta canónica, GET sin cuerpo y señal transmitida. No verifica un proxy o despliegue real.                               |
| FE-AC02/03: valores observados frente a ausencia    | Fixtures con meta, sin meta y sin partidas; 140 %, ceros, null y decimales                         | DTO preservado sin recálculo ni redondeo. No acredita panel, barra, texto o invitación visual.                                          |
| Spec FE §4, parte de FE-AC12: errores tipados       | 400/404/409, 500, HTML/no JSON, cuerpos de error no objeto y red fallida                           | Mensaje/status/requestId y detalles seleccionados; sin filtrar stack de servidor ni datos adicionales. No acredita recuperación visual. |
| Parte de FE-AC09: identidad y cancelación           | Juego/meta ajenos, señal ya cancelada, AbortError de fetch y cancelación durante lectura           | Rechazo de datos de otro juego y propagación de cancelación. Hook, respuestas fuera de orden y cambio de periodo siguen pendientes.     |
| Spec FE §3: no presentar datos inválidos como ceros | Tabla de 16 DTO incompatibles y respuestas 200 no JSON/204                                         | Se rechazan estructuras incorrectas; no hay defaults numéricos silenciosos.                                                             |
| AC13: conservar E1                                  | Suite frontend completa y comparación estructural de tipos                                         | Los 50 tests previos pasan; clientes, App.tsx y estilos permanecen intactos.                                                            |

## Aislamiento y conservación de E1

Se ejecutó Vitest con la configuración aislada existente, base sintética
`http://api.example.test/api`, fetch simulado y preloads que bloquean `.env`.
Vite usa un directorio temporal vacío para su configuración de archivos y el
runner lo limpia al salir. No se importó la configuración productiva de Vite,
no se ejecutó build y no se leyeron ni modificaron `.env` ni variantes.

No se ejecutaron solicitudes contra un backend real, Atlas o MongoDB. Los
resultados son pruebas del cliente HTTP y regresiones UI existentes; no se
presentan como una nueva prueba de integración con persistencia.

`tipos.ts` recibió las declaraciones E2 y formato. Se compararon las siete
declaraciones originales contra HEAD mediante el parser/printer de TypeScript:
conservan su estructura. Se compararon hashes antes/después de App.tsx,
index.css, baseUrl.ts, videojuegosApi.ts y partidasApi.ts: sin cambios.
No se alteraron contratos, flujos ni estilos de E1, ni dependencias o scripts.

## Archivos del corte

- Nuevo: `frontend/src/api/metasApi.ts`.
- Nuevo: `frontend/src/api/metasApi.test.ts`.
- Modificado: `frontend/src/tipos.ts`.
- Nuevo: `docs/verificaciones/E2-FE-01-servicio.md`.

## Pendientes de cierre

E2-FE-01 conserva el panel, carga/error/vacío, integración acotada del detalle,
reconsulta y pruebas de interacción. Las dependencias HAB-04/05 y el cierre
del corte backend se revisarán antes de integrar/cerrar la historia. HAB-03/04
siguen pendientes para el contrato de fechas; no se declaran resueltos B1/B2.

Los métodos de metas restantes, formularios, hitos, confirmación y rachas
requieren sus planes separados. No se tipó todavía RachasDTO ni se llamó a
`/api/rachas`, cuyo backend continúa pendiente. T2 no se considera resuelta
por agregar ErrorApi al cliente E2; los clientes E1 no se refactorizaron.
T3 continúa pendiente en backend.

La validación de fechas del cliente es estructural; no duplica el calendario,
la selección semanal ni las reglas de cumplimiento del servidor. La revisión
visual de DESIGN.md no aplica aún a una pantalla nueva: este corte no cambió
componentes o estilos ni acredita accesibilidad o apariencia de las futuras vistas.

Sin staging, commit ni push. Resultado presentado para revisión; el ticket completo
permanece abierto y no se avanzó al siguiente corte.
