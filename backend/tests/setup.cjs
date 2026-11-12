// Se precarga antes de tsx y de la aplicación: ningún test puede cargar dotenv.
const Module = require("node:module");
require("../../scripts/test-file-guard.cjs");

const originalLoad = Module._load;
Module._load = function (request, ...args) {
  if (request === "dotenv" || request.startsWith("dotenv/")) {
    throw new Error("Tests aislados: no se permite cargar dotenv");
  }
  return originalLoad.call(this, request, ...args);
};
