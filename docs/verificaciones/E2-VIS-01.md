# E2-VIS-01 — tokens, tipografía y reglas globales

Fecha: 11 de noviembre de 2026, America/Guayaquil.

Estado: alcance de base implementado y verificado bajo el plan aprobado mediante
«plan aprobado». Pendiente de revisión y autorización de cierre. No se avanzó
a VIS-02/03 ni se considera terminada la adaptación de todas las pantallas.

Fuentes: [DESIGN.md](../../DESIGN.md),
[spec frontend, §8](../specs/E2-frontend.md#8-adopción-visual-de-nebula-arcade) y
[backlog visual](../backlog/E2-metas-y-rachas.md#10-tickets-de-integración-visual-de-savepoint).

## Cambios del ticket

- Diez tokens de color canónicos en `index.css`. Tailwind consume variables CSS
  mediante nombres semánticos: fondo, panel, primario, acento, destacado, texto,
  texto-sec, exito, error y borde. Las variantes de opacidad se verificaron tanto
  al compilar como en Chrome; los valores de color no se repiten en Tailwind.
- Pilas de títulos Orbitron/Segoe UI/sans-serif y cuerpo Poppins/Segoe UI/Arial;
  Nebula queda excluida hasta disponer de recurso y licencia verificados.
  No se añadieron archivos de fuentes ni se instalaron o descargaron recursos.
- Utilidades de jerarquía 32/24/18/16/14 px, pesos 700/400/600/400/400,
  espaciado 4/8/16/24/32/48 px y radios 28/20/12/999 px.
- Fondo, texto, selección, opciones y títulos globales usan la base nueva.
  Los títulos se muestran en mayúsculas. Las clases de tamaño/peso de vistas
  existentes conservan sus prioridades hasta la migración por pantalla.
- Foco global violeta de 3 px con separación de 3 px, con especificidad suficiente
  para prevalecer sobre utilidades antiguas de foco de 2 px/azul. Se conservan
  las reglas existentes de movimiento reducido.

**Compatibilidad temporal explícita:** los colores `gamer.*` y sombras existentes
se trasladaron a variables `--legacy-*` en CSS, manteniendo sus valores. Las
vistas actuales aún contienen esas clases y algunos colores inline. No se
remapearon automáticamente sus botones naranjas de texto blanco a coral: ese
par de Nebula no cumple 4,5:1. La adopción de acciones coral con texto oscuro,
la retirada de sombras/degradados y la migración de componentes corresponden
a VIS-02/03. Los componentes nuevos deberán usar las utilidades semánticas.

El cambio global afecta la fuente, títulos y foco de E1, como se advirtió y
aprobó en el plan. No cambia rutas, datos, lógica de formularios o peticiones.

## Tipografía real y licencias

Se revisaron los archivos de fuentes disponibles en el proyecto: no hay recursos
locales suministrados de Nebula, Orbitron o Poppins ni licencia de Nebula que
habilite incorporarla. Se aplica la alternativa de fallbacks permitida por la
spec, sin afirmar que se estén renderizando las fuentes no suministradas.

Chrome confirmó en la muestra los recursos efectivos de plataforma:
**Helvetica-Bold** para el título y **ArialMT** para el cuerpo, ambos
`isCustomFont: false`. Las familias CSS calculadas conservan las pilas previstas.
La prueba bloqueó HTTPS externo; no dependió de Google Fonts. `index.html`
permanece intacto, incluidas sus referencias previas a Archivo/Instrument Sans;
no se añadieron recursos externos ni se certificaron licencias de fuentes nuevas.

## Contraste de pares previstos

Se calculó luminancia relativa sRGB y ratio sobre los tokens opacos. Estos
resultados no certifican todas las composiciones, opacidades o fondos de E1.

| Texto / fondo                 | Ratio   | Resultado para texto normal                        |
| ----------------------------- | ------- | -------------------------------------------------- |
| Texto / fondo principal       | 16,27:1 | Cumple ≥4,5:1.                                     |
| Texto / panel                 | 13,79:1 | Cumple.                                            |
| Texto secundario / panel      | 7,98:1  | Cumple.                                            |
| Acento / panel                | 4,83:1  | Cumple.                                            |
| Fondo oscuro / primario coral | 5,70:1  | Cumple; combinación prevista para acción primaria. |
| Fondo oscuro / acento         | 5,70:1  | Cumple; selección global.                          |
| Éxito / panel                 | 8,89:1  | Cumple.                                            |
| Error / panel                 | 6,66:1  | Cumple.                                            |
| Texto claro / primario coral  | 2,86:1  | No cumple; no usar como pareja de texto normal.    |

## Pruebas y comprobaciones ejecutadas

Se escribieron las pruebas antes de implementar CSS/Tailwind. La primera
colección quedó bloqueada por una URL de archivo incompatible con el runner;
se corrigieron las rutas del test sin cambiar el guard de `.env`. Tras implementar,
las cinco pruebas dirigidas pasaron. Prettier convirtió hexadecimales a minúsculas;
se corrigió una comparación sensible a mayúsculas, sin cambiar colores.

| Comando / método                                                                                                                                                | Resultado final                                                                             |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Frontend: `npm test`                                                                                                                                            | **97/97**, seis archivos, sin fallos u omisiones: cinco nuevas y 92 regresiones existentes. |
| Frontend: `npm run typecheck`                                                                                                                                   | Exit 0; aplicación y tests.                                                                 |
| Backend: `npm run typecheck`                                                                                                                                    | Exit 0; backend sin cambios.                                                                |
| Raíz: `./node_modules/.bin/prettier --check frontend/src/index.css frontend/tailwind.config.cjs frontend/tests/tokens.test.ts docs/verificaciones/E2-VIS-01.md` | Los cuatro archivos cumplen formato.                                                        |
| Raíz: `git diff --check`                                                                                                                                        | Exit 0.                                                                                     |
| Chrome 157.0.8103.51, CDP y servidor aislado                                                                                                                    | Nueve escenarios registrados y fuentes efectivas comprobadas; ejecución final sin fallos.   |

Las cinco pruebas nuevas comparan los diez colores con DESIGN.md, comprueban
reglas globales, compilan utilidades con PostCSS/Tailwind, verifican pares de
contraste y compatibilidad E1. Los tests del producto siguen comprobando estados
de carga/error/vacío y recuperación existentes, clientes E1/E2 y aislamiento.
Los avisos previos de React Router permanecen fuera del alcance.

La verificación en Chrome requirió corregir el verificador temporal: importación
de la API ESM de Vite, espera de estilos, comparación del título sin su
transformación visual y charset UTF-8 de la muestra. La inspección adicional
detectó la prioridad de utilidades de foco antiguas; se corrigió la regla CSS y
se volvieron a ejecutar navegador y suite frontend completa, ambos correctos.

## Evidencia renderizada

Se usó Chrome headless instalado, mediante CDP, sin Playwright/Puppeteer ni
paquetes nuevos. La app real se sirvió con Vite en 127.0.0.1 y datos API sintéticos;
no se inició backend ni se conectó a Atlas. `configFile: false`, `envFile: false`,
directorio de entorno vacío, guard de archivos activo y HTTPS externo bloqueado.
El servidor, Chrome y su perfil temporal se cerraron y limpiaron al finalizar.

Se comprobaron:

- Biblioteca a **1440×1000** y **375×812**, sin desbordamiento horizontal.
- Foco real con Tab: violeta, 3 px y separación 3 px en ambos anchos.
- Navegación con Tab + Enter hacia `/partidas`.
- Carga, error y vacío de biblioteca visibles con respuestas controladas.
- Controles del formulario de videojuego con etiquetas asociadas.
- Muestra temporal de utilidades: botón 44 px, título 32 px, cuerpo 16 px,
  panel 20 px, opacidad 50 % y colores coral/texto oscuro correctos.
- Foco en botón de muestra con clases antiguas `focus-visible:outline-2`
  y `focus-visible:outline-gamer-blue`: prevalecen los 3 px violetas.
- Movimiento reducido activo y fuentes realmente renderizadas.

La muestra de tokens es únicamente un fixture de verificación, no una pantalla
ni funcionalidad añadida al producto. Se inspeccionaron visualmente las capturas
de muestra y biblioteca móvil/escritorio. Las capturas de la app muestran también
la paleta y componentes anteriores, cuya migración no corresponde a este ticket.

Artefactos **temporales locales**, no versionados:

- [Muestra de tokens](/tmp/savepoint-vis01-evidencia/tokens.png).
- [Biblioteca escritorio](/tmp/savepoint-vis01-evidencia/biblioteca-1440.png).
- [Biblioteca a 375 px](/tmp/savepoint-vis01-evidencia/biblioteca-375.png).
- [Carga](/tmp/savepoint-vis01-evidencia/loading.png), [error](/tmp/savepoint-vis01-evidencia/error.png) y [vacío](/tmp/savepoint-vis01-evidencia/empty.png).
- [Formulario](/tmp/savepoint-vis01-evidencia/formulario.png).
- [Reporte con estilos y fuentes efectivos](/tmp/savepoint-vis01-evidencia/reporte.json).

El verificador utilizado está temporalmente en `/tmp/savepoint-vis-01.cjs`;
puede repetirse localmente con `node /tmp/savepoint-vis-01.cjs` mientras exista.
No se presenta ese artefacto temporal como parte de la suite versionada.

## Cumplimiento contra DESIGN.md

| Criterio                | Estado del alcance VIS-01                                                            | Pendiente en vistas                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| Paleta                  | Diez tokens y utilidades semánticas correctos; base global aplicada.                 | Clases legacy e inline se migran en VIS-02/03.                                               |
| Tipografía              | Pilas y escala configuradas; fallbacks efectivos verificados.                        | Recursos Orbitron/Poppins/Nebula no incorporados; tamaños/pesos legacy por vista pendientes. |
| Componentes y espaciado | Escala y radios preparados; muestra renderizada correcta.                            | Migración de controles, acciones, superficies, sombras y degradados pendiente.               |
| Contraste               | Ocho pares de texto previstos cumplen; claro/coral identificado como inválido.       | No se certifica el contraste integral de las pantallas antiguas.                             |
| Teclado y foco          | Foco y navegación verificados en Chrome; conflicto con utilidades antiguas resuelto. | Revisión exhaustiva por vista/dialogo en sus tickets.                                        |
| Adaptabilidad           | Biblioteca sin overflow en los dos anchos probados.                                  | No acredita todos los formularios, rutas o dispositivos.                                     |
| Carga/error/vacío       | Estados existentes visibles y regresiones correctas.                                 | Su rediseño e interacción completos se verifican en VIS-02/03 y FE.                          |
| Movimiento reducido     | Regla conservada y verificación con preferencia activa.                              | Sin nuevas animaciones.                                                                      |
| Conservación E1         | 92 regresiones anteriores pasan; componentes y lógica intactos.                      | No equivale a certificación de todos los flujos de E1.                                       |

## Archivos y límites

- Modificado: `frontend/src/index.css`.
- Modificado: `frontend/tailwind.config.cjs`.
- Nuevo: `frontend/tests/tokens.test.ts`.
- Nuevo: este documento.

Se compararon hashes antes/después de App.tsx, clientes HTTP E1/E2, tipos,
index.html, package.json, lockfile y app backend: los nueve permanecen idénticos.
No se instalaron librerías ni se tocaron `.env`, componentes, reglas de negocio,
backlog o specs. Los helpers B1/B2, recuperación B4, deuda T3 y dependencias
funcionales/visuales pendientes conservan su estado.

No se ejecutó el build productivo ni scripts que carguen configuración privada.
No se hizo staging, commit o push. El ticket espera revisión antes de su cierre;
VIS-02/03 requieren autorización independiente y sus dependencias del backlog.
