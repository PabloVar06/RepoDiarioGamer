import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { once } from "node:events";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import mongoose from "mongoose";
import { crearApp } from "../src/app";

let server: Server;
let base: string;
const frontendUrl = "http://frontend.example.test";

before(async () => {
  server = crearApp({ frontendUrl }).listen(0, "127.0.0.1");
  await once(server, "listening");
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(async () => {
  if (server?.listening) {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("E1: salud funciona sin conexión a MongoDB ni dotenv", async () => {
  const response = await fetch(`${base}/api/salud`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.estado, "ok");
  assert.match(body.requestId, /^[0-9a-f-]{36}$/);
  assert.equal(response.headers.get("x-request-id"), body.requestId);
  assert.equal(mongoose.connection.readyState, 0);
});

test("E1: una ruta inexistente mantiene 404 y requestId", async () => {
  const response = await fetch(`${base}/api/no-existe`);
  const body = await response.json();
  assert.equal(response.status, 404);
  assert.match(body.error, /Ruta no encontrada/);
  assert.equal(response.headers.get("x-request-id"), body.requestId);
});

test("CORS utiliza la configuración sintética inyectada", async () => {
  const response = await fetch(`${base}/api/salud`, {
    headers: { Origin: frontendUrl },
  });
  assert.equal(
    response.headers.get("access-control-allow-origin"),
    frontendUrl,
  );
});
