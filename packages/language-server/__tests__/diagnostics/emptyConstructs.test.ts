import { describe, test, beforeAll } from 'bun:test';
import * as assert from 'node:assert/strict';
import { Document } from 'documents/Document';
import { DiagnosticProvider } from 'diagnostics';
import { createDocumentCache } from '../__helpers__/documentFromCode';
import { parseRange } from '../__helpers__/fixtures';
import { createNullConnection } from '../__helpers__/mocks';
import { initializeTestParser } from '../__helpers__/parser';

describe('diagnostics — empty constructs', () => {
    const documentCache = createDocumentCache();
    const diagnosticProvider = new DiagnosticProvider(createNullConnection(), documentCache);

    beforeAll(initializeTestParser);

    const testDiagnostic = async (fixture: string) => {
        const { text, range } = parseRange(fixture);
        const document = new Document('test://test.html.twig');
        await documentCache.setText(document, text);

        const diagnostics = await diagnosticProvider.validateTree(document);

        assert.equal(diagnostics.length, 1);
        assert.deepEqual(diagnostics[0].range, range);
    };

    test('empty output', async () => testDiagnostic(`$0{{ }}$0`));
    test('empty if condition', async () => testDiagnostic(`$0{% if %}$0<input>{% endif %}`));
    test('empty for element', async () => testDiagnostic(`$0{% for %}$0<input>{% endfor %}`));

    test('empty if condition (multiline)', async () =>
        testDiagnostic(`$0{% if %}$0\n<input>\n{% endif %}`));

    test('empty output nested in if block', async () =>
        testDiagnostic(`{% if true %}$0{{ }}$0{% endif %}`));
});
