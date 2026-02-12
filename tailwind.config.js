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
        primary: "var(--color-button-primary-normal)",
        secondary: "var(--color-button-secondary-hovering)",
        surface: {
          primary: "var(--color-card-surface-primary)",
          secondary: "var(--color-card-surface-secondary)",
          'secondary-hover': "var(--color-card-surface-secondary)",
          'secondary-2': "var(--color-card-surface-secondary-2)",
          selected: "var(--color-selected-surface)",
        },
        special: {
          primary: "var(--color-button-primary-normal)",
          'primary-hover': "var(--color-button-primary-hovering)",
          'primary-click': "var(--color-button-primary-clicked)",
          secondary: "var(--color-button-secondary-hovering)",
        },
        text: {
          body: "var(--color-text-body)",
          caption: "var(--color-text-caption)",
          base: "var(--color-text-info)",
          placeholder: "var(--color-text-placeholder)",
          title: "var(--color-text-title)",
          info: "var(--color-text-info)",
        },
        border: {
          default: "var(--color-border-default)",
          light: "var(--color-border-light)",
          hover: "var(--color-border-hover)",
          medium: "var(--color-border-normal-medium)",
          brand: "var(--color-border-brand-medium-2)",
        },
        state: {
          error: "var(--color-semantic-critical-base)",
          'error-bg': "var(--color-semantic-critical-light)",
          success: "var(--color-semantic-success-base)",
          warning: "var(--color-semantic-warning-base)",
        }
      },
      spacing: {
        md: "var(--spacing-md)",
      },
      borderRadius: {
        md: "var(--radius-md)",
        DEFAULT: "var(--border-radius-default)",
      },
      boxShadow: {
        base: "var(--shadow-base)",
        '15': "var(--shadow-15)",
        '4-green': "var(--shadow-4-green)",
        big: "var(--shadow-big)",
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
