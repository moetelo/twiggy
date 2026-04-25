import { describe, test, beforeAll } from 'bun:test';
import * as assert from 'node:assert/strict';
import type { CompletionItem } from 'vscode-languageserver';
import { variableProperties } from 'completions/variableProperties';
import { ExpressionTypeResolver } from 'typing/ExpressionTypeResolver';
import { TypeResolver } from 'typing/TypeResolver';
import type { ReflectedType } from 'phpInterop/ReflectedType';
import { createDocumentCache, documentFromCode, documentFromCodeWithTypeResolver } from '../__helpers__/documentFromCode';
import { documentWithCursor, documentWithCursorAndTypes } from '../__helpers__/fixtures';
import { MockEnvironment, MockPhpExecutor } from '../__helpers__/mocks';
import { initializeTestParser } from '../__helpers__/parser';

const assertExpectedType = (completions: CompletionItem[], expectedType: ReflectedType) => {
    const expectedLabels = [...expectedType.properties, ...expectedType.methods].map((prop) => prop.name);

    expectedLabels.every((label) => {
        const completionFound = completions.find((item) => item.label === label);
        assert.ok(completionFound, `${label} not in completions.`);
    });
};

describe('variableProperties (macro imports)', () => {
    beforeAll(initializeTestParser);

    test('lists properties of imported macro file', async () => {
        const {
            document: documentWithMacroUsage,
            position,
            cursorNode,
        } = await documentWithCursor(
            `{% import 'components.html.twig' as components %}
            {{ components.$0 }}`,
            'documentWithMacroUsage.html.twig',
        );
        const importedDocument = await documentFromCode(
            `{% macro new_macro() %}
                ...
            {% endmacro %}`,
            'components.html.twig',
        );

        const documentCache = createDocumentCache();
        documentCache.configure(MockEnvironment, null);
        await documentCache.updateText(documentWithMacroUsage.uri, documentWithMacroUsage.text);
        await documentCache.updateText(importedDocument.uri, importedDocument.text);

        const completions = await variableProperties(
            documentWithMacroUsage,
            documentCache,
            cursorNode,
            null,
            position,
        );

        assert.ok(completions.find((item) => item.label === 'new_macro'), 'macro not in completions.');
    });

    test('lists properties of imported macro file (inside of a macro)', async () => {
        const {
            document: documentWithMacroUsage,
            position,
            cursorNode,
        } = await documentWithCursor(
            `{% macro test() %}
                {% import 'components.html.twig' as components %}
                {{ components.$0 }}
            {% endmacro %}`,
            'documentWithMacroUsage.html.twig',
        );
        const importedDocument = await documentFromCode(
            `{% macro new_macro() %}
                ...
            {% endmacro %}`,
            'components.html.twig',
        );

        const documentCache = createDocumentCache();
        documentCache.configure(MockEnvironment, null);
        await documentCache.updateText(documentWithMacroUsage.uri, documentWithMacroUsage.text);
        await documentCache.updateText(importedDocument.uri, importedDocument.text);

        const completions = await variableProperties(
            documentWithMacroUsage,
            documentCache,
            cursorNode,
            null,
            position,
        );

        assert.ok(completions.find((item) => item.label === 'new_macro'), 'macro not in completions.');
    });
});

describe('variableProperties (PHP type resolution)', () => {
    beforeAll(initializeTestParser);

    const runCompletion = async (fixture: string) => {
        const typeResolver = new TypeResolver(new MockPhpExecutor());
        const { document, position, cursorNode } = await documentWithCursorAndTypes(fixture, typeResolver);

        const documentCache = createDocumentCache();
        documentCache.configure(MockEnvironment, typeResolver);

        return variableProperties(
            document,
            documentCache,
            cursorNode,
            new ExpressionTypeResolver(typeResolver),
            position,
        );
    };

    test('completes properties of a typed variable annotation', async () => {
        const completions = await runCompletion(
            `{# @var something \\App\\SomeClass #}
            {{ something.$0 }}`,
        );
        assertExpectedType(completions, MockPhpExecutor.classMap['App\\SomeClass']);
    });

    test('completes properties of a types required variable declaration', async () => {
        const completions = await runCompletion(
            `{% types something: '\\App\\SomeClass' %}
            {{ something.$0 }}`,
        );
        assertExpectedType(completions, MockPhpExecutor.classMap['App\\SomeClass']);
    });

    test('completes properties of a types optional variable declaration', async () => {
        const completions = await runCompletion(
            `{% types something?: '\\App\\SomeClass' %}
            {{ something.$0 }}`,
        );
        assertExpectedType(completions, MockPhpExecutor.classMap['App\\SomeClass']);
    });

    test('completes method return type', async () => {
        const completions = await runCompletion(
            `{# @var something \\App\\SomeClass #}
            {{ something.getPerson().$0 }}`,
        );
        assertExpectedType(completions, MockPhpExecutor.classMap['App\\Person']);
    });

    test('completes on bare method reference (no parentheses)', async () => {
        const completions = await runCompletion(
            `{# @var something \\App\\SomeClass #}
            {{ something.getPerson.$0 }}`,
        );
        assertExpectedType(completions, MockPhpExecutor.classMap['App\\Person']);
    });

    test('completes deep property chain', async () => {
        const completions = await runCompletion(
            `{# @var something \\App\\SomeClass #}
            {{ something.getPerson().getOtherClass().$0 }}`,
        );
        assertExpectedType(completions, MockPhpExecutor.classMap['App\\OtherClass']);
    });

    test('completes recursive type chain', async () => {
        const completions = await runCompletion(
            `{# @var something \\App\\SomeClass #}
            {{ something.getPerson().getParent().getParent().getParent().$0 }}`,
        );
        assertExpectedType(completions, MockPhpExecutor.classMap['App\\Person']);
    });

    test('completes method return type saved to a set variable', async () => {
        const completions = await runCompletion(
            `{# @var something \\App\\SomeClass #}
            {% set person = something.getPerson() %}
            {{ person.$0 }}`,
        );
        assertExpectedType(completions, MockPhpExecutor.classMap['App\\Person']);
    });
});
