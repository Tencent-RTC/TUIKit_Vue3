import { fileURLToPath, URL } from "node:url";
import { resolve } from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { TDesignResolver, ElementPlusResolver } from 'unplugin-vue-components/resolvers';

const root = resolve(__dirname, "src");
const outDir = resolve(__dirname, "dist");
// https://vitejs.dev/config/
export default defineConfig({
  root,
  base: process.env.NODE_ENV === "production" ? "./" : "/",
  assetsInclude: ['**/*.glsl', '**/*.glb', '**/*.hdr'],
  optimizeDeps: {
    esbuildOptions:{
      loader: {
        '.glsl': 'text',
      }
    }
  },
  plugins: [
    vue(),
    AutoImport({
      resolvers: [
        ElementPlusResolver(),
      ],
    }),
    Components({
      resolvers: [
        TDesignResolver({
          library: 'vue-next',
          exclude: /^(TOAST_TYPE|TUI)/,
        }),
        ElementPlusResolver(),
      ],
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    outDir,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(root, "index.html"),
      },
    },
  },
  server: {
    open: true,
    port: 3001,
  },
});
