import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, mkdir, realpath, rm, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server-core";
import { assertOwnedTarget, type OwnedTarget } from "./safety";

const mongoVersion = "7.0.24";

export async function startTemporaryMongo() {
  const rootPath = await mkdtemp(resolve(tmpdir(), "savepoint-e1-"));
  const dbPath = resolve(rootPath, "data");
  await mkdir(dbPath);
  const dbName = `savepoint_e1_test_${randomUUID().replace(/-/g, "")}`;
  const mongod = new MongoMemoryServer({
    instance: { ip: "127.0.0.1", dbName, dbPath, storageEngine: "wiredTiger" },
    binary: {
      version: mongoVersion,
      downloadDir: resolve(
        __dirname,
        "../../node_modules/.cache/savepoint-mongodb",
      ),
      checkMD5: true,
    },
  });
  let target: OwnedTarget | undefined;
  let pid: number | undefined;

  function assertInstance() {
    assert.ok(target, "Falta el destino generado por este runner");
    const info = mongod.instanceInfo;
    assert.ok(info, "Falta la instancia propia");
    const child = info.instance.mongodProcess;
    assert.ok(child?.pid, "Falta el proceso hijo de MongoDB");
    assertOwnedTarget(target, {
      ip: info.ip,
      dbPath: info.dbPath,
      port: info.port,
      pid: child.pid,
      running:
        child.exitCode === null && child.signalCode === null && !child.killed,
    });
    process.kill(child.pid, 0);
  }

  async function assertConnection() {
    assertInstance();
    assert.ok(target);
    assert.equal(mongoose.connection.readyState, 1);
    assert.equal(mongoose.connection.host, "127.0.0.1");
    assert.equal(mongoose.connection.port, target.port);
    assert.equal(mongoose.connection.name, dbName);
    const db = mongoose.connection.db;
    assert.ok(db);
    // Comprobaciones de solo lectura; prueban que el servidor conectado ES el hijo propio.
    const [status, options] = await Promise.all([
      db.admin().command({ serverStatus: 1 }),
      db.admin().command({ getCmdLineOpts: 1 }),
    ]);
    assert.equal(Number(status.pid), target.pid);
    assert.equal(options.parsed.net.bindIp, "127.0.0.1");
    assert.equal(options.parsed.net.port, target.port);
    assert.equal(
      await realpath(options.parsed.storage.dbPath),
      await realpath(dbPath),
    );
  }

  async function close() {
    try {
      await mongoose.disconnect();
    } finally {
      // Solo parar la instancia creada arriba. No se usa dropDatabase ni una URI externa.
      await mongod.stop({ doCleanup: false, force: false });
      if (pid) {
        assert.throws(
          () => process.kill(pid!, 0),
          (error: unknown) =>
            error instanceof Error && "code" in error && error.code === "ESRCH",
          "El proceso de MongoDB debe estar detenido antes de borrar sus datos",
        );
      }
      await rm(rootPath, { recursive: true, force: true });
      await assert.rejects(stat(rootPath), { code: "ENOENT" });
      console.info(
        "E1 aislamiento: MongoDB detenido; directorio temporal y datos eliminados.",
      );
    }
  }

  try {
    assert.equal(
      mongoose.connection.readyState,
      0,
      "El runner no debe reutilizar conexiones existentes",
    );
    // Evitar escrituras automáticas de modelos antes de confirmar PID y dbPath.
    mongoose.set("autoCreate", false);
    mongoose.set("autoIndex", false);
    await mongod.start();
    const info = mongod.instanceInfo;
    assert.ok(info?.instance.mongodProcess?.pid);
    pid = info.instance.mongodProcess.pid;
    target = Object.freeze({
      uri: mongod.getUri(dbName),
      dbName,
      rootPath,
      dbPath,
      port: info.port,
      pid,
    });
    assertInstance();
    await mongoose.connect(target.uri, {
      dbName,
      directConnection: true,
      autoCreate: false,
      autoIndex: false,
      serverSelectionTimeoutMS: 5_000,
      connectTimeoutMS: 5_000,
    });
    await assertConnection();
    const actualVersion = await mongoose.connection
      .db!.admin()
      .command({ buildInfo: 1 });
    assert.equal(actualVersion.version, mongoVersion);
    console.info(
      `E1 aislamiento confirmado: ${JSON.stringify({
        version: actualVersion.version,
        host: "127.0.0.1",
        port: target.port,
        dbName,
        pid,
        dbPath,
        autoCreate: false,
        autoIndex: false,
      })}`,
    );
    return { assertConnection, close };
  } catch (error) {
    await close();
    throw error;
  }
}
