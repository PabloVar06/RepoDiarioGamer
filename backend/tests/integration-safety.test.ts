import assert from "node:assert/strict";
import { test } from "node:test";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import {
  assertOwnedTarget,
  type LiveInstance,
  type OwnedTarget,
} from "./integration/safety";

const rootPath = resolve(tmpdir(), "savepoint-e1-synthetic");
const dbName = `savepoint_e1_test_${"a".repeat(32)}`;
const target: OwnedTarget = {
  uri: `mongodb://127.0.0.1:27019/${dbName}`,
  dbName,
  rootPath,
  dbPath: resolve(rootPath, "data"),
  port: 27019,
  pid: 12345,
};
const live: LiveInstance = {
  ip: "127.0.0.1",
  dbPath: target.dbPath,
  port: target.port,
  pid: target.pid,
  running: true,
};

test("Aislamiento: acepta únicamente la instancia temporal esperada", () => {
  assert.doesNotThrow(() => assertOwnedTarget(target, live));
});

const unsafeTargets: Array<[string, Partial<OwnedTarget>]> = [
  ["URI SRV", { uri: `mongodb+srv://remote.example.test/${dbName}` }],
  ["host externo", { uri: `mongodb://remote.example.test:27019/${dbName}` }],
  [
    "credenciales",
    { uri: `mongodb://synthetic:synthetic@127.0.0.1:27019/${dbName}` },
  ],
  ["otra base", { uri: "mongodb://127.0.0.1:27019/produccion" }],
  [
    "nombre no reservado",
    { dbName: "produccion", uri: "mongodb://127.0.0.1:27019/produccion" },
  ],
  ["otro puerto", { uri: `mongodb://127.0.0.1:27020/${dbName}` }],
  ["opciones de URI", { uri: `${target.uri}?replicaSet=ajeno` }],
  ["directorio ajeno", { rootPath: resolve(tmpdir(), "ajeno") }],
  ["datos fuera del temporal", { dbPath: resolve(tmpdir(), "data") }],
];
for (const [name, override] of unsafeTargets) {
  test(`Aislamiento: rechaza ${name} antes de conectar`, () => {
    assert.throws(() => assertOwnedTarget({ ...target, ...override }, live));
  });
}

const unsafeInstances: Array<[string, Partial<LiveInstance>]> = [
  ["bind externo", { ip: "0.0.0.0" }],
  ["proceso distinto", { pid: 12346 }],
  ["proceso detenido", { running: false }],
  ["puerto distinto", { port: 27020 }],
  ["dbPath distinto", { dbPath: resolve(tmpdir(), "ajeno") }],
];
for (const [name, override] of unsafeInstances) {
  test(`Aislamiento: rechaza ${name} antes de conectar`, () => {
    assert.throws(() => assertOwnedTarget(target, { ...live, ...override }));
  });
}
