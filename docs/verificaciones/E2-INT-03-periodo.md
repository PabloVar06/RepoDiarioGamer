# E2-INT-03 — período vigente, foco y visibilidad

Fecha: 12 de noviembre de 2026, America/Guayaquil.

Estado: implementado/verificado; pendiente de revisión conjunta. Autorización:
pasos 7/8. Dependencias FE-01/02/03 aprobadas; P06/PA06 y frontend FE-AC09/10/12
aprobados/versionados antes del código. Sin staging, commit ni push.

`useActualizacionPeriodo` programa una próxima consulta para el siguiente día
de la fecha del backend, usando America/Guayaquil explícito mediante Intl, sin
depender del TZ del navegador. Reprograma al responder, suspende el timer en
pestaña oculta y reconsulta al recuperar foco/visibilidad. Eventos simultáneos
comparten la misma solicitud pendiente. No hay polling periódico ni cron.
Se conserva la última referencia al limpiar datos durante una consulta; un día
vencido devuelto otra vez no genera un bucle. Al desmontar/cambiar ruta se
limpian timers/listeners y las consultas anteriores se cancelan/descartan.

| Criterio              | Prueba / resultado                                                                                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AC05 / P06            | `cambio-periodo.test.tsx`: 04:59:59Z→05:00Z de lunes cambia semana/racha mediante GET; siguiente minuto no consulta otra vez.                                            |
| Suspensión            | Pestaña oculta cancela timer; visibilidad/foco al volver reconsultan ambos indicadores, cubriendo día omitido.                                                           |
| Agrupación de eventos | Foco y visibilidad simultáneos producen una pareja GET; StrictMode no duplica listeners activos.                                                                         |
| Error                 | Fallo al cambio de día se informa, no inventa ceros ni entra en polling; foco permite recuperar.                                                                         |
| Limpieza / ID         | Desmontar elimina timers/listeners; cambiar ID ignora respuesta vieja y la consulta temporal pertenece al juego actual.                                                  |
| Calendario            | Próximo corte cruza mes/año/bisiesto; fechas civiles inválidas no generan timeout NaN.                                                                                   |
| Borrador              | `meta-editar.test.tsx`: foco vuelve a consultar, pero mantiene el nodo/valor editado aunque cambie la meta del servidor.                                                 |
| Navegador             | Cambio de día real mediante reloj de prueba y HTTP/MongoDB temporales; racha visible pasa a 0 sin perder borrador. Foco/visibilidad juntos no duplican la pareja de GET. |

Pruebas primero: seis fallos y una verificación previa ya correcta antes del
timer. Se añadió cobertura de calendario/borrador. La configuración común de
tests fija solo Date al instante sintético de los DTO; evita depender de la fecha
real al introducir temporizadores. INT-03 restablece y controla todos los timers
en su suite, que tiene **12 pruebas**. No cambia el reloj de la aplicación real.

Frontend al terminar INT-03: **278/278**, TypeScript correcto. Después, una
regresión de foco detectada en navegador se corrigió en FE-05, dejando el bloque
en **279/279**. Backend sin cambios: **165/165** base y **162/162** integración
temporal; TypeScript correcto. Prettier y evidencia visual en informe conjunto.

Logs `/tmp/savepoint-int03-red.log`, `/tmp/savepoint-int03-directed.log`,
`/tmp/savepoint-int03-full.log`, `/tmp/savepoint-int03-types.log`,
`/tmp/savepoint-bloque78-final-frontend.log` y `/tmp/savepoint-bloque78-browser.log`.
La pestaña suspendida se actualiza al recuperar ejecución; no se promete DOM
exactamente a medianoche mientras el navegador la mantiene suspendida. Sin Atlas,
`.env`, store global, sincronización entre pestañas ni nuevas dependencias.
