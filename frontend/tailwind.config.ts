import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        neo: "4px 4px 0px 0px rgba(15, 23, 42, 1)",
        "neo-sm": "2px 2px 0px 0px rgba(15, 23, 42, 1)",
        "neo-lg": "6px 6px 0px 0px rgba(15, 23, 42, 1)",
        "neo-hover": "2px 2px 0px 0px rgba(15, 23, 42, 1)",
      },
      colors: {
        brutal: {
          bg: "#f8fafc",
          surface: "#ffffff",
          dark: "#0f172a",
          accent: "#3b82f6",
          yellow: "#facc15",
          amber: "#f59e0b",
          red: "#ef4444",
          green: "#10b981",
          purple: "#a855f7",
          pink: "#ec4899",
        },
      },
    },
  },
  plugins: [],
};
export default config;
