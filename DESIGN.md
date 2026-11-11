# DESIGN.md — SAVEPOINT

## 1. Propósito y alcance

Sistema visual de **SAVEPOINT — Diario de Progreso Gamer**, basado en el brand board **Nebula Arcade**. Aplica a la biblioteca, formularios y detalle de videojuegos, historial de partidas y la épica **E2 · Metas y rachas**. El nombre funcional de la aplicación sigue siendo SAVEPOINT; adoptar «Nebula Arcade» como nombre comercial requiere una decisión separada.

**Principio:** una interfaz oscura, legible y ágil, con personalidad arcade sin sacrificar claridad. Reutilizar componentes y convenciones existentes; la adopción del nuevo sistema visual no justifica alterar lógica de negocio.

## 2. Colores: tokens obligatorios

Definir una sola fuente de verdad de tokens CSS; los estilos y utilidades de Tailwind deben consumir esas variables, sin repetir colores hexadecimales en componentes.

| Token CSS           | Valor     | Uso                                            |
| ------------------- | --------- | ---------------------------------------------- |
| `--color-fondo`     | `#2B0D14` | Fondo principal de la aplicación               |
| `--color-panel`     | `#451520` | Tarjetas, barra lateral, formularios y paneles |
| `--color-primario`  | `#F2625A` | Acción primaria: crear, guardar, confirmar     |
| `--color-acento`    | `#9B7BFF` | Enlaces, foco, acciones secundarias y progreso |
| `--color-destacado` | `#F7E3A6` | Etiquetas de estado y datos destacados         |
| `--color-texto`     | `#FFF1EC` | Texto principal                                |
| `--color-texto-sec` | `#D9B3B0` | Texto secundario, fechas, ayudas y metadatos   |
| `--color-exito`     | `#6FDB9A` | Confirmaciones, hitos alcanzados               |
| `--color-error`     | `#FF8A80` | Errores y validaciones fallidas                |
| `--borde`           | `#6B2A38` | Límites sutiles entre superficies              |

- Texto principal sobre fondos oscuros; contraste de texto normal **mínimo 4,5:1**. Comprobar también combinaciones nuevas de texto, borde y estado.
- **Un solo botón primario coral destacado por contexto de acción**; las acciones secundarias usan contorno y texto violeta, nunca botón violeta relleno.
- Máximo **un degradado decorativo por pantalla**, reservado para el encabezado destacado si existe: `linear-gradient(120deg, #F2625A 0%, #8E3A55 55%, #4A2A7A 100%)`. No usarlo en barras de progreso si ya hay un encabezado con degradado.
- Estados de éxito y error siempre acompañados de texto o icono; el color no es el único indicador.
- Sin modo claro dentro de la aplicación. No utilizar `--fondo-pagina` rosa del documento de presentación: pertenece únicamente al marco exterior del brand board.

## 3. Tipografía

- **Títulos:** `"Nebula", "Orbitron", "Segoe UI", sans-serif`; usar Nebula solo si el proyecto dispone de una licencia y el recurso está correctamente instalado. **Orbitron** es el respaldo previsto. No incorporar fuentes de terceros sin revisar licencia.
- **Cuerpo, botones, formularios y ayudas:** `"Poppins", "Segoe UI", Arial, sans-serif` (pesos 400 y 600).
- Escala: título de pantalla **32 px / 700**; sección **24 px / 400**; texto destacado o botón **18 px / 600**; cuerpo y campos **16 px / 400**; metadatos y ayudas **14 px mínimo**.
- Títulos en mayúsculas y con espaciado moderado (`letter-spacing: .04em`); nunca usar fuente display para párrafos, instrucciones de formulario o mensajes de error.
- El estilo de título hueco (_hollow_) queda reservado para un único titular decorativo opcional, no para contenido funcional.

## 4. Espaciado, formas y distribución

- Retícula base de **4 px**; escala recomendada **8 / 16 / 24 / 32 / 48 px**.
- Separaciones: **8 px** etiqueta-campo; **16 px** entre controles o elementos relacionados; **24 px** de relleno de tarjeta; **48 px** entre secciones principales cuando haya espacio.
- Radios: **28 px** contenedor principal; **20 px** tarjetas; **12 px** avisos; **999 px** botones, etiquetas y campos tipo píldora.
- Las superficies se diferencian con fondo, borde y espaciado, **sin sombras decorativas**.
- Diseño responsive: las columnas de tarjetas y estadísticas pasan a una columna cuando no hay ancho suficiente; nada de scroll horizontal causado por formularios o tarjetas. Mantener las áreas seguras en dispositivos móviles.

## 5. Componentes necesarios para SAVEPOINT

