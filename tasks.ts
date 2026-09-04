// Builds the admin custom UI (src-admin, Vite + Module Federation) and copies the
// output into admin/custom/. Scoped to admin/custom/ only - unlike some ioBroker
// component templates, admin/ here also holds hand-maintained jsonConfig.json,
// words.js, frigate-service.svg and i18n/*.json that must not be touched.
import { deleteFoldersRecursive, npmInstall, buildReact, copyFiles } from '@iobroker/build-tools';

const rootDir = __dirname;
const srcAdmin = `${rootDir}/src-admin/`;
const customDir = `${rootDir}/admin/custom`;

function clean(): void {
    deleteFoldersRecursive(customDir);
    deleteFoldersRecursive(`${srcAdmin}build`);
}

function copyAllFiles(): void {
    // The remote entry (customComponents.js) is a small ES module that dynamically
    // imports its real chunks from ./assets/ next to it - copy the whole folder.
    copyFiles([`${srcAdmin}build/assets/*`], `${customDir}/assets`);
    copyFiles([`${srcAdmin}build/customComponents.js`], customDir);
    // admin/json-config reads this manifest to decide which GUI API generation the
    // component targets - without it (or without "guiApi" in jsonConfig.json) it
    // is assumed to be generation 1 and refused.
    copyFiles([`${srcAdmin}build/mf-manifest.json`], customDir);
    copyFiles([`${srcAdmin}src/i18n/*.json`], `${customDir}/i18n`);
}

if (process.argv.includes('--0-clean')) {
    clean();
} else if (process.argv.includes('--1-npm')) {
    npmInstall(srcAdmin).catch((e: unknown) => console.error(`Cannot install npm: ${e as Error}`));
} else if (process.argv.includes('--2-build')) {
    buildReact(srcAdmin, { vite: true }).catch((e: unknown) => console.error(`Cannot build: ${e as Error}`));
} else if (process.argv.includes('--3-copy')) {
    copyAllFiles();
} else {
    clean();
    npmInstall(srcAdmin)
        .then(() => buildReact(srcAdmin, { vite: true }))
        .then(() => copyAllFiles())
        .catch((e: unknown) => {
            console.error(e);
            process.exit(2);
        });
}
