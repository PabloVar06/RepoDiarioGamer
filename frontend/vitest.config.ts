import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Vite solo busca variables de archivo en este directorio vacío y descartable.
// No importar vite.config.ts: los tests no deben cargar configuración local.
const envDir = mkdtempSync(join(tmpdir(), "savepoint-vitest-"));
process.once("exit", () => rmSync(envDir, { recursive: true, force: true }));

export default defineConfig({
  plugins: [react()],
  envDir,
  define: {
    "import.meta.env.VITE_API_URL": JSON.stringify(
      "http://api.example.test/api",
    ),
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}", "src/**/*.test.{ts,tsx}"],
    exclude: [...configDefaults.exclude, "**/._*"],
    clearMocks: true,
    restoreMocks: true,
    maxWorkers: 1,
    fileParallelism: false,
    pool: "forks",
    poolOptions: {
      forks: {
        execArgv: [
          "--require",
          fileURLToPath(
            new URL("../scripts/test-file-guard.cjs", import.meta.url),
          ),
        ],
      },
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/main.tsx", "src/vite-env.d.ts", "**/._*"],
    },
  },
});
