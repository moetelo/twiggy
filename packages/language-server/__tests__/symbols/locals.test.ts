import { describe, beforeAll, test } from 'bun:test';
import assert from 'node:assert/strict';
import Parser from 'web-tree-sitter';
import { LocalSymbolCollector } from 'symbols/LocalSymbolCollector';
import { LocalSymbolInformation } from 'symbols/types';
import { documentFromCode } from '../__helpers__/documentFromCode';
import { rangeOf, rangesOf } from '../__helpers__/fixtures';
import { initializeTestParser } from '../__helpers__/parser';

describe('locals', () => {
    let parser!: Parser;

    beforeAll(async () => {
        parser = await initializeTestParser();
    });

    const collect = async (code: string) => {
        const tree = parser.parse(code);
        return new LocalSymbolCollector(tree.rootNode, null).collect();
    };

    test('collects `set` variables', async () => {
        const code = `{% set variable0 = 123 %}{% set anotherVariable = 'asdf' %}`;
        const locals = await collect(code);

        assert.strictEqual(locals.variable.length, 2);
        assert.strictEqual(locals.variable[0].name, 'variable0');
        assert.strictEqual(locals.variable[1].name, 'anotherVariable');
        assert.deepStrictEqual(locals.variable[0].value, '123');
        assert.deepStrictEqual(locals.variable[1].value, "'asdf'");

        assert.deepEqual(locals.variable[0].nameRange, rangeOf(code, 'variable0'));
        assert.deepEqual(locals.variable[1].nameRange, rangeOf(code, 'anotherVariable'));
    });

    test('collects implicitly defined variables', async () => {
        const code = `{{ variable0 }}{{ anotherVariable }}{{ variable0 }}{{ anotherVariable }}`;
        const locals = await collect(code);

        assert.strictEqual(locals.variable.length, 2);
        assert.strictEqual(locals.variable[0].name, 'variable0');
        assert.strictEqual(locals.variable[1].name, 'anotherVariable');

        assert.deepEqual(locals.variable[0].nameRange, rangeOf(code, 'variable0'));
        assert.deepEqual(locals.variable[1].nameRange, rangeOf(code, 'anotherVariable'));

        assert.deepEqual(locals.variable[0].references, rangesOf(code, 'variable0'));
        assert.deepEqual(locals.variable[1].references, rangesOf(code, 'anotherVariable'));
    });

    test('collects implicitly defined variable reference inside of block', async () => {
        const code = `{{ variable0 }}{% block block1 %}{{ variable0 }}{% endblock %}`;
        const locals = await collect(code);

        assert.strictEqual(locals.variable.length, 1);
        const variable = locals.variable[0];
        assert.strictEqual(variable.name, 'variable0');

        assert.deepEqual(variable.nameRange, rangeOf(code, 'variable0'));
        assert.deepEqual(variable.references, rangesOf(code, 'variable0'));
    });

    const testOneVariable = async (varName: string, code: string, scope?: LocalSymbolInformation) => {
        if (!scope) {
            scope = await collect(code);
        }

        assert.strictEqual(scope.variable.length, 1);

        const variable = scope.variable[0];
        assert.strictEqual(variable.name, varName);
        assert.deepEqual(variable.nameRange, rangeOf(code, varName));

        return variable;
    };

    test('collects implicitly defined variable inside of if condition', async () => {
        const code = `{% if variable0 %}{{ variable0[0].prop }}{% endif %}{% if not variable0 %} var0 is falsy :( {% endif %}`;
        const variable = await testOneVariable('variable0', code);

        assert.deepEqual(variable.references, rangesOf(code, 'variable0'));
    });

    test('collects references inside of filter args', async () => {
        const code = `{% if variable0 %}{{ 'something'|trans({ prop1: variable0, prop2: 123 }) }}{% endif %}`;
        const document = await documentFromCode(code);

        const variable = document.locals.variable[0];
        assert.strictEqual(variable.name, 'variable0');
        assert.deepEqual(variable.references, rangesOf(code, 'variable0'));
    });

    test('collects implicitly defined variable inside of block', async () => {
        const code = `{% block block1 %}{{ variable0.hello }} {% if variable0 %}var0 is truthy!{% endif %} {% endblock %}`;
        const locals = await collect(code);
        const variable = await testOneVariable('variable0', code, locals.block[0].symbols);

        assert.deepEqual(variable.references, rangesOf(code, 'variable0'));
    });

    test('collects implicitly defined variable inside of the second block', async () => {
        const code = `{% block block1 %}{% endblock %}{% block block2 %}{{ variable0.hello }} {% if variable0 %}var0 is truthy!{% endif %} {% endblock %}`;
        const locals = await collect(code);
        const variable = await testOneVariable('variable0', code, locals.block[1].symbols);

        assert.deepEqual(variable.references, rangesOf(code, 'variable0'));
    });

    test('collects implicitly defined variable inside of set assignment', async () => {
        const code = `{% set canEdit = post.author.id == 1 %}`;
        const locals = await collect(code);

        assert.strictEqual(locals.variable.length, 2);
        assert.strictEqual(locals.variable[0].name, 'canEdit');
        assert.strictEqual(locals.variable[1].name, 'post');
    });

    test('collects variables defined inside of for', async () => {
        const keyVar = 'keyInList';
        const itemVar = 'itemInList';
        const listVar = 'items';
        const code = `{% for ${keyVar}, ${itemVar} in ${listVar} %}{{ ${keyVar} }}{{ ${itemVar}.prop }}{{ count(${listVar}) }}{% endfor %}`;
        const locals = await collect(code);

        assert.strictEqual(locals.variable.length, 3);

        const varNames = [keyVar, itemVar, listVar] as const;
        for (let i = 0; i < locals.variable.length; i++) {
            const variable = locals.variable[i];
            const varName = varNames[i];

            assert.strictEqual(variable.name, varName, varName + ' name');
            assert.deepEqual(variable.nameRange, rangeOf(code, varName), varName + ' nameRange');

            // for-loop key/item declarations don't show up in `references`; other vars do
            const isForLoopVar = varName === keyVar || varName === itemVar;
            const expected = isForLoopVar
                ? rangesOf(code, varName).slice(1)
                : rangesOf(code, varName);
            assert.deepEqual(variable.references, expected, varName + ' references');
        }
    });
});
