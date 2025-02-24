const colors = require("tailwindcss/colors");

module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "Helvetica", "Arial", "sans-serif"],
      },

      colors: {
        cyan: colors.cyan,
        current: "currentColor",

        bgravel: {
          100: "#202A38",
          200: "#111720",
        },
        bgrey: {
          100: "#F8F9FA",
          200: "#F1F2F4",
          300: "#E4E7EA",
        },
        bgreen: "#0EE692",
        bpurple: "#6127E2",
        byellow: "#FFCA00",
        borange: {
          DEFAULT: "#FF4200",
          700: "#CC3600",
        },
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
