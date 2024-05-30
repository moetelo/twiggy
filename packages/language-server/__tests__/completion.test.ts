import { describe, test, before } from 'node:test'
import * as assert from 'node:assert/strict'
import { filters } from '../src/completions/filters';
import Parser from 'web-tree-sitter';
import { twigFilters } from '../src/staticCompletionInfo';
import { localVariables } from '../src/completions/local-variables';
import { CompletionItemKind, type CompletionItem } from 'vscode-languageserver';
import { documentFromCode, documentFromCodeWithTypeResolver, initializeTestParser } from './utils';
import { variableProperties } from '../src/completions/variableProperties';
import { DocumentCache } from '../src/documents/DocumentCache';
import { MockEnvironment, MockPhpExecutor } from './mocks';
import { ExpressionTypeResolver } from '../src/typing/ExpressionTypeResolver';
import { TypeResolver } from '../src/typing/TypeResolver';
import type { ReflectedType } from '../src/phpInterop/ReflectedType';

const assertExpectedType = (completions: CompletionItem[], expectedType: ReflectedType) => {
    const expectedLabels = [...expectedType.properties, ...expectedType.methods].map((prop) => prop.name);

    expectedLabels.every((label) => {
        const completionFound = completions.find((item) => item.label === label);
        assert.ok(completionFound, `${label} not in completions.`);
    });
};

