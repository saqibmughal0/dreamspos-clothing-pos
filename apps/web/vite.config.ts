import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";

function daterangepickerMomentPlugin(): Plugin {
  return {
    name: "vite-plugin-daterangepicker-moment-interop",
    transform(code, id) {
      if (id.includes("bootstrap-daterangepicker") && id.endsWith(".js")) {
        return code.replace(
          "}(this, function(moment, $) {",
          "}(this, function(moment, $) {\n    if (typeof moment !== 'function' && moment && moment.default) moment = moment.default;"
        );
      }
    }
  };
}

const esbuildDaterangepickerPlugin = {
  name: "esbuild-daterangepicker-moment-interop",
  setup(build: any) {
    build.onLoad({ filter: /bootstrap-daterangepicker.*\.js$/ }, async (args: any) => {
      let text = await fs.promises.readFile(args.path, "utf8");
      text = text.replace(
        "}(this, function(moment, $) {",
        "}(this, function(moment, $) {\n    if (typeof moment !== 'function' && moment && moment.default) moment = moment.default;"
      );
      return { contents: text, loader: "js" };
    });
  }
};

export default defineConfig({
  plugins: [react(), daterangepickerMomentPlugin()],
  define: {
    global: "globalThis"
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis"
      },
      plugins: [esbuildDaterangepickerPlugin]
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "~bootstrap": path.resolve(__dirname, "node_modules/bootstrap")
    }
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  },
  build: {
    outDir: "dist",
    chunkSizeWarningLimit: 3000
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: "modern-compiler",
        silenceDeprecations: [
          "legacy-js-api",
          "import",
          "global-builtin",
          "color-functions"
        ]
      }
    }
  }
});
