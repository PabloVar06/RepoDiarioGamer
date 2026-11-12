import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

beforeEach(() => {
  // Referencia sintética alineada con los DTO de UI; INT-03 controla su propio reloj.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-15T17:00:00Z"));
  const root = document.createElement("div");
  root.id = "root";
  document.body.appendChild(root);
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.reject(new Error("Red no simulada en un test aislado")),
    ),
  );
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  document.getElementById("root")?.remove();
  vi.unstubAllGlobals();
});
