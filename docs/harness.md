# Harness de SAVEPOINT — Proyecto 4, Fase 2

## Alcance y fuentes

Esta fase configura reglas y herramientas. No cambia frontend, backend,
componentes, estilos ni funcionalidades; tampoco resuelve los hallazgos de
`docs/diagnostico.md` ni aprueba una spec funcional.

`DESIGN.md` es la única fuente de verdad visual en la raíz. Se comparó con el
duplicado proporcionado: ambos contenían exactamente los mismos requisitos de
Nebula Arcade tras normalizar Markdown. Se eliminó el duplicado sin modificar
el documento canónico ni perder requisitos. El diseño identifica E2 como Metas y rachas;
la implementación visual requiere una spec aprobada en `docs/specs/`.

## Archivos y separación de herramientas

| Archivo                                                 | Uso                                                                                |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `AGENTS.md`                                             | Contexto, stack, estructura, comandos, convenciones y reglas centrales; 36 líneas. |
| `CLAUDE.md`                                             | Exactamente `@AGENTS.md` y un salto de línea.                                      |
| `DESIGN.md`                                             | Fuente visual conservada; no autoriza implementar el diseño.                       |
| `.claude/settings.json`                                 | Hooks propios de Claude Code. Codex no carga estos hooks.                          |
| `.claude/skills/commit/SKILL.md`                        | Skill manual `/commit` de Claude con el frontmatter académico exacto.              |
| `.agents/skills/commit/SKILL.md`                        | Skill equivalente de Codex, con las mismas cinco reglas de operación.              |
| `.agents/skills/commit/agents/openai.yaml`              | Desactiva la invocación implícita en Codex.                                        |
| `.agents/skills/savepoint-sdd/SKILL.md`                 | Flujo SDD de Codex, con plantilla en `spec-template.md`.                           |
| `.githooks/pre-commit`                                  | Hook Git independiente del cliente, activado en este clon.                         |
| `scripts/harness.py`                                    | Protección del índice, comprobación de formato e instalación de hooks Git.         |
| `scripts/claude_hooks.py`                               | Adaptador de eventos JSON de Claude para protección y formato.                     |
| `.prettierrc.json`, `package.json`, `package-lock.json` | Prettier fijado en la raíz, sin cambiar dependencias de la app.                    |
| `tests/harness/test_hooks.py`                           | Pruebas de hooks Git en repositorios temporales.                                   |
| `tests/harness/test_claude_hooks.py`                    | Pruebas de los comandos configurados en Claude y comprobaciones de reglas/skills.  |

El entorno de trabajo es ChatGPT + Codex, con compatibilidad académica para
Claude Code. Se retiró la entrada de Gemini porque solo repetía reglas centrales.
Se eliminó la configuración de Cursor después de comprobar que únicamente
repetía AGENTS.md y las referencias a la skill SDD, el diagnóstico y el diseño.
No se perdió información exclusiva. La prueba de formato MDC usa ahora un
documento sintético genérico, sin depender de una carpeta de Cursor.
`.github/copilot-instructions.md` es compatibilidad adicional para Copilot,
no requerida por ChatGPT + Codex ni por el enunciado de Claude. Se conserva
sin cambios, pero se recomienda dejarla fuera del commit de esta fase.

