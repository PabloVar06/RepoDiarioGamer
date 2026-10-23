/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        gamer: {
          surface: "#2F2D2E",
          panel: "#3A3839",
          blue: "#3A86FF",
          green: "#06D6A0",
          yellow: "#FFBE0B",
          orange: "#FB5607",
        },
      },
      boxShadow: {
        float: "0 24px 60px rgba(0,0,0,.35)",
        blueglow: "0 0 40px rgba(58,134,255,.28)",
        orangeglow: "0 12px 32px rgba(251,86,7,.35)",
      },
      fontFamily: {
        sans: ["Instrument Sans", "system-ui", "sans-serif"],
        display: ["Archivo", "system-ui", "sans-serif"],
      },
      borderRadius: {
        launcher: "28px",
      },
    },
  },
  plugins: [],
};
