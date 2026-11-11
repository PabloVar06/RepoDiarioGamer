"""Adaptadores de hooks Claude; no importan ni cargan dotenv."""

import json
import os
from pathlib import Path
import sys

from harness import prettier, protected


def paths(tool_input):
    result = []
    for key in ("file_path", "notebook_path"):
        value = tool_input.get(key)
        if isinstance(value, str):
            result.append(value)
    for edit in tool_input.get("edits", []):
        if isinstance(edit, dict):
            result.extend(paths(edit))
    return result


def safe_path(raw, cwd, root):
    # Validar nombre antes de resolver symlinks; solo se consulta metadata.
    path = Path(raw.replace("\\", "/"))
    if protected(path):
        raise ValueError("Acceso a .env o variantes prohibido.")
    path = path if path.is_absolute() else cwd / path
    resolved = path.resolve()
    if protected(resolved):
        raise ValueError("Destino .env o variante prohibido.")
    if not resolved.is_relative_to(root):
        raise ValueError("Ruta fuera del proyecto; requiere revisión de alcance.")
    return resolved


def run(mode, payload):
    root = Path(os.environ.get("CLAUDE_PROJECT_DIR", Path(__file__).resolve().parents[1])).resolve()
    cwd = Path(payload.get("cwd", str(root))).resolve()
    tool = payload.get("tool_name")
    inputs = payload.get("tool_input", {})
    if not isinstance(inputs, dict):
        raise ValueError("tool_input inválido.")
    expected = "PreToolUse" if mode == "guard" else "PostToolUse"
    if payload.get("hook_event_name") != expected:
        raise ValueError("Evento de hook inesperado.")
    if mode == "guard" and tool == "Bash":
        # Control conservador del texto explícito; no es un intérprete de shell.
        if ".env" in inputs.get("command", ""):
            raise ValueError("Comando con referencia explícita a .env bloqueado.")
        return
    selected = [safe_path(raw, cwd, root) for raw in paths(inputs)]
    if not selected and tool in {"Read", "Write", "Edit", "MultiEdit", "NotebookEdit"}:
        raise ValueError("Falta la ruta del archivo; no se permite actuar a ciegas.")
    if mode == "guard":
        return
    if tool not in {"Write", "Edit", "MultiEdit"}:
        return
    extensions = {".md", ".mdc", ".json", ".ts", ".tsx", ".js", ".cjs",
                  ".mjs", ".css", ".html", ".yaml", ".yml"}
    for path in dict.fromkeys(selected):
        # No modificar la importación exacta exigida por el enunciado.
        if path == root / "CLAUDE.md":
            continue
        if path.suffix not in extensions or path.name == "package-lock.json":
            continue
        if not path.is_file():
            continue
        original = path.read_bytes()
        formatted = prettier(root, str(path), original)
        if formatted != original:
            path.write_bytes(formatted)


def main():
    try:
        if len(sys.argv) != 2 or sys.argv[1] not in {"guard", "format"}:
            raise ValueError("Modo inválido.")
        run(sys.argv[1], json.load(sys.stdin))
        return 0
    except Exception:
        # No imprimir payload ni excepciones que puedan contener datos sensibles.
        print("Hook SAVEPOINT: operación rechazada o formato fallido; revisar reglas y herramientas.",
              file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
