import { defineConfig } from "vite";

// base: "./" keeps asset paths relative, so the build works on GitHub Pages
// regardless of the repository name (user/inopoisk-flus or a custom domain).
export default defineConfig({
  base: "./",
  build: {
    target: "es2020",
  },
});
