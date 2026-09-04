import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import commonjs from 'vite-plugin-commonjs';
import { federation } from '@module-federation/vite';

export default defineConfig({
    plugins: [
        federation({
            manifest: true,
            // Must stay 'FrigateServiceUI' - it is the first path segment of every
            // "name" in admin/jsonConfig.json (e.g. "FrigateServiceUI/Components/...").
            name: 'FrigateServiceUI',
            filename: 'customComponents.js',
            exposes: {
                './Components': './src/Components.tsx',
            },
            remotes: {},
            // We deliberately don't depend on @iobroker/gui-components here (it pulls in
            // @mui/material + @mui/icons-material - 10k+ icon modules - as peer deps, and
            // sharing it forces a full fallback build of that whole graph even though our
            // UI uses none of it). Only react/react-dom need to stay singletons against
            // whatever the Admin host provides.
            shared: {
                react: { requiredVersion: '*', singleton: true },
                'react-dom': { requiredVersion: '*', singleton: true },
            },
        }),
        react(),
        commonjs(),
    ],
    base: './',
    build: {
        target: 'chrome89',
        outDir: './build',
    },
});
