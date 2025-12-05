/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts,scss,css}",
    "./public/**/*.html",
    "./node_modules/flowbite/**/*.js"
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
  plugins: [
    require('flowbite/plugin')
  ],
  safelist: [
    // Add patterns for dynamically generated classes here if needed
  ]
};
