const { colors } = require('@emprende/ui/theme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: colors.primary,
        accent: colors.accent,
        success: colors.success,
        warning: colors.warning,
        danger: colors.danger,
        neutral: colors.neutral,
      },
    },
  },
  plugins: [],
};