| Componente                                       | Regla de diseño y comportamiento                                                                                                                                                       |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Navegación**                                   | Identidad visual consistente; estado activo identificable con forma/texto además del color.                                                                                            |
| **Tarjeta de videojuego**                        | Superficie panel, título legible, plataforma/estado como metadatos y acciones visibles o accesibles por teclado.                                                                       |
| **Búsqueda y filtros**                           | Campo con etiqueta; opción seleccionada clara y resultado vacío explicativo.                                                                                                           |
| **Botones**                                      | Altura y área interactiva mínimas de **44 px**; coral para acción principal, violeta delineado para secundaria; destructivas con confirmación y texto específico.                      |
| **Campos y selectores**                          | Altura mínima **44 px**, fondo oscuro, borde visible, etiqueta real asociada; error junto al campo con explicación concreta.                                                           |
| **Formularios de videojuegos, partidas y metas** | Agrupar campos relacionados; validaciones junto a cada control; indicar acciones de guardar/cancelar y evitar envíos duplicados.                                                       |
| **Hitos**                                        | Lista de hasta cinco objetivos; mostrar descripción, porcentaje objetivo y estado «Alcanzado»/«Pendiente» con texto e icono.                                                           |
| **Progreso semanal**                             | Barra horizontal de horas y texto numérico (`horasSemana / horasSemanales`, porcentaje); información de días jugados frente a días objetivo; distinguir valores faltantes y excedidos. |
| **Rachas**                                       | Dos datos separados: «Racha actual» y «Mejor racha», expresados en días; mostrar 0 sin ambigüedad.                                                                                     |
| **Estados**                                      | Carga con texto breve; error con motivo comprensible y opción de reintentar cuando aplique; vacío con siguiente acción clara.                                                          |
| **Confirmaciones y mensajes**                    | Mensajes en panel con radio **12 px**; éxito verde o error salmón acompañados por texto y, si es útil, SVG.                                                                            |

### Reglas específicas de E2

- En el **detalle del videojuego**, ubicar «Progreso semanal» junto a la información de progreso ya existente; no sustituir el resumen de E1.
- Si no hay meta activa, mostrar **horas, días y rachas** disponibles, e invitar a **«Crear meta»**; no representar un porcentaje de horas inexistente como 0 %.
- La barra visual de cumplimiento puede llenarse hasta 100 %, pero si el porcentaje calculado supera 100 %, **mostrar su valor real en texto** (por ejemplo 140 %), conforme al PRD aprobado.
- El avance de **horas** y el de **días** son indicadores distintos. No presentar el logro de horas como cumplimiento total de ambas condiciones.
- La creación/edición de metas debe contemplar **horas semanales (>0 y ≤100)**, **días por semana (entero 1–7)** e **hitos (máximo 5; porcentaje 1–100)**. Mostrar mensajes de validación claros.
- La acción **«Desactivar meta»** exige confirmación y debe informar el resultado. Evitar confundir desactivar con borrar el historial.
- Tras registrar o eliminar una partida, actualizar los indicadores visibles; en caso de edición, hacerlo cuando dicha operación esté disponible.

## 6. Accesibilidad e interacción

- Navegación funcional mediante teclado; foco visible de **3 px en `--color-acento`**, con separación de **3 px**.
- Todos los campos tienen `<label>` asociado y los botones de solo icono, nombre accesible.
- Barras de progreso con valor accesible (`role="progressbar"`, rango y nombre) y **equivalente numérico visible**; un porcentaje mayor de 100 no debe producir desbordamiento visual.
- Evitar depender exclusivamente de color, animaciones o iconos para comunicar resultados.
- No introducir animaciones imprescindibles para comprender o completar tareas. Respetar `prefers-reduced-motion`; transiciones discretas si se usan GSAP o CSS.
- Mensajes de error y éxito comprensibles; avisos dinámicos accesibles cuando corresponda.

## 7. Tono de la interfaz

- Español, **tuteo**, frases cortas, precisas y cercanas, sin exageración gamer.
- Usar vocabulario del producto: «Videojuegos», «Partidas», «Meta semanal», «Horas», «Días jugados», «Racha», «Hitos».
- Cada error debe decir **qué ocurrió y qué puede hacer el usuario**. Ejemplo: «No pudimos guardar la meta. Revisa los datos e inténtalo de nuevo».
- Estados vacíos orientados a una acción: «Todavía no tienes una meta para este juego. Crea una para seguir tu progreso semanal».

## 8. No hacemos

- No agregar funcionalidades ajenas a E1/E2, como tienda, descargas, lista de deseos, reseñas, notificaciones, rankings ni gráficos históricos: son ejemplos del brand board, no requisitos de SAVEPOINT.
- No instalar **nuevas** librerías de UI o CSS (Bootstrap, MUI, etc.). **Se conserva Tailwind**, ya presente en SAVEPOINT, configurándolo para usar los tokens de este documento. GSAP existente es opcional y no justifica animaciones innecesarias.
- No colocar colores hexadecimales arbitrarios, estilos ad hoc ni fuentes display en texto extenso.
- No usar emojis como sustituto de iconografía funcional; preferir SVG en línea y texto accesible, sin incorporar una librería de iconos nueva.
- No usar sombras decorativas, más de un degradado destacado por pantalla ni fondos claros dentro de la app.
- No copiar textos ni ejemplos del brand board que correspondan a una tienda o launcher de descargas.

## 9. Verificación de diseño antes de cerrar un ticket

Comprobar: **(1)** tokens y tipografía, **(2)** jerarquía/espaciado, **(3)** móvil y escritorio, **(4)** estados carga/error/vacío/éxito, **(5)** teclado y accesibilidad, **(6)** consistencia con las specs y comportamiento existente. Registrar desviaciones y corregirlas antes de marcar el ticket como terminado.
