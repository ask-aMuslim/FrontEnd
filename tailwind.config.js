/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        secondary: "var(--color-secondary)",
      },
      spacing: {
        md: "var(--spacing-md)",
      },
      borderRadius: {
        md: "var(--radius-md)",
      }
    }
  },
  plugins: []
};
