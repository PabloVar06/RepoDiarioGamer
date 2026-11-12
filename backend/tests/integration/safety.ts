import assert from "node:assert/strict";
import { basename, dirname, resolve } from "node:path";
import { tmpdir } from "node:os";

export interface OwnedTarget {
  uri: string;
  dbName: string;
  rootPath: string;
  dbPath: string;
  port: number;
  pid: number;
}

export interface LiveInstance {
  ip: string;
  dbPath: string;
  port: number;
  pid: number;
  running: boolean;
}

// Rechazar destinos ajenos ANTES de conectar, escribir o limpiar.
export function assertOwnedTarget(
  target: OwnedTarget,
  live: LiveInstance,
): void {
  const uri = new URL(target.uri);
  assert.equal(uri.protocol, "mongodb:");
  assert.equal(uri.hostname, "127.0.0.1");
  assert.equal(uri.username, "");
  assert.equal(uri.password, "");
  assert.equal(uri.search, "");
  assert.equal(uri.hash, "");
  assert.match(target.dbName, /^savepoint_e1_test_[a-f0-9]{32}$/);
  assert.equal(uri.pathname, `/${target.dbName}`);
  assert.ok(
    Number.isInteger(target.port) && target.port > 0 && target.port < 65536,
  );
  assert.equal(Number(uri.port), target.port);
  assert.equal(dirname(target.rootPath), resolve(tmpdir()));
  assert.match(basename(target.rootPath), /^savepoint-e1-[A-Za-z0-9]+$/);
  assert.equal(target.dbPath, resolve(target.rootPath, "data"));
  assert.equal(live.dbPath, target.dbPath);
  assert.equal(live.ip, "127.0.0.1");
  assert.equal(live.port, target.port);
  assert.ok(Number.isInteger(target.pid) && target.pid > 0);
  assert.equal(live.pid, target.pid);
  assert.equal(live.running, true);
}
