import { describe, test, beforeAll } from 'bun:test';
import * as assert from 'node:assert/strict';
import * as path from 'node:path';
import type { Connection, Diagnostic, PublishDiagnosticsParams } from 'vscode-languageserver';
import { DiagnosticProvider } from 'diagnostics';
import { DocumentCache } from 'documents/DocumentCache';
import { EmptyEnvironment, IFrameworkTwigEnvironment } from 'twigEnvironment/IFrameworkTwigEnvironment';
import { toDocumentUri } from 'utils/uri';
import { initializeTestParser } from '../__helpers__/parser';

const FIXTURE_ROOT = path.join(__dirname, '__fixtures__', 'template-refresh');
const APP_DIR = path.join(FIXTURE_ROOT, 'application');
const BASE_TWIG = path.join(APP_DIR, 'templates', 'base.html.twig');

const makeSpyConnection = () => {
    const publishes: PublishDiagnosticsParams[] = [];
    const connection = {
        sendDiagnostics: async (params: PublishDiagnosticsParams) => {
            publishes.push(params);
        },
    } as unknown as Connection;
    return { connection, publishes };
};

const envWithBundleMapping: IFrameworkTwigEnvironment = {
    ...EmptyEnvironment,
    templateMappings: [
        { namespace: '@Bundle1', directory: '../bundle1/templates' },
    ],
};

const lastDiagnosticsFor = (
    publishes: PublishDiagnosticsParams[],
    uri: string,
): Diagnostic[] | undefined => {
    for (let i = publishes.length - 1; i >= 0; i--) {
        if (publishes[i].uri === uri) return publishes[i].diagnostics;
    }
    return undefined;
};

const isTemplateNotFound = (d: Diagnostic) => /^Template ".*" not found$/.test(d.message);

describe('diagnostics — refresh on environment change', () => {
    beforeAll(initializeTestParser);

    test('clears "Template not found" for open docs after env mappings update', async () => {
        const workspaceFolder = { name: 'app', uri: toDocumentUri(APP_DIR) };
        const documentCache = new DocumentCache(workspaceFolder);
        // Initial env = EmptyEnvironment (only "templates/" directory, no bundle namespace).
        documentCache.configure(EmptyEnvironment, null);

        const { connection, publishes } = makeSpyConnection();
        const diagnosticProvider = new DiagnosticProvider(connection, documentCache);

        const baseUri = toDocumentUri(BASE_TWIG);
        const document = await documentCache.get(baseUri);

        // First validation: simulates didOpen firing before Symfony env finished loading.
        await diagnosticProvider.validateReport(document);

        const initial = lastDiagnosticsFor(publishes, baseUri);
        assert.ok(initial, 'expected initial diagnostics publish for base.html.twig');
        assert.ok(
            initial!.some(isTemplateNotFound),
            `expected a "Template not found" diagnostic, got: ${JSON.stringify(initial)}`,
        );

        // Symfony finishes: environment now exposes the @Bundle1 mapping.
        documentCache.configure(envWithBundleMapping, null);

        await diagnosticProvider.refresh(null);

        const afterRefresh = lastDiagnosticsFor(publishes, baseUri);
        assert.ok(
            afterRefresh,
            'expected refresh() to publish fresh diagnostics for cached documents',
        );
        assert.deepEqual(
            afterRefresh!.filter(isTemplateNotFound),
            [],
            `expected no "Template not found" diagnostics after refresh, got: ${JSON.stringify(afterRefresh)}`,
        );
    });
});
