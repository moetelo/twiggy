import { execSync } from 'node:child_process';
import * as esbuild from 'esbuild';
import { existsSync } from 'node:fs';
import { cp, rm } from 'node:fs/promises';
import copyPlugin from 'esbuild-plugin-copy';

const isDev = process.argv.includes('--dev');

const grammarWasmPath = '../tree-sitter-twig/tree-sitter-twig.wasm';

const triggerVscodeDebug: esbuild.Plugin = {
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

const watchLogPlugin: esbuild.Plugin = {
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
                { watch: isDev, from: '../language-server/phpUtils/**/*', to: './dist/phpUtils/' },
            ],
        }),
    ],
} as const satisfies esbuild.BuildOptions;

async function main() {
    await rm('./dist', { force: true, recursive: true });
    await rm('../language-server/dist', { force: true, recursive: true });

    const grammarWasmExists = existsSync(grammarWasmPath);
    console.info({ grammarWasmExists });

    if (!grammarWasmExists) {
        console.info('Building wasm grammar. This may take a while.');
        execSync('bun run --cwd ../tree-sitter-twig build-wasm', { stdio: 'inherit' })
    }

    const ctx = await esbuild.context(buildOptions);
    if (isDev) {
        await ctx.watch();
        return;
    }

    await ctx.rebuild();
    await ctx.dispose();

    await cp('./dist', '../language-server/dist', { recursive: true });
    await rm('../language-server/dist/extension.js');
}

main();