describe('completion', () => {
    let parser!: Parser;

    before(async () => {
        parser = await initializeTestParser();
    });

    test('in empty output, {{| }}', async () => {
        const code = `{% set variable = 123 %}{{ }}`;
        const document = await documentFromCode(code);

        const completions = localVariables(
            document,
            document.deepestAt({ line: 0, character: `{% set variable = 123 %}{{`.length })!,
        );

        const completionFound = completions.find((item) => item.label === 'variable');
        assert.ok(completionFound, 'variable not in completions.');
    });

    test('in empty output, {{ |}}', async () => {
        const code = `{% set variable = 123 %}{{ }}`;
        const document = await documentFromCode(code);

        const completions = localVariables(
            document,
            document.deepestAt({ line: 0, character: `{% set variable = 123 %}{{ `.length })!,
        );

        const completionFound = completions.find((item) => item.label === 'variable');
        assert.ok(completionFound, 'variable not in completions.');
    });

    test('in empty if, {% if | %}', async () => {
        const code = `{% set var = 1 %}{% if  %}{% endif %}`;
        const document = await documentFromCode(code);

        const completions = localVariables(
            document,
            document.deepestAt({ line: 0, character: `{% set var = 1 %}{% if `.length })!,
        );

        assert.equal(completions[0]?.label, 'var');
    });

    test('in empty for, {% for el in | %}', async () => {
        const code = `{% set users = [1, 2] %}{% for u in  %}{% endfor %}`;
        const document = await documentFromCode(code);

        const completions = localVariables(
            document,
            document.deepestAt({ line: 0, character: `{% set users = [1, 2] %}{% for u in `.length })!,
        );

        assert.equal(completions[0]?.label, 'users');
    });

    test('localVariables', async () => {
        const code = `{% set variable = 123 %}{{ v^ }}`;
        const document = await documentFromCode(code);

        const completions = localVariables(
            document,
            document.deepestAt({ line: 0, character: code.indexOf('^') })!,
        );

        const completionFound = completions.find((item) => item.label === 'variable');
        assert.ok(completionFound, 'variable not in completions.');
        assert.ok(completionFound.detail === '123', 'variable value not in completions.');
        assert.ok(completionFound.kind === CompletionItemKind.Field, 'wrong variable type.');
    });

    test('macroses (in macro, list imports)', async () => {
        const variableName = 'components';
        const document = await documentFromCode(
            `{% macro test() %}
                {% import 'components.html.twig' as ${variableName} %}
                {{  }}
            {% endmacro %}`,
        );

        const pos = {
            line: 2,
            character: document.text.split('\n')[2].indexOf('{{') + '{{'.length,
        };

        const completions = localVariables(
            document,
            document.deepestAt(pos)!,
        );

        const completionFound = completions.find((item) => item.label === variableName);
        assert.ok(completionFound, 'macro not in completions.');
    });

    test('macroses (list imports)', async () => {
        const variableName = 'components';
        const document = await documentFromCode(
            `{% import 'components.html.twig' as ${variableName} %}
            {{  }}`,
        );

        const pos = {
            line: 1,
            character: document.text.split('\n')[1].indexOf('{{') + '{{'.length,
        };

        const completions = localVariables(
            document,
            document.deepestAt(pos)!,
        );

        const completionFound = completions.find((item) => item.label === variableName);
        assert.ok(completionFound, 'macro not in completions.');
    });

    test('filters', async () => {
        const code = `{{ something|^ }}`;
        const document = await documentFromCode(code);
        const cursorNode = document.deepestAt({ line: 0, character: code.indexOf('^') })!;
        const customFilters = [
            { identifier: 'custom_filter_without_args', arguments: [] },
            {
                identifier: 'custom_filter_with_args',
                arguments: [
                    { identifier: 'arg1', defaultValue: 'default' },
                ],
            },
        ];
        const completions = filters(cursorNode, customFilters);

        twigFilters.every((filter) => {
            assert.ok(
                completions.some((item) => item.label === filter.label),
                `${filter.label} not in completions.`,
            );
        });

        customFilters.every((filter) => {
            assert.ok(
                completions.some((item) => item.label === filter.identifier),
                `${filter.identifier} not in completions.`,
            );
        });

        assert.equal(completions.length, twigFilters.length + customFilters.length);
    });

    test('macroses (list properties of imported file)', async () => {
        const documentWithMacroUsage = await documentFromCode(
            `{% import 'components.html.twig' as components %}
            {{ components. }}`,
            'documentWithMacroUsage.html.twig',
        );
        const importedDocument = await documentFromCode(
            `{% macro new_macro() %}
                ...
            {% endmacro %}`,
            'components.html.twig',
        );

        const documentCache = new DocumentCache({ name: '', uri: '' });
        documentCache.configure(MockEnvironment, null);
        await documentCache.updateText(documentWithMacroUsage.uri, documentWithMacroUsage.text);
        await documentCache.updateText(importedDocument.uri, importedDocument.text);

        const pos = {
            line: 1,
            character: documentWithMacroUsage.text.split('\n')[1].indexOf('components.') + 'components.'.length,
        };
        const cursorNode = documentWithMacroUsage.deepestAt(pos)!;

        const completions = await variableProperties(
            documentWithMacroUsage,
            documentCache,
            cursorNode,
            null,
            pos,
        );

        const completionFound = completions.find((item) => item.label === 'new_macro');
        assert.ok(completionFound, 'macro not in completions.');
    });

    test('macroses (in macro, list properties of imported file)', async () => {
        const documentWithMacroUsage = await documentFromCode(
            `{% macro test() %}
                {% import 'components.html.twig' as components %}
                {{ components. }}
            {% endmacro %}`,
            'documentWithMacroUsage.html.twig',
        );
        const importedDocument = await documentFromCode(
            `{% macro new_macro() %}
                ...
            {% endmacro %}`,
            'components.html.twig',
        );

        const documentCache = new DocumentCache({ name: '', uri: '' });
        documentCache.configure(MockEnvironment, null);
        await documentCache.updateText(documentWithMacroUsage.uri, documentWithMacroUsage.text);
        await documentCache.updateText(importedDocument.uri, importedDocument.text);

        const pos = {
            line: 2,
            character: documentWithMacroUsage.text.split('\n')[2].indexOf('components.') + 'components.'.length,
        };
        const cursorNode = documentWithMacroUsage.deepestAt(pos)!;

        const completions = await variableProperties(
            documentWithMacroUsage,
            documentCache,
            cursorNode,
            null,
            pos,
        );

        const completionFound = completions.find((item) => item.label === 'new_macro');
        assert.ok(completionFound, 'macro not in completions.');
    });

    test('php completion for typed variable', async () => {
        const typeResolver = new TypeResolver(new MockPhpExecutor);
        const document = await documentFromCodeWithTypeResolver(
            `{# @var something \\App\\SomeClass #}
            {{ something. }}`,
            typeResolver,
        );

        const documentCache = new DocumentCache({ name: '', uri: '' });
        documentCache.configure(MockEnvironment, typeResolver);

        const pos = {
            line: 1,
            character: document.text.split('\n')[1].lastIndexOf('.') + '.'.length,
        };
        const cursorNode = document.deepestAt(pos)!;

        const completions = await variableProperties(
            document,
            documentCache,
            cursorNode,
            new ExpressionTypeResolver(typeResolver),
            pos,
        );

        assertExpectedType(completions, MockPhpExecutor.classMap['App\\SomeClass']);
    });

    test('php completion for method return type', async () => {
        const typeResolver = new TypeResolver(new MockPhpExecutor);
        const document = await documentFromCodeWithTypeResolver(
            `{# @var something \\App\\SomeClass #}
            {{ something.getPerson(). }}`,
            typeResolver,
        );

        const documentCache = new DocumentCache({ name: '', uri: '' });
        documentCache.configure(MockEnvironment, typeResolver);

        const pos = {
            line: 1,
            character: document.text.split('\n')[1].lastIndexOf('.') + '.'.length,
        };
        const cursorNode = document.deepestAt(pos)!;

        const completions = await variableProperties(
            document,
            documentCache,
            cursorNode,
            new ExpressionTypeResolver(typeResolver),
            pos,
        );

        assertExpectedType(completions, MockPhpExecutor.classMap['App\\Person']);
    });

    test('php completion for something.getPerson (without parentheses)', async () => {
        const typeResolver = new TypeResolver(new MockPhpExecutor);
        const document = await documentFromCodeWithTypeResolver(
            `{# @var something \\App\\SomeClass #}
            {{ something.getPerson. }}`,
            typeResolver,
        );

        const documentCache = new DocumentCache({ name: '', uri: '' });
        documentCache.configure(MockEnvironment, typeResolver);

        const pos = {
            line: 1,
            character: document.text.split('\n')[1].lastIndexOf('.') + '.'.length,
        };
        const cursorNode = document.deepestAt(pos)!;

        const completions = await variableProperties(
            document,
            documentCache,
            cursorNode,
            new ExpressionTypeResolver(typeResolver),
            pos,
        );

        assertExpectedType(completions, MockPhpExecutor.classMap['App\\Person']);
    });

    test('php completion for deep properties', async () => {
        const typeResolver = new TypeResolver(new MockPhpExecutor);
        const document = await documentFromCodeWithTypeResolver(
            `{# @var something \\App\\SomeClass #}
            {{ something.getPerson().getOtherClass(). }}`,
            typeResolver,
        );

        const documentCache = new DocumentCache({ name: '', uri: '' });
        documentCache.configure(MockEnvironment, typeResolver);

        const pos = {
            line: 1,
            character: document.text.split('\n')[1].lastIndexOf('.') + '.'.length,
        };
        const cursorNode = document.deepestAt(pos)!;

        const completions = await variableProperties(
            document,
            documentCache,
            cursorNode,
            new ExpressionTypeResolver(typeResolver),
            pos,
        );

        assertExpectedType(completions, MockPhpExecutor.classMap['App\\OtherClass']);
    });

    test('php completion for method return type (recursive type)', async () => {
        const typeResolver = new TypeResolver(new MockPhpExecutor);
        const document = await documentFromCodeWithTypeResolver(
            `{# @var something \\App\\SomeClass #}
            {{ something.getPerson().getParent().getParent().getParent(). }}`,
            typeResolver,
        );

        const documentCache = new DocumentCache({ name: '', uri: '' });
        documentCache.configure(MockEnvironment, typeResolver);

        const pos = {
            line: 1,
            character: document.text.split('\n')[1].lastIndexOf('.') + '.'.length,
        };
        const cursorNode = document.deepestAt(pos)!;

        const completions = await variableProperties(
            document,
            documentCache,
            cursorNode,
            new ExpressionTypeResolver(typeResolver),
            pos,
        );

        assertExpectedType(completions, MockPhpExecutor.classMap['App\\Person']);
    });

    test('php completion for method return type saved to variable', async () => {
        const typeResolver = new TypeResolver(new MockPhpExecutor());
        const document = await documentFromCodeWithTypeResolver(
            `{# @var something \\App\\SomeClass #}
            {% set person = something.getPerson() %}
            {{ person. }}`,
            typeResolver,
        );

        const documentCache = new DocumentCache({ name: '', uri: '' });
        documentCache.configure(MockEnvironment, typeResolver);

        const pos = {
            line: 2,
            character: document.text.split('\n')[2].lastIndexOf('.') + '.'.length,
        };
        const cursorNode = document.deepestAt(pos)!;

        const completions = await variableProperties(
            document,
            documentCache,
            cursorNode,
            new ExpressionTypeResolver(typeResolver),
            pos,
        );

        assertExpectedType(completions, MockPhpExecutor.classMap['App\\Person']);
    });
});
