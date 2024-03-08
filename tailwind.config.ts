import { type Config } from "tailwindcss";

export default {
  content: [
    "{routes,islands,components}/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "browser-blue": "blue",
        "browser-purple": "purple",
      },
    },
  },
} satisfies Config;
