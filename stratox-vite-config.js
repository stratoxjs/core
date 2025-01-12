import { normalizePath } from 'vite';

export default function stratoxViteConfig() {
  return {
    name: 'stratox-vite-plugin',
    config(userConfig) {
      return {
        server: {
          // port: 8080
        },
        build: {
          rollupOptions: {
            onwarn(warning, warn) {
              if (
                warning.code === 'PLUGIN_WARNING'
                && warning.plugin === 'vite:reporter'
              ) {
                return;
              }
              warn(warning);
            },
            output: {
              chunkFileNames(assetInfo) {
                const pathToFile = normalizePath(assetInfo.facadeModuleId);
                if (/\/src\/templates\/views\/.*\.js$/.test(pathToFile)) {
                  return 'assets/views/[name].js';
                }
                return 'assets/[name]-[hash].js';
              },
            },
          },
          minify: 'terser',
          terserOptions: {
            compress: {
              // Example option to remove console statements
              drop_console: true,
            },
            format: {
              // Example option to remove comments
              comments: false,
            },
            mangle: {
              // Optional Terser mangle options
            },
          },
        },
      };
    },
  };
}
