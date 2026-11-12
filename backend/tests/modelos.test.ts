import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { Videojuego } from "../src/modelos/Videojuego.model";

test("E1: un juego válido conserva estado y logros predeterminados", () => {
  const juego = new Videojuego({
    nombre: "  Juego de prueba  ",
    plataforma: "PC",
    genero: "Terror",
    logros: [{ nombre: "Primer paso" }],
  });
  assert.equal(juego.validateSync(), undefined);
  assert.equal(juego.nombre, "Juego de prueba");
  assert.equal(juego.estado, "Jugando");
  assert.equal(juego.logros[0].obtenido, false);
});

test("E1: los enums distinguen mayúsculas y rechazan datos inválidos", () => {
  const juego = new Videojuego({
    nombre: "Juego de prueba",
    plataforma: "PC",
    genero: "terror",
  });
  assert.ok(juego.validateSync()?.errors.genero);
});

test("el runner impide leer una ruta .env antes de acceder al disco", () => {
  assert.throws(
    () => readFileSync("/ruta-sintetica-inexistente/.env"),
    /Tests aislados: acceso a .env prohibido/,
  );
});
