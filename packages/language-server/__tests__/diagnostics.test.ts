import { describe, test, before } from 'node:test'
import * as assert from 'node:assert/strict'
import { createRange, initializeTestParser } from './utils';
import Parser from 'web-tree-sitter';
import { DiagnosticProvider } from '../src/diagnostics';


describe('diagnostics', () => {
    let parser!: Parser;
    let diagnosticProvider = new DiagnosticProvider(null as any);

    before(async () => {
        parser = await initializeTestParser();
    });

    const testDiagnostic = (code: string, start = 0, end = code.length) => {
        const template = parser.parse(code);
        const diagnostics = diagnosticProvider.validateTree(template);

        assert.equal(diagnostics.length, 1);
        assert.deepEqual(diagnostics[0].range, createRange(start, end));
    };

    test('empty output', () => testDiagnostic('{{ }}'));
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
            '{% if true %}'.length, '{% if true %}{{ }}'.length,
        ),
    );
});
