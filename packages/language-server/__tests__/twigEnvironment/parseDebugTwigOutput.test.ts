import { describe, test } from 'bun:test';
import * as assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseDebugTwigOutput } from 'twigEnvironment/symfony/parseDebugTwigOutput';
import { EmptyEnvironment } from 'twigEnvironment/IFrameworkTwigEnvironment';
import { DocumentCache } from 'documents';
import { initializeTestParser } from '../__helpers__/parser';

const outputWithLoaderPaths = (loaderPaths: Record<string, string[]>) => ({
    functions: {},
    filters: {},
    globals: {},
    tests: [],
    loader_paths: loaderPaths,
});

describe('parseDebugTwigOutput', () => {
    test('maps namespaces', () => {
        const { LoaderPaths } = parseDebugTwigOutput(
            outputWithLoaderPaths({
                '(None)': ['templates'],
                '': ['craft/templates'],
                '@App': ['src/App/templates'],
                'my-plugin': ['plugins/my-plugin/templates'],
            }),
        );

        assert.deepEqual(LoaderPaths, [
            { namespace: '', directory: 'templates' },
            { namespace: '', directory: 'craft/templates' },
            { namespace: '@App', directory: 'src/App/templates' },
            { namespace: 'my-plugin', directory: 'plugins/my-plugin/templates' },
        ]);
    });

    test('resolves a Craft site template root by its prefix', async () => {
        await initializeTestParser();

        const workspace = mkdtempSync(path.join(tmpdir(), 'twiggy-namespaces-'));
        const pluginTemplates = path.join(workspace, 'plugins', 'my-plugin', 'templates');
        mkdirSync(pluginTemplates, { recursive: true });
        writeFileSync(path.join(pluginTemplates, 'foo.twig'), 'plugin');

        const { LoaderPaths } = parseDebugTwigOutput(
            outputWithLoaderPaths({ 'my-plugin': [pluginTemplates] }),
        );

        const documentCache = new DocumentCache({
            name: 'test',
            uri: pathToFileURL(workspace).href,
        });
        documentCache.configure({ ...EmptyEnvironment, templateMappings: LoaderPaths }, null);

        const document = await documentCache.resolveByTwigPath('my-plugin/foo.twig');
        assert.equal(document?.uri, pathToFileURL(path.join(pluginTemplates, 'foo.twig')).href);
    });
});
