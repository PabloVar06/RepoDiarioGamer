// Preload compartido: bloquear contenido .env antes de arrancar cualquier runner.
const fs = require("node:fs");
const { fileURLToPath } = require("node:url");

function checkFile(file) {
  const name = file instanceof URL ? fileURLToPath(file) : file;
  if (typeof name !== "string" && !Buffer.isBuffer(name)) return;
  if (
    name
      .toString()
      .split(/[\\/]/)
      .some(
        (part) =>
          part === ".env" ||
          part.startsWith(".env.") ||
          part === "._.env" ||
          part.startsWith("._.env."),
      )
  ) {
    throw new Error("Tests aislados: acceso a .env prohibido");
  }
}

for (const method of ["readFileSync", "readFile", "openSync", "open"]) {
  const original = fs[method];
  fs[method] = function (file, ...args) {
    checkFile(file);
    return original.call(this, file, ...args);
  };
}
for (const method of ["readFile", "open"]) {
  const original = fs.promises[method];
  fs.promises[method] = async function (file, ...args) {
    checkFile(file);
    return original.call(this, file, ...args);
  };
}

// Actualizar también los exports nombrados usados por módulos ESM.
require("node:module").syncBuiltinESMExports();
