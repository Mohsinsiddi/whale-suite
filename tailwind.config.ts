import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Backgrounds
        bg: {
          primary: "#0a0e14",
          secondary: "#111820",
          tertiary: "#1a1f2e",
          elevated: "#222936",
        },
        // Neon Accents
        neon: {
          green: "#00ff88",
          cyan: "#00d4ff",
          teal: "#00ffcc",
          lime: "#88ff00",
        },
        // Status
        success: "#00ff88",
        error: "#ff4444",
        warning: "#ffaa00",
        info: "#00d4ff",
        // Text
        text: {
          primary: "#e8f4f8",
          secondary: "#a0b8c0",
          muted: "#6a7f8a",
          disabled: "#4a5560",
        },
        // Borders
        border: {
          primary: "rgba(0, 255, 136, 0.2)",
          secondary: "rgba(255, 255, 255, 0.1)",
          focus: "#00ff88",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        "glow-sm": "0 0 10px rgba(0, 255, 136, 0.3)",
        "glow-md": "0 0 20px rgba(0, 255, 136, 0.5)",
        "glow-lg": "0 0 40px rgba(0, 255, 136, 0.7)",
        "glow-cyan": "0 0 20px rgba(0, 212, 255, 0.5)",
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #00ff88 0%, #00d4ff 100%)",
        "gradient-secondary": "linear-gradient(135deg, #111820 0%, #1a1f2e 100%)",
        "gradient-glow": "radial-gradient(circle at center, rgba(0, 255, 136, 0.2) 0%, transparent 70%)",
        "gradient-radial": "radial-gradient(circle at 50% 0%, rgba(0, 255, 136, 0.1) 0%, transparent 50%)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "float": "float 3s ease-in-out infinite",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 10px rgba(0, 255, 136, 0.3)" },
          "100%": { boxShadow: "0 0 30px rgba(0, 255, 136, 0.6)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      borderRadius: {
        "xl": "16px",
        "2xl": "24px",
      },
    },
  },
  plugins: [],
};

export default config;
