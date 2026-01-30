/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#3b82f6", // Blue-500
        "primary-hover": "#2563eb", // Blue-600
        "primary-dark": "#1e3a8a", // Navy Blue (para algunas pantallas)
        "background-light": "#f3f4f6", // Gray-100
        "background-dark": "#18181b", // Zinc-900 (más suave que 950)
        "surface-light": "#ffffff",
        "surface-dark": "#27272a", // Zinc-800 (cards/superficies)
        "card-light": "#ffffff",
        "card-dark": "#3f3f46", // Zinc-700 (cards destacan)
        "input-light": "#f9fafb",
        "input-dark": "#27272a", // Zinc-800
        "border-light": "#e5e7eb",
        "border-dark": "#52525b", // Zinc-600 (bordes visibles, neutros)
      },
      fontFamily: {
        display: ["Manrope", "sans-serif"], // Para login
        sans: ["Inter", "sans-serif"], // Principal para toda la app
        body: ["Inter", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.5rem",
        full: "9999px"
      },
    },
  },
  plugins: [],
}

