import { describe, test, before } from 'node:test'
import * as assert from 'node:assert/strict'
import { filters } from '../src/completions/filters';
import Parser from 'web-tree-sitter';
import { twigFilters } from '../src/staticCompletionInfo';
import { localVariables } from '../src/completions/local-variables';
import { CompletionItemKind } from 'vscode-languageserver';
import { documentFromCode, initializeTestParser } from './utils';
import { Document } from '../src/documents/Document';
import { variableProperties } from '../src/completions/variableProperties';
import { DocumentCache } from '../src/documents/DocumentCache';
import { MockEnvironment } from './mocks';

describe('completion', () => {
    let parser!: Parser;

    before(async () => {
        parser = await initializeTestParser();
    });

    test('in empty output, {{| }}', () => {
        const code = `{% set variable = 123 %}{{ }}`;
        const document = documentFromCode(code);

        const completions = localVariables(
            document,
            document.deepestAt({ line: 0, character: `{% set variable = 123 %}{{`.length })!,
        );

        const completionFound = completions.find((item) => item.label === 'variable');
        assert.ok(completionFound, 'variable not in completions.');
    });

    test('in empty output, {{ |}}', () => {
        const code = `{% set variable = 123 %}{{ }}`;
        const document = documentFromCode(code);

        const completions = localVariables(
            document,
            document.deepestAt({ line: 0, character: `{% set variable = 123 %}{{ `.length })!,
        );

        const completionFound = completions.find((item) => item.label === 'variable');
        assert.ok(completionFound, 'variable not in completions.');
    });

    test('in empty if, {% if | %}', () => {
        const code = `{% set var = 1 %}{% if  %}{% endif %}`;
        const document = documentFromCode(code);

        const completions = localVariables(
            document,
            document.deepestAt({ line: 0, character: `{% set var = 1 %}{% if `.length })!,
        );

        assert.equal(completions[0]?.label, 'var');
    });

    test('in empty for, {% for el in | %}', () => {
        const code = `{% set users = [1, 2] %}{% for u in  %}{% endfor %}`;
        const document = documentFromCode(code);

        const completions = localVariables(
            document,
            document.deepestAt({ line: 0, character: `{% set users = [1, 2] %}{% for u in `.length })!,
        );

        assert.equal(completions[0]?.label, 'users');
    });

    test('localVariables', () => {
        const code = `{% set variable = 123 %}{{ v^ }}`;
        const document = documentFromCode(code);

        const completions = localVariables(
            document,
            document.deepestAt({ line: 0, character: code.indexOf('^') })!,
        );

        const completionFound = completions.find((item) => item.label === 'variable');
        assert.ok(completionFound, 'variable not in completions.');
        assert.ok(completionFound.detail === '123', 'variable value not in completions.');
        assert.ok(completionFound.kind === CompletionItemKind.Field, 'wrong variable type.');
    });

    test('macroses (list imports)', () => {
        const variableName = 'components';
        const document = documentFromCode(
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

    test('filters', () => {
        const code = `{{ something|^ }}`;
        const document = documentFromCode(code);
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
        const documentWithMacroUsage = documentFromCode(
            `{% macro test() %}
                {% import 'components.html.twig' as components %}
                {{ components. }}
            {% endmacro %}`,
            'documentWithMacroUsage.html.twig',
        );
        const importedDocument = documentFromCode(
            `{% macro new_macro() %}
                ...
            {% endmacro %}`,
            'components.html.twig',
        );

        const documentCache = new DocumentCache({ name: '', uri: '' });
        documentCache.configure(MockEnvironment);
        documentCache.updateText(documentWithMacroUsage.uri, documentWithMacroUsage.text);
        documentCache.updateText(importedDocument.uri, importedDocument.text);

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
});
