// @ts-check

import { execSync } from 'node:child_process';
import * as esbuild from 'esbuild';
import * as chokidar from 'chokidar';
import { cpSync as cp, rmSync as rm, existsSync } from 'node:fs';
import copyPlugin from 'esbuild-plugin-copy';

const isDev = process.argv.includes('--dev');

const grammarWasmPath = '../tree-sitter-twig/tree-sitter-twig.wasm';

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

const buildOptions = /** @type {const} @satisfies {esbuild.BuildOptions} */ ({
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
    logLevel: isDev ? 'error' : 'info',
    define: {
        'process.env.NODE_ENV': !isDev ? '"production"' : 'undefined',
        '__DEBUG__': JSON.stringify(isDev),
    },
    plugins: [
        ...(isDev ? [ triggerVscodeDebug, watchLogPlugin ] : []),
        copyPlugin({
            resolveFrom: 'cwd',
            assets: [
                { watch: isDev, from: '../language-server/node_modules/web-tree-sitter/tree-sitter.wasm', to: './dist/' },
                { watch: isDev, from: grammarWasmPath, to: './dist/' },
                { watch: isDev, from: '../language-server/phpUtils/twiggy-php-utils.phar', to: './dist/phpUtils/' },
            ],
        }),
    ],
});

async function main() {
    rm('./dist', { force: true, recursive: true });
    rm('../language-server/dist', { force: true, recursive: true });

    const grammarWasmExists = existsSync(grammarWasmPath);
    console.info({ grammarWasmExists });

    if (!grammarWasmExists) {
        console.info('Building wasm grammar. This may take a while.');
        execSync('pnpm --workspace-root run build-grammar-wasm', { stdio: 'inherit' })
    }

    const ctx = await esbuild.context(buildOptions);
    if (isDev) {
        const phpWatcher = chokidar.watch([
            '../language-server/phpUtils/index.php',
            '../language-server/phpUtils/src/',
        ]);

        phpWatcher.on('change', () => {
            execSync('composer build', { cwd: '../language-server/phpUtils', stdio: 'inherit' });
        });

        await ctx.watch();
        return;
    }

    await ctx.rebuild();
    await ctx.dispose();

    cp('./dist', '../language-server/dist', { recursive: true });
    rm('../language-server/dist/extension.js');
}

main();
