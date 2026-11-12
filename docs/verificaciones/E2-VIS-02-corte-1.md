# E2-VIS-02 — corte 1: marco, navegación y biblioteca

Fecha: 12 de noviembre de 2026, America/Guayaquil.

Estado: **corte implementado y verificado; pendiente de revisión visual**.
VIS-02 sigue abierto: faltan formularios e historial. El usuario aprobó este
plan concreto mediante «Aprobado» antes de los cambios. Las dependencias VIS-01
y HAB-04/06 tienen código/evidencia, con cierres formales pendientes; este corte
no los cierra. No se realizó staging, commit ni push.

Fuentes: [AGENTS.md](../../AGENTS.md), [DESIGN.md](../../DESIGN.md),
[spec frontend §8](../specs/E2-frontend.md#8-adopción-visual-de-nebula-arcade),
[P-VIS](../specs/E2-frontend.md#resoluciones-aprobadas-comunes-y-de-interfaz),
[backlog](../backlog/E2-metas-y-rachas.md) y [diagnóstico](../diagnostico.md).
La spec aplicable ya estaba en Git antes del código; no se modifican sus reglas
ni se crea otro ticket o contrato. HEAD al comenzar: c28df74.

## Alcance implementado

- Marco compartido con fondo/panel, bordes, radios y espaciado de Nebula Arcade.
  Navegación identificada por nombre accesible; escritorio y móvil usan NavLink
  y muestran la ruta activa mediante borde y aria-current, además del color.
- Biblioteca: encabezado, búsqueda con etiqueta visible, tarjetas, metadatos,
  logros y acciones con tokens existentes. Se retiran los degradados y sombras
  decorativas de estas áreas; no se añaden imágenes, funciones ni bibliotecas.
- Una acción coral destacada en el encabezado, con texto oscuro. Acciones
  secundarias delineadas violetas; eliminación con texto/error y confirmación
  existente. Campos y acciones miden al menos 44 px.
- Carga y vacío anuncian estado; el error anuncia alerta y ofrece Reintentar,
  que llama a la consulta existente conservando el filtro. Nunca repite DELETE.
  La variante visual nueva de Estados se aplica solo en biblioteca; el render
  anterior sigue disponible para las otras vistas.

El marco afecta visualmente a todas las rutas, como se explicó en el plan.
FormJuego, FormPartida, ListaPartidas y Detalle conservan sus plantillas y lógica.
No hay interfaces E2 nuevas ni cambios de servicios, tipos, rutas, backend,
tokens, estilos globales, configuración Tailwind o recursos tipográficos.
Las variables/clases legacy necesarias para las vistas pendientes se conservan.

Prettier `--check` y `git diff --check` pasaron para los cuatro archivos del
corte. Se verificaron 31 enlaces locales de backlog/evidencia, los 23 estados
de tickets y la conservación de criterios, dependencias y DoD. Backend, tokens,
servicios, tipos e index.html permanecen sin cambios; staging sigue vacío.

## Tests primero y corrección mínima

Se añadieron nueve pruebas de comportamiento/accesibilidad antes de cambiar
App.tsx. Primera ejecución: **8 fallos y 1 correcta**. Reprodujeron falta de
nombres de navegación/estado activo móvil, etiqueta visible y estados/reintento
accesibles; la regresión de confirmación/eliminación ya pasaba.

Un error de sintaxis intermedio en la edición fue detectado por Prettier y
corregido antes de la ejecución final. Después pasaron **9/9** dirigidas y
**150/150** de la suite completa. No se sustituyeron aserciones visuales por
comparaciones de nombres de clases: las medidas de diseño se comprobaron en Chrome.

## Resultados ejecutados

| Comando / verificación                             | Resultado                                                                       |
| -------------------------------------------------- | ------------------------------------------------------------------------------- |
| FE: `npm test -- tests/biblioteca-visual.test.tsx` | 9/9 correctas, sin omisiones.                                                   |
| FE: `npm test`                                     | **150/150**, diez archivos: 141 regresiones y 9 nuevas; sin fallos u omisiones. |
| FE: `npm run typecheck`                            | Aplicación y pruebas correctas, salida 0.                                       |
| BE: `npm run typecheck`                            | Aplicación y pruebas correctas, salida 0.                                       |
| Chrome con API sintética local                     | **16/16 casos** en la ejecución final.                                          |

Las pruebas dirigidas forman parte de las completas, no se suman de nuevo.
Se usan clientes reales con fetch simulado. No se ejecutaron suites backend
ni MongoDB: este corte no modifica backend, contratos ni datos de aplicación.
Los runners y el servidor de revisión usan configuración aislada sin `.env`.

## Criterio → prueba → resultado

| Criterio / conservación E1       | Verificación                                                                       | Resultado                                                                                                                         |
| -------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Navegación y rutas               | Dos tests de navegación con aria-current; Chrome móvil; revisión de otras rutas    | Biblioteca/historial/nuevo juego siguen accesibles; activo identificable en ambos menús.                                          |
| Búsqueda y etiqueta              | Test de click en label y filtro por nombre, clientes reales/fetch simulado; Chrome | La etiqueta enfoca el campo y el GET mantiene filtro/URL existentes. No se corrige la concurrencia D2.                            |
| Datos y acciones de tarjeta      | Test de plataforma/género/estado/logros y href de progreso/edición/creación        | Se conservan datos y rutas; acciones disponibles por teclado y sin depender de hover.                                             |
| Eliminación E1                   | Tests y Chrome: cancelar/confirmar, recarga y otro juego intacto                   | Confirmación existente, un DELETE tras confirmar y consulta posterior. Error de baja conserva tarjetas; Reintentar solo hace GET. |
| Carga/error/vacío                | Tres pruebas dirigidas y tres casos Chrome                                         | Estados distintos, mensajes legibles y acciones existentes de lectura/creación.                                                   |
| Regresiones HAB-04/06 y resto E1 | Las 141 pruebas anteriores siguen pasando                                          | Fechas civiles, recuperación de formulario, clientes y demás flujos cubiertos mantienen sus regresiones.                          |
| Diseño real                      | Estilos computados, contraste, geometría, fuentes y capturas Chrome                | Detalle en la tabla siguiente; no se certifican las plantillas todavía pendientes.                                                |

## Cumplimiento contra DESIGN.md

| Requisito                   | Evidencia del corte                                                                                             | Estado / límite                                                                                                                                |
| --------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Paleta                      | Fondo RGB 43/13/20 y panel RGB 69/21/32; texto/acento/coral desde variables CSS                                 | Verificado en las cuatro anchuras. Sin clases legacy en el área migrada renderizada.                                                           |
| Tipografía                  | Título 32 px/700; secciones y tarjetas 24 px; campo/cuerpo 16 px; metadatos mínimo 14 px; acciones 18 px        | Escala verificada. Se conservan los fallbacks aprobados: Helvetica-Bold en título y ArialMT en cuerpo; no se cargaron Orbitron/Poppins/Nebula. |
| Jerarquía y superficies     | Radios 28 px de encabezado/contenedor y 20 px de tarjeta, relleno de tarjeta 24 px, separación de sección 48 px | Sin sombras ni degradados decorativos en el corte.                                                                                             |
| Contraste                   | Mínimo medido sobre el texto visible del área migrada: **4,829:1**                                              | Supera 4,5:1 en fondo, panel, metadatos y acciones; incluye texto oscuro sobre coral.                                                          |
| Controles                   | Doce controles visibles por anchura, todos ≥44 px; una acción con fondo coral                                   | Verificado; las secundarias son violetas delineadas.                                                                                           |
| Teclado y activo            | Foco violeta 3 px con separación 3 px; ruta activa con borde de 2 px y aria-current                             | Verificado en escritorio/móvil; el color no es la única señal.                                                                                 |
| Adaptabilidad               | 320, 375, 768 y 1440 px; una columna en los tres primeros y dos en 1440                                         | Sin scroll horizontal ni acciones recortadas dentro de las tarjetas. Título largo y acciones apiladas inspeccionados en móvil.                 |
| Estados y éxito de acciones | Carga/resolución, vacío con enlace, error/reintento y eliminación confirmada con lista actualizada              | Verificados; no se añadió una notificación o flujo nuevo.                                                                                      |
| Movimiento reducido         | Casos normal y reduce; GSAP existente sin cambios                                                               | Capturas principales con reduce. El verificador usa reloj sintético que avanza para no congelar GSAP en el caso normal.                        |
| Otras vistas                | Marco compartido comprobado en historial, registro de partida y detalle                                         | Solo prueba de marco/ruta; no certifica su adaptación visual completa. Formularios/historial siguen en VIS-02 y detalle en VIS-03.             |

Se emplean utilidades tipadas con variables CSS para distinguir el tamaño de
texto destacado del color destacado, cuyos alias comparten nombre. No se
duplican colores ni tamaños en otro archivo de tokens.

## Evidencia de navegador y límites

Chrome **157.0.8103.51**, servidor/API sintéticos en 127.0.0.1; `configFile: false`,
`envFile: false`, envDir vacío y preload protector. HTTPS externo bloqueado.
No se utilizó Atlas ni se leyeron archivos `.env` o credenciales. No se ejecutó
el script de desarrollo normal ni se añadieron dependencias.

Los 16 casos son: cuatro anchuras; navegación móvil activa; búsqueda;
error/reintento; vacío; carga/resolución; cancelar/confirmar eliminación;
fallo de eliminación sin repetir baja; movimiento normal y reducido; y tres
rutas con marco compartido. No constituyen pruebas conectadas a Express/MongoDB
ni una revisión de producción u otros navegadores.

Se inspeccionaron capturas de biblioteca de escritorio/móvil, tarjetas móviles
y error. Chrome, servidor y perfil/directorio temporal quedaron cerrados y
limpiados. Un intento inicial del verificador congeló el reloj de GSAP; se
corrigió el reloj del verificador, sin modificar las animaciones de la aplicación.

Artefactos temporales, fuera del repositorio:

- `/tmp/savepoint-vis02-c1-red.log`, `green.log` y `green2.log`, con prefijo completo `/tmp/savepoint-vis02-c1-` (green2 es el resultado dirigido final).
- `/tmp/savepoint-vis02-c1-fe-all.log`, `fe-typecheck.log` y `be-typecheck.log`, con el mismo prefijo.
- `/tmp/savepoint-vis02-c1-browser.cjs` y `/tmp/savepoint-vis02-c1-browser-final2.log`.
- `/tmp/savepoint-vis02-c1-browser/reporte.json`.
- Capturas en `/tmp/savepoint-vis02-c1-browser/`: `biblioteca-320.png`, `biblioteca-375.png`, `biblioteca-768.png`, `biblioteca-1440.png`, `tarjetas-375.png`, `carga.png`, `error.png` y `vacio.png`.

## Archivos y estado del ticket

| Archivo                                     | Cambio                                                                     |
| ------------------------------------------- | -------------------------------------------------------------------------- |
| `frontend/src/App.tsx`                      | Marco/navegación, presentación de biblioteca y variante visual de Estados. |
| `frontend/tests/biblioteca-visual.test.tsx` | Nuevo: nueve pruebas de accesibilidad y conservación E1.                   |
| `docs/backlog/E2-metas-y-rachas.md`         | Estado parcial y trazabilidad con los commits existentes.                  |
| `docs/verificaciones/E2-VIS-02-corte-1.md`  | Este registro.                                                             |

La comparación AST confirmó cambios en Layout, Estados y ListaJuegos; las
instrucciones de consulta/filtro/eliminación anteriores al return de ListaJuegos
y las demás funciones/componentes se conservaron. El cambio de navClass es solo
visual. No hubo extracción general de App.tsx ni cambios de reglas de negocio.

| DoD                                                  | Estado                                                                   |
| ---------------------------------------------------- | ------------------------------------------------------------------------ |
| Spec y plan del corte aprobados                      | Cubierto; dependencias con implementación/evidencia, cierres pendientes. |
| Tests primero, regresión y TypeScript                | Cubierto con los resultados anteriores.                                  |
| DESIGN.md en marco/navegación/biblioteca y navegador | Cubierto dentro del corte y límites indicados.                           |
| Formularios e historial de VIS-02                    | Pendientes de planes e implementación separados.                         |
| Revisión visual y cierre de VIS-02                   | Pendientes; no se cierra con este corte parcial.                         |

Los cierres de VIS-01 y HAB-04/05/06 siguen pendientes de aprobación explícita.
T1–T5, D1–D3 y PA01 conservan su clasificación/estado. No se implementaron
funciones E2, otros tickets, staging, commit ni push.

Mensaje sugerido: `feat: adaptar marco y biblioteca en E2-VIS-02`.
