import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import postcss from "postcss";
import tailwindcss from "tailwindcss";
import { expect, test } from "vitest";

const require = createRequire(import.meta.url);
const config = require("../tailwind.config.cjs");
const css = readFileSync(resolve("src/index.css"), "utf8");
const design = readFileSync(resolve("../DESIGN.md"), "utf8");
const root = postcss.parse(css);
const variables = new Map<string, string>();
root.walkRules(":root", (rule) => {
  rule.walkDecls((decl) => {
    variables.set(decl.prop, decl.value);
  });
});

function luminancia(hex: string) {
  const valores = hex
    .replace("#", "")
    .match(/.{2}/g)!
    .map((v) => parseInt(v, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return valores.reduce(
    (suma, v, i) => suma + v * [0.2126, 0.7152, 0.0722][i],
    0,
  );
}

function contraste(texto: string, fondo: string) {
  const valores = [
    luminancia(variables.get(texto)!),
    luminancia(variables.get(fondo)!),
  ].sort((a, b) => b - a);
  return (valores[0] + 0.05) / (valores[1] + 0.05);
}

test("VIS-01: los diez colores coinciden con la fuente canónica DESIGN.md", () => {
  const tokens = [
    ...design.matchAll(
      /`(--(?:color-[\w-]+|borde))`\s*\|\s*`(#[\da-fA-F]{6})`/g,
    ),
  ];
  expect(tokens).toHaveLength(10);
  for (const [, nombre, valor] of tokens)
    expect(variables.get(nombre)?.toUpperCase(), nombre).toBe(
      valor.toUpperCase(),
    );
});

test("VIS-01: reglas globales usan tokens y conservan foco y movimiento reducido", () => {
  const declarations = (selector: string) => {
    const valores: Record<string, string> = {};
    root.walkRules(selector, (rule) => {
      rule.walkDecls((d) => {
        valores[d.prop] = d.value;
      });
    });
    return valores;
  };
  expect(declarations("body")).toMatchObject({
    background: "var(--color-fondo)",
    color: "var(--color-texto)",
    "font-family": "var(--fuente-cuerpo)",
  });
  expect(declarations(":root body :focus-visible")).toMatchObject({
    outline: "3px solid var(--color-acento)",
    "outline-offset": "3px",
  });
  expect(declarations("option")).toMatchObject({
    background: "var(--color-panel)",
    color: "var(--color-texto)",
  });
  expect(css).toContain("prefers-reduced-motion: reduce");
  expect(css).toContain("scroll-behavior: auto !important");
  expect(variables.get("--fuente-titulo")).toContain('"Orbitron"');
  expect(variables.get("--fuente-cuerpo")).toContain('"Poppins"');
  expect(css).not.toMatch(/@import|https?:\/\//);
});

test("VIS-01: Tailwind genera colores, opacidad, jerarquía, espaciado y radios desde variables", async () => {
  const resultado = await postcss([
    tailwindcss({
      ...config,
      content: [
        {
          raw: "bg-fondo bg-panel/50 text-texto text-texto-sec bg-primario text-fondo font-sans font-display text-pantalla text-seccion text-destacado text-cuerpo text-ayuda p-6 gap-4 rounded-panel rounded-aviso rounded-pill rounded-launcher",
          extension: "html",
        },
      ],
    }),
  ]).process(css, { from: undefined });
  const valores = (selector: string) => {
    const mapa: Record<string, string> = {};
    resultado.root.walkRules(selector, (rule) => {
      rule.walkDecls((d) => {
        mapa[d.prop] = d.value;
      });
    });
    return mapa;
  };
  expect(valores(".bg-fondo")["background-color"]).toContain(
    "var(--color-fondo)",
  );
  expect(valores(".bg-panel\\/50")["background-color"]).toContain(
    "var(--color-panel)",
  );
  expect(valores(".bg-panel\\/50")["background-color"]).toContain("0.5");
  expect(valores(".font-display")["font-family"]).toBe("var(--fuente-titulo)");
  expect(valores(".font-sans")["font-family"]).toBe("var(--fuente-cuerpo)");
  expect(valores(".text-pantalla")["font-size"]).toBe("var(--texto-pantalla)");
  expect(valores(".text-seccion")["font-weight"]).toBe("400");
  expect(valores(".text-destacado")["font-weight"]).toBe("600");
  expect(valores(".text-cuerpo")["font-size"]).toBe("var(--texto-cuerpo)");
  expect(valores(".text-ayuda")["font-size"]).toBe("var(--texto-ayuda)");
  expect(valores(".p-6").padding).toBe("var(--espacio-6)");
  expect(valores(".gap-4").gap).toBe("var(--espacio-4)");
  expect(valores(".rounded-panel")["border-radius"]).toBe("var(--radio-panel)");
  expect(valores(".rounded-aviso")["border-radius"]).toBe("var(--radio-aviso)");
  expect(valores(".rounded-pill")["border-radius"]).toBe(
    "var(--radio-pildora)",
  );
});

test("VIS-01: pares de texto previstos superan 4,5:1 y el botón coral exige texto oscuro", () => {
  for (const [texto, fondo] of [
    ["--color-texto", "--color-fondo"],
    ["--color-texto", "--color-panel"],
    ["--color-texto-sec", "--color-panel"],
    ["--color-acento", "--color-panel"],
    ["--color-fondo", "--color-primario"],
    ["--color-fondo", "--color-acento"],
    ["--color-exito", "--color-panel"],
    ["--color-error", "--color-panel"],
  ]) {
    expect(contraste(texto, fondo), `${texto}/${fondo}`).toBeGreaterThanOrEqual(
      4.5,
    );
  }
  expect(contraste("--color-texto", "--color-primario")).toBeLessThan(4.5);
});

test("VIS-01: compatibilidad E1 no remapea botones coral con texto blanco", async () => {
  const resultado = await postcss([
    tailwindcss({
      ...config,
      content: [
        {
          raw: "bg-gamer-orange text-gamer-blue shadow-float",
          extension: "html",
        },
      ],
    }),
  ]).process(css, { from: undefined });
  expect(resultado.css).toContain("var(--legacy-gamer-orange)");
  expect(variables.get("--legacy-gamer-orange")?.toUpperCase()).toBe("#FB5607");
  expect(JSON.stringify(config)).not.toMatch(/#[\da-fA-F]{3,8}|rgba?\(/);
});
