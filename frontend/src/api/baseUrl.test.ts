import { expect, test } from "vitest";
import { resolverBaseApi } from "./baseUrl";

test.each([
  [
    "HTTP local",
    "http://localhost:3000/api",
    true,
    "http://localhost:3000/api",
  ],
  [
    "HTTPS configurado",
    "https://api.example.test/api",
    false,
    "https://api.example.test/api",
  ],
  [
    "barra final",
    "https://api.example.test/api/",
    false,
    "https://api.example.test/api",
  ],
  [
    "barras finales",
    "https://api.example.test/api///",
    false,
    "https://api.example.test/api",
  ],
  ["proxy explícito", "/api", true, "/api"],
  ["proxy con barra final", "/api/", true, "/api"],
  ["ausente en desarrollo", undefined, true, "/api"],
  ["vacío en desarrollo", "", true, "/api"],
  ["espacios en desarrollo", "   ", true, "/api"],
] as const)("HAB-05: resuelve %s", (_name, value, development, expected) => {
  expect(resolverBaseApi(value, development)).toBe(expected);
});

test.each([
  ["ausente en producción", undefined, false],
  ["vacío en producción", "", false],
  ["espacios en producción", "   ", false],
  ["sin prefijo en producción", "https://api.example.test", false],
  ["sin prefijo en desarrollo", "http://localhost:3000", true],
  ["prefijo duplicado", "https://api.example.test/api/api", false],
  ["URL mal formada", "esto no es una URL", false],
  ["solo una barra", "/", true],
  ["solo barras", "///", true],
  ["barras internas duplicadas", "https://api.example.test//api", false],
  ["protocolo ajeno a HTTP", "ftp://api.example.test/api", false],
  ["proxy relativo en producción", "/api", false],
  ["ruta relativa ambigua", "api", true],
  ["host sin protocolo", "//api.example.test/api", true],
  ["consulta en la base", "https://api.example.test/api?filtro=otro", false],
  ["fragmento en la base", "https://api.example.test/api#otra-ruta", false],
  [
    "recurso en lugar de base",
    "https://api.example.test/api/videojuegos",
    false,
  ],
] as const)("HAB-05: rechaza %s", (_name, value, development) => {
  expect(() => resolverBaseApi(value, development)).toThrow(/VITE_API_URL/);
});
