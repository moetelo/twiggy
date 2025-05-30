import { describe, test, before } from 'node:test'
import * as assert from 'node:assert/strict'
import { createDocumentCache, createLengthRange, initializeTestParser } from './utils';
import Parser from 'web-tree-sitter';
import { DiagnosticProvider } from '../src/diagnostics';
import { Document } from 'documents';


describe('diagnostics', () => {
    let parser!: Parser;

    const documentCache = createDocumentCache();

    let diagnosticProvider = new DiagnosticProvider(null as any, documentCache);

    before(async () => {
        parser = await initializeTestParser();
    });

    const testDiagnostic = async (code: string, start = 0, length = code.length) => {
        const document = new Document('test://test.html.twig');
        await documentCache.setText(document, code);

        const diagnostics = await diagnosticProvider.validateTree(document);

        assert.equal(diagnostics.length, 1);
        assert.deepEqual(diagnostics[0].range, createLengthRange(start, length));
    };

    test('empty output', () => {
        testDiagnostic('{{ }}');
    });
    test('empty if condition', () => testDiagnostic(`{% if %}<input>{% endif %}`, 0, '{% if %}'.length));
    test('empty for element', () => testDiagnostic('{% for %}<input>{% endfor %}', 0, '{% for %}'.length));

    test(
        'empty if condition (multiline)',
        () => testDiagnostic(
            `{% if %}\n<input>\n{% endif %}`,
            0, '{% if %}'.length,
        ),
    );

    test(
        'empty output in if block',
        () => testDiagnostic(
            '{% if true %}{{ }}{% endif %}',
            '{% if true %}'.length, '{{ }}'.length,
        ),
    );
});
