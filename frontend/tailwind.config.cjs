/** @type {import('tailwindcss').Config} */
const color =
  (nombre) =>
  ({ opacityValue }) =>
    opacityValue === undefined
      ? `var(--${nombre})`
      : `color-mix(in srgb, var(--${nombre}) calc(${opacityValue} * 100%), transparent)`;

module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        fondo: color("color-fondo"),
        panel: color("color-panel"),
        primario: color("color-primario"),
        acento: color("color-acento"),
        destacado: color("color-destacado"),
        texto: color("color-texto"),
        "texto-sec": color("color-texto-sec"),
        exito: color("color-exito"),
        error: color("color-error"),
        borde: color("borde"),
        gamer: {
          surface: color("legacy-gamer-surface"),
          panel: color("legacy-gamer-panel"),
          blue: color("legacy-gamer-blue"),
          green: color("legacy-gamer-green"),
          yellow: color("legacy-gamer-yellow"),
          orange: color("legacy-gamer-orange"),
        },
      },
      boxShadow: {
        float: "var(--legacy-shadow-float)",
        blueglow: "var(--legacy-shadow-blueglow)",
        orangeglow: "var(--legacy-shadow-orangeglow)",
      },
      fontFamily: {
        sans: ["var(--fuente-cuerpo)"],
        display: ["var(--fuente-titulo)"],
      },
      fontSize: {
        pantalla: [
          "var(--texto-pantalla)",
          {
            lineHeight: "1.2",
            fontWeight: "700",
            letterSpacing: "var(--tracking-titulo)",
          },
        ],
        seccion: [
          "var(--texto-seccion)",
          { lineHeight: "1.3", fontWeight: "400" },
        ],
        destacado: [
          "var(--texto-destacado)",
          { lineHeight: "1.5", fontWeight: "600" },
        ],
        cuerpo: [
          "var(--texto-cuerpo)",
          { lineHeight: "1.5", fontWeight: "400" },
        ],
        ayuda: ["var(--texto-ayuda)", { lineHeight: "1.5", fontWeight: "400" }],
      },
      spacing: {
        1: "var(--espacio-1)",
        2: "var(--espacio-2)",
        4: "var(--espacio-4)",
        6: "var(--espacio-6)",
        8: "var(--espacio-8)",
        12: "var(--espacio-12)",
      },
      borderRadius: {
        launcher: "var(--radio-contenedor)",
        panel: "var(--radio-panel)",
        aviso: "var(--radio-aviso)",
        pill: "var(--radio-pildora)",
      },
    },
  },
  plugins: [],
};