La configuración sigue las referencias oficiales de
[hooks de Claude](https://code.claude.com/docs/en/hooks),
[skills de Claude](https://code.claude.com/docs/en/skills),
[personalización de Codex](https://learn.chatgpt.com/docs/customization/overview)
y [estructura de skills](https://learn.chatgpt.com/docs/build-skills).

## Skill commit: operación manual

Claude: `/commit`. Codex: `/commit` si el cliente lo admite; en caso contrario,
invocar explícitamente `$commit`. No se afirma que Codex registre el mismo slash
command que Claude. `allow_implicit_invocation: false` controla Codex;
`disable-model-invocation: true` controla Claude.

Ambas skills exigen estos cinco pasos:

1. Revisar staging mediante `git diff --staged`. Antes de leer contenido, revisar
   solo los nombres y ejecutar `guard-env`; detenerse si hay `.env` o variantes.
   Así se satisface la revisión sin infringir la prohibición de leer esos archivos.
2. Detenerse si no hay cambios preparados. Nunca ejecutar `git add` ni preparar
   archivos por otro medio.
3. Revisar todos los cambios y detenerse ante secretos, contraseñas, tokens,
   claves API o posibles credenciales. No repetir valores sensibles al avisar.
   Si un cambio no puede revisarse, detenerse; no asumir que es seguro.
4. Generar un mensaje en español de máximo 72 caracteres, con tipo `feat`, `fix`,
   `docs`, `test`, `refactor` o `chore`, ligado a una fase o ticket.
5. Mostrar el mensaje y ejecutar solo `git commit -m`, sin rutas, `-a`, `--amend`
   ni omisión de hooks. Comparar antes el árbol de staging con el revisado y
   detenerse si cambió. Nunca ejecutar `git push`.

Las skills no modifican archivos ni incluyen inyecciones de comandos al cargarse.
Si un hook falla, se detienen sin arreglar o preparar archivos. La inspección de
credenciales es una instrucción de revisión del agente, no un detector infalible
ni un escáner automático implementado. No se ejecutó ninguna skill commit en
SAVEPOINT ni se probó su invocación dentro de los clientes.

## Hooks de Claude

En `.claude/settings.json`:

- **PreToolUse** para `Read|Write|Edit|MultiEdit|NotebookEdit|Bash`: ejecuta el
  adaptador en modo `guard`. Rechaza rutas `.env` y variantes antes de abrirlas,
  destinos protegidos a través de symlinks y rutas fuera del proyecto. En Bash
  bloquea referencias textuales explícitas a `.env`. Una denegación usa salida 2.
- **PostToolUse** para `Write|Edit|MultiEdit`: ejecuta el modo `format`, que pasa
  por Prettier únicamente los archivos indicados por la herramienta. No toca
  staging, no recorre la app y no formatea archivos ajenos a esa operación.
  Revalida rutas y protección antes de leer. Conserva la línea exacta de CLAUDE.md.

Se soportan Markdown/MDC, JSON, TS/JS, CSS, HTML y YAML; se omiten lockfiles,
formatos no soportados y archivos inexistentes. Falta de Prettier, entrada inválida
o fallo de formato se notifican con salida 2. PostToolUse sucede después de una
edición y no puede deshacerla; el bloqueo previo corresponde a PreToolUse.

Los scripts y su conexión con los comandos de settings se probaron con payloads
JSON sintéticos. **No se probó el ciclo real de Claude Code**: su CLI no está
instalada en este entorno. Abrir una sesión de Claude y revisar `/hooks` sigue
siendo una comprobación de integración pendiente.

## Hooks Git y uso local

Requisitos: Git, Python 3.9+, Node.js 20+ y npm. Desde la raíz:

```sh
npm ci --ignore-scripts
python3 scripts/harness.py install
git config --get core.hooksPath
```

El instalador configura `.githooks` solo para este clon y no reemplaza otro
`core.hooksPath`. Repetir en cada clon; no hay instalación global ni automática.

El pre-commit ejecuta primero `guard-env`, que solo consulta nombres del índice
y bloquea adiciones, modificaciones, eliminaciones o renombres de `.env`,
`.env.*` y metadatos macOS equivalentes. Incluye `.env.example`.
Luego `format-staged` compara los blobs del índice con Prettier. No modifica
archivos ni staging, no sigue symlinks y no lee blobs protegidos. Ante ausencia
de Prettier o formato incorrecto, rechaza el commit.

El hook Git comprueba formato; el PostToolUse de Claude lo aplica al archivo
editado. Codex usa las reglas, skills y comprobación Git, no los eventos de Claude.
No usar formateo global ni patrones que puedan alcanzar `.env`.

## Verificación ejecutada

```sh
python3 -B -m unittest discover -s tests/harness -v
python3 scripts/harness.py guard-env
python3 scripts/harness.py format-staged
```

El 10 de noviembre de 2026 pasaron **23 tests**:

- Diez tests de Git: commits sintéticos con formato correcto/incorrecto, contenido
  preparado distinto del working tree, protección por nombres, eliminaciones y
  renombres, symlinks, parser MDC, dependencia ausente e instalación sin reemplazos.
- Once tests de Claude: comandos reales de settings con payloads sintéticos;
  formato de un archivo con espacios en el nombre sin tocar otro archivo,
  bloqueo de rutas protegidas y shell explícito, symlinks, alcance, entrada inválida,
  falta de Prettier y preservación de CLAUDE.md.
- Dos tests de reglas: CLAUDE.md exacto, límite de AGENTS.md, cinco pasos,
  restricciones de staging y controles de invocación manual en ambas skills.

Los tests de Git crean commits únicamente en repositorios temporales. Sus casos
protegidos insertan blobs sintéticos directamente en el índice, sin crear, leer
ni modificar archivos `.env`. Los tests de Claude usan rutas protegidas inexistentes.
**No se hizo commit en SAVEPOINT ni se prepararon archivos para uno.**

La comprobación de reglas es estática; no demuestra cómo actuará un modelo ante
cada secreto o ambigüedad. Prettier y validación de skills se registran junto al
resultado final; no equivalen a tests funcionales de la aplicación.

## Revisión final de archivos para la Fase 2

- El duplicado del diseño y la entrada de Gemini ya no existen. Su equivalencia
  con las fuentes conservadas quedó comprobada en la limpieza anterior; no es
  posible repetir una comparación de dos archivos cuando uno ya fue eliminado.
- AGENTS.md conserva 36 líneas, referencia DESIGN.md y exige spec aprobada en
  `docs/specs/`, criterios de aceptación, tests, arquitectura y alcance.
- CLAUDE.md conserva exactamente `@AGENTS.md` seguido de un salto de línea.
- Ambas skills commit conservan sus cinco pasos y activación manual. Prohíben
  preparar archivos, incluir cambios nuevos y hacer push. No se invocaron para
  esta revisión; no se afirma que la detección de credenciales haya sido probada
  de extremo a extremo. Sigue siendo revisión del agente, no escaneo automático.
- Los archivos sin seguimiento que sí corresponden al harness son las reglas,
  DESIGN.md, skills, settings, hooks, scripts, tests, esta documentación y los
  archivos package y configuración de Prettier de la raíz. El lockfile de la raíz
  debe acompañar package.json para fijar la herramienta de formato.
- La configuración adicional de Copilot no es necesaria para esta fase. No se
  detectaron otros archivos inesperados entre los nombres sin seguimiento
  visibles mediante `git ls-files --others --exclude-standard`.
- No incluir dependencias instaladas, builds, cachés, metadatos macOS, archivos
  privados ni configuración local de Git. Los patrones existentes ignoran
  node_modules, dist, logs y metadatos macOS. Si aparecen cachés Python en otra
  ejecución, deben quedar fuera del commit; las pruebas se invocan con `-B`.
- No se modificaron frontend o backend ni se prepararon cambios en staging.

## Límites y próximo paso

Estos hooks no constituyen un sandbox ni impiden eludirlos deliberadamente.
La comprobación Bash no interpreta variables, comandos ofuscados o scripts que
carguen `.env` indirectamente. La prohibición de lectura/modificación sigue siendo
obligatoria para los agentes. Tampoco se afirma que PostToolUse de Claude opere
en Codex o que el hook Git impida editar antes del commit.

B5 del diagnóstico sigue abierto: estos tests verifican el harness, no el producto.
No cerrar tickets funcionales solo con ellos o con TypeScript. Las pruebas futuras
deben usar configuración sintética sin cargar dotenv/Vite desde `.env`.

Antes de implementar, aprobar la spec correspondiente en `docs/specs/`, resolver
los bloqueantes del flujo afectado y conservar las funciones de E1 y los problemas
diferidos. La siguiente implementación visual espera la spec del frontend.
