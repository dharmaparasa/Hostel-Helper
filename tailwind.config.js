/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#128c7e",
          deep: "#0f6f65",
          soft: "#dff5ef"
        },
        ink: "#15302b",
        surface: "#f3f7f6",
        card: "#ffffff",
        muted: "#6e7c78",
        line: "#d5dfdc",
        warn: "#f59e0b",
        danger: "#ef4444"
      },
      boxShadow: {
        soft: "0 14px 40px rgba(16, 36, 33, 0.08)",
        card: "0 10px 30px rgba(18, 46, 42, 0.08)"
      },
      fontFamily: {
        sans: ['"Segoe UI"', '"Noto Sans"', "sans-serif"]
      },
      borderRadius: {
        panel: "22px"
      }
    }
  },
  plugins: []
};
