// @ts-check

import { execSync } from 'child_process';
import * as esbuild from 'esbuild';
import { cp, rm, stat } from 'fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'path';

const isPublish = process.argv.includes('--publish');
const isPackage = process.argv.includes('--package');
const isDev = process.argv.includes('--dev');

const treeSitterWasmPath = path.resolve('../language-server/node_modules/web-tree-sitter/tree-sitter.wasm');
const grammarWasmRelativePath = path.resolve('../tree-sitter-twig/tree-sitter-twig.wasm');
const phpUtilsPath = path.resolve('../language-server/phpUtils');

/**
 * @type {esbuild.BuildOptions}
 */
const buildOptions = {
    entryPoints: {
        extension: './src/extension.ts',
        server: '../language-server/src/index.ts',
    },
    bundle: true,
    external: [
        'vscode',
    ],
    outdir: './dist',
    format: 'cjs',
    platform: 'node',
    metafile: process.argv.includes('--metafile'),
    minify: !isDev,
    sourcemap: isDev,
    assetNames: 'assets/[name]-[hash].[ext]',
};


/**
 * @param {esbuild.BuildOptions} options
 */
async function buildProduction(options) {
    await esbuild.build({
        ...options,
        define: {
            'process.env.NODE_ENV': '"production"',
        },
    }).catch(() => process.exit(1));

    await cp('./dist', '../language-server/dist', { recursive: true });
    await rm('../language-server/dist/extension.js');

    const vsceCommand = isPublish
        ? 'publish'
        : isPackage
            ? 'package'
            : '';

    if (vsceCommand) {
        spawnSync('vsce', [vsceCommand, '--no-dependencies'], {
            stdio: 'inherit',
        });
    }
}


/**
 * @param {esbuild.BuildOptions} options
 */
async function watchDev(options) {
    /**
     * @type {esbuild.Plugin}
     */
    const triggerVscodeDebug = {
        name: 'trigger-vscode-problem-matcher-debug',
        setup(build) {
            let isFirstBuild = true;

            build.onEnd(_result => {
                if (isFirstBuild) {
                    console.log('[watch] build finished, watching for changes...');
                    isFirstBuild = false;
                }
            });
        },
    };

    /**
     * @type {esbuild.Plugin}
     */
    const watchLogPlugin = {
        name: 'watch-log-plugin',
        setup(build) {
            let start = performance.now();

            build.onStart(() => {
                start = performance.now();
            });

            build.onEnd(_result => {
                const end = performance.now();
                const time = end - start;
                console.log(`[${new Date().toLocaleTimeString()}] ${time.toFixed(1)}ms`);
            });
        },
    };

    const context = await esbuild.context({
        ...options,
        logLevel: 'error',
        plugins: [
            triggerVscodeDebug,
            watchLogPlugin,
        ],
    });

    await context.watch();
}


async function main() {
    await rm('./dist', { force: true, recursive: true });
    await rm('../language-server/dist', { force: true, recursive: true });

    const grammarWasmExists = await stat(grammarWasmRelativePath).then(() => true).catch(() => false);
    console.info({ grammarWasmExists });

    if (!grammarWasmExists) {
        console.info('Building wasm grammar. This may take a while.');
        execSync('pnpm --workspace-root run build-grammar-wasm', { stdio: 'inherit' })
    }

    // Include wasm grammar
    await cp(treeSitterWasmPath, './dist/tree-sitter.wasm');
    await cp(grammarWasmRelativePath, './dist/tree-sitter-twig.wasm');

    await cp(phpUtilsPath, './dist/phpUtils', { recursive: true });

    if (!isDev) {
        await buildProduction(buildOptions);
    } else {
        await watchDev(buildOptions);
    }
}

main();
