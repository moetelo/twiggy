import { describe, test, beforeAll } from 'bun:test';
import * as assert from 'node:assert/strict';
import { CompletionItemKind } from 'vscode-languageserver';
import { localVariables } from 'completions/local-variables';
import { documentWithCursor } from '../__helpers__/fixtures';
import { initializeTestParser } from '../__helpers__/parser';

describe('localVariables', () => {
    beforeAll(initializeTestParser);

    test('suggests in-scope variables in empty output, cursor stuck to {{', async () => {
        const { document, cursorNode } = await documentWithCursor(`{% set variable = 123 %}{{$0 }}`);

        const completions = localVariables(document, cursorNode);
        assert.ok(completions.find((item) => item.label === 'variable'), 'variable not in completions.');
    });

    test('suggests in-scope variables in empty output, cursor after space', async () => {
        const { document, cursorNode } = await documentWithCursor(`{% set variable = 123 %}{{ $0}}`);

        const completions = localVariables(document, cursorNode);
        assert.ok(completions.find((item) => item.label === 'variable'), 'variable not in completions.');
    });

    test('suggests in-scope variables in if condition', async () => {
        const { document, cursorNode } = await documentWithCursor(`{% set var = 1 %}{% if $0 %}{% endif %}`);

        const completions = localVariables(document, cursorNode);
        assert.equal(completions[0]?.label, 'var');
    });

    test('suggests in-scope variables in for operand', async () => {
        const { document, cursorNode } = await documentWithCursor(`{% set users = [1, 2] %}{% for u in $0 %}{% endfor %}`);

        const completions = localVariables(document, cursorNode);
        assert.equal(completions[0]?.label, 'users');
    });

    test('exposes value and kind on suggested variables', async () => {
        const { document, cursorNode } = await documentWithCursor(`{% set variable = 123 %}{{ v$0 }}`);

        const completions = localVariables(document, cursorNode);
        const completionFound = completions.find((item) => item.label === 'variable');
        assert.ok(completionFound, 'variable not in completions.');
        assert.equal(completionFound.detail, '123', 'variable value not in completions.');
        assert.equal(completionFound.kind, CompletionItemKind.Field, 'wrong variable type.');
    });

    test('suggests macro import alias from within the enclosing macro', async () => {
        const { document, cursorNode } = await documentWithCursor(
            `{% macro test() %}
                {% import 'components.html.twig' as components %}
                {{ $0 }}
            {% endmacro %}`,
        );

        const completions = localVariables(document, cursorNode);
        assert.ok(completions.find((item) => item.label === 'components'), 'macro alias not in completions.');
    });

    test('suggests macro import alias at top level', async () => {
        const { document, cursorNode } = await documentWithCursor(
            `{% import 'components.html.twig' as components %}
            {{ $0 }}`,
        );

        const completions = localVariables(document, cursorNode);
        assert.ok(completions.find((item) => item.label === 'components'), 'macro alias not in completions.');
    });
});
