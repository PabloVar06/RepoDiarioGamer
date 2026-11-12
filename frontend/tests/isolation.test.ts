import { readFileSync, promises as fs } from "node:fs";
import { expect, test } from "vitest";

test("el runner bloquea lecturas .env antes de acceder al disco", () => {
  expect(() => readFileSync("/ruta-sintetica-inexistente/.env")).toThrow(
    "Tests aislados: acceso a .env prohibido",
  );
});

test("la protección también cubre accesos asíncronos y variantes", async () => {
  await expect(
    fs.readFile("/ruta-sintetica-inexistente/.env.local"),
  ).rejects.toThrow("Tests aislados: acceso a .env prohibido");
});
