"""Hooks de SAVEPOINT: no cargan variables ni leen archivos .env."""

import argparse
import os
from pathlib import Path
import subprocess
import sys


def git(*args):
    return subprocess.check_output(["git", *args])


def protected(path):
    return any(
        part == ".env" or part.startswith(".env.")
        or part == "._.env" or part.startswith("._.env.")
        for part in Path(path).parts
    )


def staged_paths():
    # Sin detección de renombres: se examinan tanto el origen como el destino.
    return [os.fsdecode(p) for p in git(
        "diff", "--cached", "--name-only", "--no-renames", "-z"
    ).split(b"\0") if p]


def guard_env():
    blocked = [p for p in staged_paths() if protected(p)]
    if blocked:
        print("Bloqueado: el índice contiene cambios de .env o variantes.", file=sys.stderr)
        # Solo nombres; nunca se consulta el contenido de estos blobs.
        for path in blocked:
            print(repr(path), file=sys.stderr)
        return 1
    return 0


def prettier(root, path, data):
    cli = root / "node_modules/prettier/bin/prettier.cjs"
    if not cli.is_file():
        raise RuntimeError("Falta Prettier: ejecutar npm ci --ignore-scripts en la raíz.")
    return subprocess.check_output([
        "node", str(cli), "--config", str(root / ".prettierrc.json"),
        "--stdin-filepath", path,
    ], input=data, cwd=root)


def format_staged():
    if guard_env():
        return 1
    root = Path(os.fsdecode(git("rev-parse", "--show-toplevel")).strip())
    extensions = {".md", ".mdc", ".json", ".ts", ".tsx", ".js", ".cjs",
                  ".mjs", ".css", ".html", ".yaml", ".yml"}
    failed = False
    for path in staged_paths():
        if Path(path).suffix not in extensions or "package-lock.json" == Path(path).name:
            continue
        # Consultar modo y blob del índice; nunca el archivo del working tree.
        entries = git("ls-files", "--stage", "-z", "--", path).split(b"\0")
        for entry in filter(None, entries):
            metadata = entry.split(b"\t", 1)[0].split()
            mode, oid, stage = metadata
            if stage != b"0":
                raise RuntimeError("Resolver conflictos del índice antes del commit.")
            if mode not in (b"100644", b"100755"):
                continue
            data = git("cat-file", "blob", oid.decode("ascii"))
            if prettier(root, path, data) != data:
                failed = True
                print("Formato pendiente: " + repr(path), file=sys.stderr)
    if failed:
        print("Formatear solo los archivos indicados y volver a prepararlos con git add.",
              file=sys.stderr)
    return int(failed)


def install():
    root = Path(os.fsdecode(git("rev-parse", "--show-toplevel")).strip())
    existing = subprocess.run(["git", "config", "--get", "core.hooksPath"],
                              capture_output=True, text=True)
    if existing.returncode not in (0, 1):
        raise RuntimeError("No se pudo consultar core.hooksPath.")
    if existing.stdout.strip() not in ("", ".githooks"):
        raise RuntimeError("Ya existe otro core.hooksPath; integrar sin sobrescribirlo.")
    hook = root / ".githooks/pre-commit"
    hook.chmod(hook.stat().st_mode | 0o111)
    subprocess.run(["git", "config", "--local", "core.hooksPath", ".githooks"], check=True)
    print("Hooks locales activados: .githooks")
    return 0


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["guard-env", "format-staged", "install"])
    command = parser.parse_args().command
    try:
        return {"guard-env": guard_env, "format-staged": format_staged,
                "install": install}[command]()
    except (OSError, RuntimeError, subprocess.CalledProcessError) as error:
        print("Harness: " + str(error), file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
