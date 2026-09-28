/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        lime: "#A8FF00",
        green: "#5C7F00",
        ink: "#050505",
        charcoal: "#222222",
        whiteBrand: "#F5F5F5",
      },
      fontFamily: {
        cairo: ["Cairo", "sans-serif"],
      },
      boxShadow: {
        lime: "0 0 34px rgba(168,255,0,.16)",
      },
    },
  },
  plugins: [],
};
