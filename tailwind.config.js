/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0f",
        card: "#12121a",
        accent: "#7c7cff"
      }
    }
  },
  plugins: []
};
