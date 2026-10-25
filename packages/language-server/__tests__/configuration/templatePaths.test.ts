import { describe, test, beforeAll, afterAll } from 'bun:test';
import * as assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { parseTemplatePaths } from 'configuration/templatePaths';
import { DocumentCache } from 'documents/DocumentCache';
import type { IFrameworkTwigEnvironment } from 'twigEnvironment/IFrameworkTwigEnvironment';
import { EmptyEnvironment } from 'twigEnvironment/IFrameworkTwigEnvironment';
import { withTemplateMappings } from 'twigEnvironment/withTemplateMappings';
import { toDocumentUri } from 'utils/uri';
import { initializeTestParser } from '../__helpers__/parser';

describe('parseTemplatePaths', () => {
    test('maps entries and normalizes namespaces', () => {
        assert.deepEqual(
            parseTemplatePaths([
                { namespace: '@MyBundle', path: 'src/MyBundle/templates' },
                { namespace: 'Other', path: '/abs/templates' },
                { namespace: ' @Trailing/ ', path: ' trailing/templates ' },
                { namespace: '', path: 'custom/templates' },
            ]),
            [
                { namespace: '@MyBundle', directory: 'src/MyBundle/templates' },
                { namespace: '@Other', directory: '/abs/templates' },
                { namespace: '@Trailing', directory: 'trailing/templates' },
                { namespace: '', directory: 'custom/templates' },
            ],
        );
    });

    test('skips malformed entries', () => {
        assert.deepEqual(
            parseTemplatePaths([
                null,
                'templates',
                { namespace: '@NoPath' },
                { path: 'no/namespace' },
                { namespace: 1, path: 'numeric/namespace' },
                { namespace: '@Empty', path: '  ' },
                { namespace: '@', path: 'bare/at' },
                { namespace: '@Valid', path: 'valid' },
            ]),
            [{ namespace: '@Valid', directory: 'valid' }],
        );
    });

    test('ignores a missing or non-array setting', () => {
        assert.deepEqual(parseTemplatePaths(undefined), []);
        assert.deepEqual(parseTemplatePaths(null), []);
        assert.deepEqual(parseTemplatePaths({ namespace: '@A', path: 'a' }), []);
    });
});

describe('withTemplateMappings', () => {
    const frameworkEnvironment: IFrameworkTwigEnvironment = {
        environment: null,
        routes: { home: { path: '/' } },
        templateMappings: [{ namespace: '@Framework', directory: 'vendor/templates' }],
    };

    test('puts user mappings before framework mappings', () => {
        const environment = withTemplateMappings(frameworkEnvironment, [
            { namespace: '@MyBundle', directory: 'src/MyBundle/templates' },
        ]);

        assert.deepEqual(environment.templateMappings, [
            { namespace: '@MyBundle', directory: 'src/MyBundle/templates' },
            { namespace: '@Framework', directory: 'vendor/templates' },
        ]);
        assert.equal(environment.routes, frameworkEnvironment.routes);
        assert.equal(environment.environment, null);
    });

    test('returns the framework environment as is without user mappings', () => {
        assert.equal(withTemplateMappings(frameworkEnvironment, []), frameworkEnvironment);
    });
});

describe('DocumentCache.resolveByTwigPath with user template paths', () => {
    const workspace = mkdtempSync(path.join(os.tmpdir(), 'twiggy-template-paths-'));
    const outside = mkdtempSync(path.join(os.tmpdir(), 'twiggy-template-paths-abs-'));

    beforeAll(async () => {
        await initializeTestParser();

        const files: Record<string, string> = {
            [path.join(workspace, 'src/MyBundle/templates/widget.html.twig')]: 'bundle',
            [path.join(workspace, 'custom/templates/page.html.twig')]: 'custom',
            [path.join(workspace, 'templates/page.html.twig')]: 'default',
            [path.join(workspace, 'templates/fallback.html.twig')]: 'fallback',
            [path.join(outside, 'shared.html.twig')]: 'absolute',
        };
        for (const [file, text] of Object.entries(files)) {
            await mkdir(path.dirname(file), { recursive: true });
            await writeFile(file, text);
        }
    });

    afterAll(async () => {
        await rm(workspace, { recursive: true, force: true });
        await rm(outside, { recursive: true, force: true });
    });

    const resolveText = async (pathFromTwig: string) => {
        const documentCache = new DocumentCache({ name: 'ws', uri: toDocumentUri(workspace) });
        const mappings = parseTemplatePaths([
            { namespace: 'MyBundle', path: 'src/MyBundle/templates' },
            { namespace: '@Shared', path: outside },
            { namespace: '', path: 'custom/templates' },
        ]);
        documentCache.configure(withTemplateMappings(EmptyEnvironment, mappings), null);

        const document = await documentCache.resolveByTwigPath(pathFromTwig);
        return document?.text;
    };

    test('resolves a user namespace relative to the workspace', async () => {
        assert.equal(await resolveText('@MyBundle/widget.html.twig'), 'bundle');
    });

    test('resolves an absolute path', async () => {
        assert.equal(await resolveText('@Shared/shared.html.twig'), 'absolute');
    });

    test('user root mapping wins over the default one', async () => {
        assert.equal(await resolveText('page.html.twig'), 'custom');
    });

    test('falls back to the framework mappings', async () => {
        assert.equal(await resolveText('fallback.html.twig'), 'fallback');
    });
});
