import { fileURLToPath, URL } from "node:url";
import { resolve } from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { TDesignResolver, ElementPlusResolver } from 'unplugin-vue-components/resolvers';
import VueDevTools from 'vite-plugin-vue-devtools';

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
    VueDevTools(),
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
    modulePreload: {
      polyfill: false,
      resolveDependencies: (_filename, deps, { hostType }) => {
        if (hostType === 'html') {
          return deps.filter(dep => 
            !dep.includes('scene-call') && 
            !dep.includes('scene-chat') && 
            !dep.includes('scene-room') && 
            !dep.includes('scene-live')
          );
        }
        return deps.filter(dep => 
          !dep.endsWith('.css') || 
          dep.includes('vendor-uikit-base') ||
          dep.includes('vendor-element') ||
          dep.includes('vendor-tdesign')
        );
      },
    },
    rollupOptions: {
      input: {
        main: resolve(root, "index.html"),
      },
      output: {
        manualChunks: (id) => {
          if (id.includes('uikit-base-component-vue3')) {
            return 'vendor-uikit-base';
          }
          if (id.includes('node_modules')) {
            if (id.includes('@tencentcloud/universal-api') || id.includes('universal-api')) {
              return 'vendor-universal-api';
            }
            
            if (id.includes('tdesign-vue-next') || id.includes('tdesign-icons-vue-next')) {
              return 'vendor-tdesign';
            }

            if (id.includes('element-plus')) {
              return 'vendor-element';
            }
          
            if (id.includes('/vue/') || id.includes('/vue-router/') || id.includes('@vue/')) {
              return 'vendor-vue';
            }
            
            if (id.includes('lodash') || id.includes('axios') || id.includes('dayjs') || id.includes('mitt')) {
              return 'vendor-utils';
            }
          }
        },
      },
    },
  },
  server: {
    open: true,
    port: 3001,
  },
});
