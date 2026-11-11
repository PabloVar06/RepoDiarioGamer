---
name: commit
description: Crea un commit seguro de los cambios previamente preparados en staging mediante invocación manual explícita del usuario.
---

1. Revisar los cambios preparados con `git diff --staged`. **Antes de mostrar
   contenido**, ejecutar `git diff --staged --name-only --no-renames -z` y
   `python3 scripts/harness.py guard-env`. Si aparece `.env` o una variante,
   detenerse y avisar sin leer su contenido. Si pasa el control, ejecutar
   `git diff --staged --no-ext-diff --no-textconv --no-renames` para leer todos
   los cambios preparados, sin truncarlos. Registrar `git write-tree` para
   identificar exactamente el staging revisado. No leer archivos no preparados.
2. Si no hay cambios en staging, avisar al usuario y detenerse. Nunca ejecutar
   `git add` automáticamente ni preparar archivos por ningún otro medio.
3. Inspeccionar todos los cambios preparados, incluidos archivos nuevos y
   eliminaciones. Si hay archivos `.env`, secretos, contraseñas, tokens, claves
   API o posibles credenciales, detenerse y avisar sin reproducir valores
   sensibles. No realizar el commit. Ante dudas, detenerse. No volcar blobs
   binarios ni contenido que no se pueda revisar: informar y detenerse.
4. Redactar un mensaje en español usando Conventional Commits. Tipos permitidos:
   `feat`, `fix`, `docs`, `test`, `refactor` y `chore`. El mensaje completo debe
   tener máximo 72 caracteres y corresponder a una fase o ticket concreto.
5. Mostrar al usuario el mensaje generado. Verificar que `git write-tree`
   conserva el valor revisado; si cambió el staging, detenerse y avisar.
   Ejecutar `git commit -m "<mensaje>"` usando únicamente el staging existente,
   sin `-a`, `--all`, rutas, `--amend` ni omisión de hooks. Si un hook falla,
   detenerse: no corregir archivos ni reintentar con cambios nuevos.
   Nunca ejecutar `git push`.

Ejecutar solo por invocación manual `/commit` cuando esté disponible; en Codex usar `$commit` si el cliente no admite ese slash command; esta skill no modifica archivos,
no prepara archivos adicionales y no realiza commits ante información sensible.
No usar comandos de inyección dinámica que ejecuten Git al cargar la skill.
